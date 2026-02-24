import math

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.boleto import Boleto
from app.models.category import Category
from app.models.user import User
from app.schemas.boleto import BoletoListResponse, BoletoResponse, BoletoUpdate, CategoryResponse
from app.services.boleto_parser import sync_boletos_from_gmail
from app.utils.security import get_current_user

router = APIRouter()


@router.get("", response_model=BoletoListResponse)
async def list_boletos(
    status: str | None = Query(None),
    category_id: str | None = Query(None),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Boleto).options(selectinload(Boleto.category)).where(Boleto.user_id == user.id)
    count_query = select(func.count()).select_from(Boleto).where(Boleto.user_id == user.id)

    if status:
        query = query.where(Boleto.status == status)
        count_query = count_query.where(Boleto.status == status)
    if category_id:
        query = query.where(Boleto.category_id == category_id)
        count_query = count_query.where(Boleto.category_id == category_id)
    if search:
        search_filter = Boleto.sender_name.ilike(f"%{search}%") | Boleto.description.ilike(f"%{search}%")
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    total = (await db.execute(count_query)).scalar() or 0
    query = query.order_by(Boleto.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    items = list(result.scalars().all())

    return BoletoListResponse(
        items=items,
        total=total,
        page=page,
        pages=math.ceil(total / per_page) if total > 0 else 1,
    )


@router.get("/categories", response_model=list[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).order_by(Category.name))
    return list(result.scalars().all())


@router.get("/{boleto_id}", response_model=BoletoResponse)
async def get_boleto(
    boleto_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Boleto).options(selectinload(Boleto.category)).where(Boleto.id == boleto_id, Boleto.user_id == user.id)
    )
    boleto = result.scalar_one_or_none()
    if not boleto:
        raise HTTPException(status_code=404, detail="Boleto not found")
    return boleto


@router.patch("/{boleto_id}", response_model=BoletoResponse)
async def update_boleto(
    boleto_id: str,
    data: BoletoUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Boleto).options(selectinload(Boleto.category)).where(Boleto.id == boleto_id, Boleto.user_id == user.id)
    )
    boleto = result.scalar_one_or_none()
    if not boleto:
        raise HTTPException(status_code=404, detail="Boleto not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(boleto, key, value)

    await db.flush()
    return boleto


@router.post("/sync")
async def sync_from_gmail(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user.gmail_connected or not user.gmail_refresh_token:
        raise HTTPException(status_code=400, detail="Gmail not connected")

    new_boletos = await sync_boletos_from_gmail(user.id, user.gmail_refresh_token, db)
    return {"synced": len(new_boletos), "message": f"{len(new_boletos)} new boletos imported"}
