import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class PaymentCreate(BaseModel):
    boleto_id: uuid.UUID


class PaymentResponse(BaseModel):
    id: uuid.UUID
    boleto_id: uuid.UUID
    user_id: uuid.UUID
    stripe_payment_id: str | None
    amount: Decimal
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PaymentIntentResponse(BaseModel):
    payment_id: uuid.UUID
    client_secret: str
    amount: Decimal


class DashboardSummary(BaseModel):
    total_pending: int
    total_paid: int
    total_overdue: int
    amount_pending: Decimal
    amount_paid: Decimal
    amount_overdue: Decimal
    monthly_spending: list[dict]
    spending_by_category: list[dict]
    recent_boletos: list[dict]
    upcoming_due: list[dict]
