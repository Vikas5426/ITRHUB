from collections.abc import AsyncGenerator
from functools import lru_cache
from typing import Any

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings


class Base(DeclarativeBase):
	pass


@lru_cache
def get_engine() -> AsyncEngine:
	settings = get_settings()
	url = settings.effective_database_url


	connect_args: dict[str, Any] = {}
	engine_kwargs: dict[str, Any] = {
		"echo": False,
		"future": True,
	}

	if "sqlite" in url:
		connect_args["check_same_thread"] = False
	else:
		# PostgreSQL / Supabase connection pooling & health checks
		engine_kwargs["pool_pre_ping"] = True
		engine_kwargs["pool_recycle"] = 300

		# Supabase pooler (port 6543 / Supavisor / pgBouncer) requires statement cache to be disabled
		if "pooler.supabase.com" in url or ":6543" in url:
			connect_args["statement_cache_size"] = 0

		# Require SSL for Supabase connections
		if "supabase.co" in url or "pooler.supabase.com" in url:
			if "ssl=" not in url:
				connect_args["ssl"] = "require"

	if connect_args:
		engine_kwargs["connect_args"] = connect_args

	return create_async_engine(url, **engine_kwargs)


@lru_cache
def get_session_maker():
	return async_sessionmaker(get_engine(), expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
	session_maker = get_session_maker()
	async with session_maker() as session:
		yield session

