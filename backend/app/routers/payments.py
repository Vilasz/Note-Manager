import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.boleto import Boleto
from app.models.payment import Payment
from app.models.user import User
from app.schemas.payment import PaymentCreate, PaymentIntentResponse, PaymentResponse
from app.services.stripe_service import construct_webhook_event, create_payment_intent, retrieve_payment_intent
from app.utils.security import get_current_user

router = APIRouter()


@router.post("/create", response_model=PaymentIntentResponse)
async def create_payment(
    data: PaymentCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Boleto).where(Boleto.id == data.boleto_id, Boleto.user_id == user.id)
    )
    boleto = result.scalar_one_or_none()
    if not boleto:
        raise HTTPException(status_code=404, detail="Boleto not found")
    if boleto.status == "paid":
        raise HTTPException(status_code=400, detail="Boleto already paid")

    intent_data = await create_payment_intent(
        amount=boleto.amount,
        metadata={"boleto_id": str(boleto.id), "user_id": str(user.id)},
    )

    payment = Payment(
        boleto_id=boleto.id,
        user_id=user.id,
        stripe_payment_id=intent_data["id"],
        amount=boleto.amount,
        status="pending",
    )
    db.add(payment)
    await db.flush()

    return PaymentIntentResponse(
        payment_id=payment.id,
        client_secret=intent_data["client_secret"],
        amount=boleto.amount,
    )


@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = construct_webhook_event(payload, sig_header)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    if event.type == "payment_intent.succeeded":
        intent = event.data.object
        boleto_id = intent.metadata.get("boleto_id")
        if boleto_id:
            result = await db.execute(select(Boleto).where(Boleto.id == uuid.UUID(boleto_id)))
            boleto = result.scalar_one_or_none()
            if boleto:
                boleto.status = "paid"
                boleto.paid_at = datetime.utcnow()

            pay_result = await db.execute(
                select(Payment).where(Payment.stripe_payment_id == intent.id)
            )
            payment = pay_result.scalar_one_or_none()
            if payment:
                payment.status = "succeeded"
                payment.stripe_response = {"id": intent.id, "status": intent.status}

    return {"received": True}


@router.get("", response_model=list[PaymentResponse])
async def list_payments(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Payment).where(Payment.user_id == user.id).order_by(Payment.created_at.desc())
    )
    return list(result.scalars().all())


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Payment).where(Payment.id == payment_id, Payment.user_id == user.id)
    )
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment
