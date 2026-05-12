from collections.abc import AsyncGenerator
from functools import lru_cache

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings


class Base(DeclarativeBase):
	pass


@lru_cache
def get_engine():
	settings = get_settings()
	return create_async_engine(settings.database_url, echo=False, future=True)


@lru_cache
def get_session_maker():
	return async_sessionmaker(get_engine(), expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
	session_maker = get_session_maker()
	async with session_maker() as session:
		yield session
