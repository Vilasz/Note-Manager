from datetime import date, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import case, extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.boleto import Boleto
from app.models.category import Category
from app.models.user import User
from app.schemas.payment import DashboardSummary
from app.utils.security import get_current_user

router = APIRouter()


@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    base = select(Boleto).where(Boleto.user_id == user.id)
    today = date.today()

    pending_q = await db.execute(
        select(func.count(), func.coalesce(func.sum(Boleto.amount), 0))
        .select_from(Boleto)
        .where(Boleto.user_id == user.id, Boleto.status == "pending", (Boleto.due_date >= today) | (Boleto.due_date.is_(None)))
    )
    pending_row = pending_q.one()

    paid_q = await db.execute(
        select(func.count(), func.coalesce(func.sum(Boleto.amount), 0))
        .select_from(Boleto)
        .where(Boleto.user_id == user.id, Boleto.status == "paid")
    )
    paid_row = paid_q.one()

    overdue_q = await db.execute(
        select(func.count(), func.coalesce(func.sum(Boleto.amount), 0))
        .select_from(Boleto)
        .where(Boleto.user_id == user.id, Boleto.status == "pending", Boleto.due_date < today)
    )
    overdue_row = overdue_q.one()

    six_months_ago = today - timedelta(days=180)
    monthly_q = await db.execute(
        select(
            extract("year", Boleto.paid_at).label("year"),
            extract("month", Boleto.paid_at).label("month"),
            func.sum(Boleto.amount).label("total"),
        )
        .where(Boleto.user_id == user.id, Boleto.status == "paid", Boleto.paid_at >= six_months_ago)
        .group_by("year", "month")
        .order_by("year", "month")
    )
    monthly_spending = [
        {"year": int(r.year), "month": int(r.month), "total": float(r.total)}
        for r in monthly_q.all()
    ]

    cat_q = await db.execute(
        select(Category.name, Category.color, func.sum(Boleto.amount).label("total"))
        .join(Category, Boleto.category_id == Category.id)
        .where(Boleto.user_id == user.id)
        .group_by(Category.name, Category.color)
        .order_by(func.sum(Boleto.amount).desc())
    )
    spending_by_category = [
        {"name": r.name, "color": r.color, "total": float(r.total)}
        for r in cat_q.all()
    ]

    recent_q = await db.execute(
        select(Boleto)
        .where(Boleto.user_id == user.id)
        .order_by(Boleto.created_at.desc())
        .limit(5)
    )
    recent_boletos = [
        {
            "id": str(b.id),
            "sender_name": b.sender_name,
            "amount": float(b.amount),
            "status": b.status,
            "due_date": b.due_date.isoformat() if b.due_date else None,
        }
        for b in recent_q.scalars().all()
    ]

    upcoming_q = await db.execute(
        select(Boleto)
        .where(Boleto.user_id == user.id, Boleto.status == "pending", Boleto.due_date >= today)
        .order_by(Boleto.due_date)
        .limit(5)
    )
    upcoming_due = [
        {
            "id": str(b.id),
            "sender_name": b.sender_name,
            "amount": float(b.amount),
            "due_date": b.due_date.isoformat() if b.due_date else None,
        }
        for b in upcoming_q.scalars().all()
    ]

    return DashboardSummary(
        total_pending=pending_row[0],
        total_paid=paid_row[0],
        total_overdue=overdue_row[0],
        amount_pending=Decimal(str(pending_row[1])),
        amount_paid=Decimal(str(paid_row[1])),
        amount_overdue=Decimal(str(overdue_row[1])),
        monthly_spending=monthly_spending,
        spending_by_category=spending_by_category,
        recent_boletos=recent_boletos,
        upcoming_due=upcoming_due,
    )
