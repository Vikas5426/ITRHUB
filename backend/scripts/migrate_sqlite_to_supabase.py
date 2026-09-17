"""
Data migration script to migrate records from local SQLite (itrhub.db) to Supabase PostgreSQL.

Usage:
    # Uses DATABASE_URL from .env:
    python scripts/migrate_sqlite_to_supabase.py

    # Or provide an explicit target Supabase URL:
    python scripts/migrate_sqlite_to_supabase.py --target-url "postgresql+asyncpg://postgres.[REF]:[PASS]@[HOST]:6543/postgres"
"""

import argparse
import asyncio
import json
import os
import sqlite3
import sys
from pathlib import Path
from typing import Any
from dateutil import parser as dt_parser

# Ensure app package is importable
current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import get_settings
from app.core.database import Base
from app.models.user import (
	AIConversation,
	AIMessageRecord,
	FilingDocument,
	FilingWorkspace,
	TaxpayerProfile,
	User,
)


def get_sqlite_records(sqlite_path: str, table_name: str) -> list[dict[str, Any]]:
	"""Fetch all records from a SQLite table as a list of dicts."""
	if not os.path.exists(sqlite_path):
		return []

	con = sqlite3.connect(sqlite_path)
	con.row_factory = sqlite3.Row
	cur = con.cursor()
	try:
		cur.execute(f"SELECT * FROM {table_name}")
		rows = [dict(row) for row in cur.fetchall()]
		return rows
	except sqlite3.OperationalError:
		return []
	finally:
		con.close()


def clean_row(row: dict[str, Any], model_cls) -> dict[str, Any]:
	"""Convert raw SQLite string representations into typed Python objects for PostgreSQL."""
	cleaned = dict(row)
	for col in model_cls.__table__.columns:
		col_name = col.name
		val = cleaned.get(col_name)
		if val is None:
			continue
		col_type = type(col.type).__name__
		if "DateTime" in col_type and isinstance(val, str):
			try:
				cleaned[col_name] = dt_parser.parse(val)
			except Exception:
				pass
		elif "Date" in col_type and isinstance(val, str):
			try:
				cleaned[col_name] = dt_parser.parse(val).date()
			except Exception:
				pass
		elif "Boolean" in col_type and isinstance(val, int):
			cleaned[col_name] = bool(val)
		elif "JSON" in col_type and isinstance(val, str):
			try:
				cleaned[col_name] = json.loads(val)
			except Exception:
				pass
	return cleaned


async def migrate_data(sqlite_path: str, target_url: str):
	print(f"\n=======================================================")
	print(f"🚀 Starting Migration: SQLite -> Supabase PostgreSQL")
	print(f"=======================================================")
	print(f"📂 Source SQLite DB: {sqlite_path}")

	# Mask password in URL for display
	display_url = target_url
	if "@" in display_url:
		creds, host = display_url.split("@", 1)
		if ":" in creds:
			prefix, user = creds.split("://", 1)[0], creds.split("://", 1)[1].split(":", 1)[0]
			display_url = f"{prefix}://{user}:****@{host}"
	print(f"🎯 Target Supabase DB: {display_url}\n")

	if not os.path.exists(sqlite_path):
		print(f"❌ Source file not found: {sqlite_path}")
		return

	# Normalize driver
	if target_url.startswith("postgres://"):
		target_url = "postgresql+asyncpg://" + target_url[len("postgres://"):]
	elif target_url.startswith("postgresql://"):
		target_url = "postgresql+asyncpg://" + target_url[len("postgresql://"):]

	connect_args = {}
	if "pooler.supabase.com" in target_url or ":6543" in target_url:
		connect_args["statement_cache_size"] = 0
	if "supabase.co" in target_url or "pooler.supabase.com" in target_url:
		if "ssl=" not in target_url:
			connect_args["ssl"] = "require"

	engine = create_async_engine(
		target_url,
		connect_args=connect_args,
		pool_pre_ping=True,
		future=True,
	)

	# 1. Create tables in Supabase if they don't already exist
	print("📦 Verifying / creating tables in Supabase...")
	async with engine.begin() as conn:
		await conn.run_sync(Base.metadata.create_all)
	print("✅ Target tables ready.\n")

	session_maker = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

	tables_order = [
		("users", User),
		("taxpayer_profiles", TaxpayerProfile),
		("filing_workspaces", FilingWorkspace),
		("filing_documents", FilingDocument),
		("ai_conversations", AIConversation),
		("ai_messages", AIMessageRecord),
	]

	async with session_maker() as session:
		for table_name, model_cls in tables_order:
			records = get_sqlite_records(sqlite_path, table_name)
			if not records:
				print(f"ℹ️  Table '{table_name}': 0 rows to migrate.")
				continue

			print(f"⏳ Migrating '{table_name}' ({len(records)} rows)...")
			migrated_count = 0
			for row in records:
				# Check if record already exists by ID
				existing = await session.get(model_cls, row.get("id"))
				if existing:
					continue

				typed_row = clean_row(row, model_cls)
				obj = model_cls(**typed_row)
				session.add(obj)
				migrated_count += 1

			await session.commit()
			print(f"✅ '{table_name}': successfully migrated {migrated_count} new records.")

			# Reset PostgreSQL sequence if on PostgreSQL
			if "postgresql" in target_url:
				try:
					seq_sql = text(
						f"SELECT setval(pg_get_serial_sequence('{table_name}', 'id'), "
						f"COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM {table_name};"
					)
					await session.execute(seq_sql)
					await session.commit()
				except Exception as e:
					pass

	await engine.dispose()
	print(f"\n🎉 Migration to Supabase completed successfully!")


def main():
	parser = argparse.ArgumentParser(description="Migrate SQLite data to Supabase PostgreSQL.")
	parser.add_argument(
		"--sqlite-path",
		default=str(backend_dir / "itrhub.db"),
		help="Path to the SQLite database file (default: backend/itrhub.db)",
	)
	parser.add_argument(
		"--target-url",
		default=None,
		help="Target database URL (default: DATABASE_URL from .env or settings)",
	)
	args = parser.parse_args()

	target_url = args.target_url
	if not target_url:
		settings = get_settings()
		target_url = settings.effective_database_url

	if "sqlite" in target_url:
		print("⚠️  Target database URL is currently pointing to SQLite.")
		print("👉 Please set DATABASE_URL in ITRHUB/backend/.env with your Supabase PostgreSQL URI,")
		print("   or pass --target-url 'postgresql+asyncpg://...' to this script.")
		return

	asyncio.run(migrate_data(args.sqlite_path, target_url))


if __name__ == "__main__":
	main()
