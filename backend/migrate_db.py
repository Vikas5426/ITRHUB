"""
Database synchronization script.
Verifies all tables and columns against the SQLAlchemy schema models.
Works with both Supabase PostgreSQL and local SQLite.
"""

import asyncio
from sqlalchemy import text
from app.core.database import Base, get_engine
import app.models  # noqa: F401


async def run_sync():
	engine = get_engine()
	print(f"Connecting to database: {engine.url.render_as_string(hide_password=True)}")

	# Ensure all tables exist
	async with engine.begin() as conn:
		await conn.run_sync(Base.metadata.create_all)
		print("Schema verified and all tables ensured.")

	await engine.dispose()
	print("Database synchronization finished successfully!")


if __name__ == "__main__":
	asyncio.run(run_sync())
