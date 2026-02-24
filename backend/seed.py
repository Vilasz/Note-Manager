"""Seed default categories into the database."""
import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import Base, async_session, engine
from app.models.category import Category

DEFAULT_CATEGORIES = [
    {"name": "Fornecedores de Alimentos", "color": "#ef4444", "icon": "utensils", "is_default": True},
    {"name": "Bebidas", "color": "#f97316", "icon": "wine", "is_default": True},
    {"name": "Utilities", "color": "#eab308", "icon": "zap", "is_default": True},
    {"name": "Aluguel", "color": "#22c55e", "icon": "home", "is_default": True},
    {"name": "Equipamentos", "color": "#06b6d4", "icon": "wrench", "is_default": True},
    {"name": "Serviços", "color": "#8b5cf6", "icon": "briefcase", "is_default": True},
    {"name": "Impostos", "color": "#ec4899", "icon": "landmark", "is_default": True},
    {"name": "Outros", "color": "#6b7280", "icon": "receipt", "is_default": True},
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        for cat_data in DEFAULT_CATEGORIES:
            result = await session.execute(select(Category).where(Category.name == cat_data["name"]))
            if not result.scalar_one_or_none():
                session.add(Category(**cat_data))
        await session.commit()
        print(f"Seeded {len(DEFAULT_CATEGORIES)} default categories.")


if __name__ == "__main__":
    asyncio.run(seed())
