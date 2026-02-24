import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel


class CategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    color: str
    icon: str
    is_default: bool

    model_config = {"from_attributes": True}


class BoletoResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    category_id: uuid.UUID | None
    category: CategoryResponse | None = None
    status: str
    sender_name: str | None
    sender_document: str | None
    amount: Decimal
    due_date: date | None
    barcode: str | None
    description: str | None
    ai_extracted_data: dict | None
    gmail_message_id: str | None
    attachment_filename: str | None
    received_at: datetime | None
    paid_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class BoletoUpdate(BaseModel):
    category_id: uuid.UUID | None = None
    sender_name: str | None = None
    amount: Decimal | None = None
    due_date: date | None = None
    description: str | None = None
    status: str | None = None


class BoletoListResponse(BaseModel):
    items: list[BoletoResponse]
    total: int
    page: int
    pages: int
