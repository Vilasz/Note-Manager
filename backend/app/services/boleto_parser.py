import logging
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.boleto import Boleto
from app.models.category import Category
from app.services.ai_service import extract_boleto_data
from app.services.gmail_service import extract_text_from_pdf, fetch_emails_with_attachments, mark_email_as_read
from app.utils.prompts import CATEGORY_KEYWORDS

logger = logging.getLogger(__name__)


def match_category_by_keywords(text: str, categories: list[Category]) -> Category | None:
    text_lower = text.lower()
    for cat in categories:
        keywords = CATEGORY_KEYWORDS.get(cat.name, [])
        if any(kw in text_lower for kw in keywords):
            return cat
    return None


async def sync_boletos_from_gmail(user_id, refresh_token: str, db: AsyncSession) -> list[Boleto]:
    emails = fetch_emails_with_attachments(refresh_token)
    categories_result = await db.execute(select(Category))
    categories = list(categories_result.scalars().all())

    new_boletos = []
    for email_data in emails:
        existing = await db.execute(
            select(Boleto).where(
                Boleto.gmail_message_id == email_data["message_id"],
                Boleto.user_id == user_id,
            )
        )
        if existing.scalar_one_or_none():
            continue

        for attachment in email_data["attachments"]:
            try:
                pdf_text = extract_text_from_pdf(attachment["data"])
                content = pdf_text if pdf_text.strip() else email_data["body"]

                ai_data = await extract_boleto_data(
                    content=content,
                    subject=email_data["subject"],
                    sender=email_data["sender"],
                    date=email_data["date"],
                )

                category = None
                suggested = ai_data.get("category_suggestion", "")
                for cat in categories:
                    if cat.name == suggested:
                        category = cat
                        break
                if not category:
                    combined = f"{ai_data.get('sender_name', '')} {ai_data.get('description', '')}"
                    category = match_category_by_keywords(combined, categories)
                if not category:
                    for cat in categories:
                        if cat.name == "Outros":
                            category = cat
                            break

                due_date = None
                if ai_data.get("due_date"):
                    try:
                        due_date = date.fromisoformat(ai_data["due_date"])
                    except (ValueError, TypeError):
                        pass

                boleto = Boleto(
                    user_id=user_id,
                    category_id=category.id if category else None,
                    status="pending",
                    sender_name=ai_data.get("sender_name"),
                    sender_document=ai_data.get("sender_document"),
                    amount=ai_data.get("amount", 0),
                    due_date=due_date,
                    barcode=ai_data.get("barcode"),
                    description=ai_data.get("description"),
                    ai_extracted_data=ai_data,
                    gmail_message_id=email_data["message_id"],
                    attachment_filename=attachment["filename"],
                    attachment_data=attachment["data"],
                    received_at=None,
                )
                db.add(boleto)
                new_boletos.append(boleto)

                try:
                    mark_email_as_read(refresh_token, email_data["message_id"])
                except Exception as e:
                    logger.warning(f"Failed to mark email as read: {e}")

            except Exception as e:
                logger.error(f"Failed to process attachment {attachment['filename']}: {e}")
                continue

    await db.flush()
    return new_boletos
