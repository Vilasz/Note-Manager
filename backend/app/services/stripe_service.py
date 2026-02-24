import logging
from decimal import Decimal

import stripe

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

stripe.api_key = settings.STRIPE_SECRET_KEY


async def create_payment_intent(amount: Decimal, metadata: dict | None = None) -> dict:
    amount_cents = int(amount * 100)
    intent = stripe.PaymentIntent.create(
        amount=amount_cents,
        currency="brl",
        metadata=metadata or {},
        automatic_payment_methods={"enabled": True},
    )
    return {
        "id": intent.id,
        "client_secret": intent.client_secret,
        "amount": amount,
        "status": intent.status,
    }


async def retrieve_payment_intent(payment_intent_id: str) -> dict:
    intent = stripe.PaymentIntent.retrieve(payment_intent_id)
    return {
        "id": intent.id,
        "status": intent.status,
        "amount": Decimal(intent.amount) / 100,
        "metadata": intent.metadata,
    }


def construct_webhook_event(payload: bytes, sig_header: str) -> stripe.Event:
    return stripe.Webhook.construct_event(
        payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
    )
