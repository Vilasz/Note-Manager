from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models.user import User
from app.services.gmail_service import exchange_code, get_auth_url
from app.utils.security import get_current_user

router = APIRouter()
settings = get_settings()


@router.get("/auth-url")
async def gmail_auth_url(user: User = Depends(get_current_user)):
    url = get_auth_url()
    return {"auth_url": url}


@router.get("/callback")
async def gmail_callback(code: str, db: AsyncSession = Depends(get_db)):
    try:
        token_data = exchange_code(code)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to exchange code: {e}")

    return RedirectResponse(
        url=f"{settings.FRONTEND_URL}/settings?gmail=connected&refresh_token={token_data['refresh_token']}"
    )


@router.post("/connect")
async def connect_gmail(
    refresh_token: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user.gmail_refresh_token = refresh_token
    user.gmail_connected = True
    await db.flush()
    return {"status": "connected"}


@router.post("/disconnect")
async def disconnect_gmail(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user.gmail_refresh_token = None
    user.gmail_connected = False
    await db.flush()
    return {"status": "disconnected"}
