import asyncio
import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.database import Base
from app.core.security import encrypt_document
from app.models.user import FilingDocument, FilingWorkspace, TaxpayerProfile, User
from app.services.ai_tools import AIToolExecutor


@pytest.fixture
def test_db_session(tmp_path):
	database_path = tmp_path / "ai-context-test.db"
	engine = create_async_engine(f"sqlite+aiosqlite:///{database_path}")
	session_maker = async_sessionmaker(engine, expire_on_commit=False)

	async def prepare():
		async with engine.begin() as conn:
			await conn.run_sync(Base.metadata.create_all)
		async with session_maker() as session:
			# Setup User 1 with Tax Profile, Workspace, and Documents
			u1 = User(id=1, email="user1@example.com", full_name="User One", password_hash="hash")
			u2 = User(id=2, email="user2@example.com", full_name="User Two", password_hash="hash")
			session.add_all([u1, u2])
			await session.flush()

			p1 = TaxpayerProfile(
				id=1,
				owner_id=1,
				display_name="User One Primary",
				entity_type="individual",
				pan_last_four="1234",
				residency_status="resident",
				is_primary=True,
			)
			session.add(p1)
			await session.flush()

			w1 = FilingWorkspace(
				id=1,
				profile_id=1,
				assessment_year_start=2026,
				itr_form="ITR-1",
				status="in_progress",
				current_section="income",
				completion_percent=45,
				progress_data={
					"income_sources": {
						"salary": {"enabled": True, "gross_salary": 1200000.0, "tds": 85000.0},
						"capital_gains": {
							"enabled": True,
							"listed_equity_stcg": 50000.0,
							"listed_equity_ltcg": 150000.0,
							"property_gains": 0.0,
							"crypto_vda_gains": 0.0,
						},
						"other": {"interest_income": 25000.0, "dividend_income": 5000.0, "other_income": 0.0},
					},
					"deductions": {
						"sec_80c": 150000.0,
						"sec_80d_self": 25000.0,
						"sec_80ccd_1b": 50000.0,
						"hra_exemption": 0.0,
					},
				},
			)
			session.add(w1)
			await session.flush()

			# Add encrypted test document for User 1
			form16_text = b"Form 16 Certificate of Tax Deducted at Source\nGross Salary: INR 1200000\nTotal TDS Deducted: INR 85000\nEmployer: Tech Corp India"
			doc1 = FilingDocument(
				id=1,
				workspace_id=1,
				category="form_16",
				original_name="Form16_AY2026-27.csv",
				content_type="text/csv",
				size_bytes=len(form16_text),
				sha256="dummy_sha256_hash_12345",
				encrypted_content=encrypt_document(form16_text),
			)
			session.add(doc1)
			await session.commit()

	asyncio.run(prepare())

	yield session_maker

	asyncio.run(engine.dispose())


def test_ai_tools_tax_profile(test_db_session):
	async def run():
		async with test_db_session() as session:
			executor = AIToolExecutor(user_id=1, db=session)
			profile = await executor.execute_tool("get_user_tax_profile", {})
			assert profile["display_name"] == "User One Primary"
			assert profile["entity_type"] == "individual"
			assert profile["pan_masked"] == "XXXX1234"
	asyncio.run(run())


def test_ai_tools_tax_summary(test_db_session):
	async def run():
		async with test_db_session() as session:
			executor = AIToolExecutor(user_id=1, db=session)
			summary = await executor.execute_tool("get_tax_summary", {})
			assert summary["gross_total_income"] == 1430000.0  # 1200000 + 200000 (CG) + 30000 (Other)
			assert summary["tds_deposited"] == 85000.0
			assert summary["deductions_claimed"]["section_80c"] == 150000.0
			assert summary["deductions_claimed"]["section_80d"] == 25000.0
			assert "new_regime_tax" in summary
			assert "old_regime_tax" in summary
			assert summary["cheaper_regime"] in ["new", "old"]
	asyncio.run(run())


def test_ai_tools_capital_gains(test_db_session):
	async def run():
		async with test_db_session() as session:
			executor = AIToolExecutor(user_id=1, db=session)
			cg = await executor.execute_tool("get_user_capital_gains", {})
			assert cg["enabled"] is True
			assert cg["listed_equity_stcg_sec111a"] == 50000.0
			assert cg["listed_equity_ltcg_sec112a"] == 150000.0
	asyncio.run(run())


def test_ai_tools_query_user_documents(test_db_session):
	async def run():
		async with test_db_session() as session:
			executor = AIToolExecutor(user_id=1, db=session)
			res = await executor.execute_tool("query_user_documents", {"query": "Gross Salary"})
			assert res["status"] == "success"
			assert res["document_count_searched"] >= 1
			assert len(res["matches"]) >= 1
			assert res["matches"][0]["document_name"] == "Form16_AY2026-27.csv"
	asyncio.run(run())


def test_ai_tools_multi_tenant_isolation(test_db_session):
	async def run():
		async with test_db_session() as session:
			# User 2 should NOT see User 1's profile, workspace, or documents
			executor_u2 = AIToolExecutor(user_id=2, db=session)
			prof_u2 = await executor_u2.execute_tool("get_user_tax_profile", {})
			assert prof_u2.get("status") == "no_profile_found"

			summary_u2 = await executor_u2.execute_tool("get_tax_summary", {})
			assert summary_u2.get("status") == "no_workspace_data"

			docs_u2 = await executor_u2.execute_tool("query_user_documents", {"query": "Salary"})
			assert docs_u2.get("status") == "no_documents_found"
	asyncio.run(run())
