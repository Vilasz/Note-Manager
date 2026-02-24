import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text, LargeBinary
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Boleto(Base):
    __tablename__ = "boletos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    category_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)

    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    sender_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sender_document: Mapped[str | None] = mapped_column(String(20), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    barcode: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_extracted_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    gmail_message_id: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True)
    attachment_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    attachment_data: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)

    received_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="boletos")
    category: Mapped["Category | None"] = relationship(back_populates="boletos")
    payment: Mapped["Payment | None"] = relationship(back_populates="boleto", uselist=False)
