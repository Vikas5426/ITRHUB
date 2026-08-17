import asyncio
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.core.security import create_access_token
from app.main import app
from app.models.user import (
	AIConversation,
	AIMessageRecord,
	FilingWorkspace,
	TaxpayerProfile,
	User,
)
from app.services.ai_tools import AIToolExecutor


@pytest.fixture()
def client(tmp_path):
	database_path = tmp_path / "ai-assistant-test.db"
	engine = create_async_engine(f"sqlite+aiosqlite:///{database_path}")
	session_maker = async_sessionmaker(engine, expire_on_commit=False)

	async def prepare_database():
		async with engine.begin() as connection:
			await connection.run_sync(Base.metadata.create_all)
		async with session_maker() as session:
			u1 = User(id=1, email="user1@example.com", full_name="User One", password_hash="hash")
			u2 = User(id=2, email="user2@example.com", full_name="User Two", password_hash="hash")
			session.add_all([u1, u2])
			await session.flush()

			p1 = TaxpayerProfile(
				id=1,
				owner_id=1,
				display_name="User One",
				entity_type="individual",
				relationship="self",
				pan_last_four="1234",
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
				completion_percent=60,
				current_section="income_sources",
				progress_data={
					"income_summary": {
						"gross_total_income": 1200000.0,
						"salary_income": 1200000.0,
						"taxes_paid": 50000.0,
					},
					"deductions_summary": {
						"total_chapter_via": 150000.0,
						"total_deductions_old": 200000.0,
					},
				},
			)
			session.add(w1)
			await session.commit()

	asyncio.run(prepare_database())

	async def override_get_db():
		async with session_maker() as session:
			yield session

	app.dependency_overrides[get_db] = override_get_db
	with TestClient(app) as test_client:
		yield test_client
	app.dependency_overrides.clear()
	asyncio.run(engine.dispose())


def test_tool_executor_reads_user_data_and_calculates(tmp_path):
	async def run():
		database_path = tmp_path / "tool-test.db"
		engine = create_async_engine(f"sqlite+aiosqlite:///{database_path}")
		session_maker = async_sessionmaker(engine, expire_on_commit=False)

		async with engine.begin() as connection:
			await connection.run_sync(Base.metadata.create_all)

		async with session_maker() as session:
			u = User(id=10, email="taxpayer@example.com", full_name="Rahul Verma", password_hash="hash")
			session.add(u)
			await session.flush()

			p = TaxpayerProfile(
				id=10,
				owner_id=10,
				display_name="Rahul Verma",
				pan_last_four="8899",
				is_primary=True,
			)
			session.add(p)
			await session.flush()

			w = FilingWorkspace(
				id=10,
				profile_id=10,
				assessment_year_start=2026,
				itr_form="ITR-2",
				status="in_progress",
				completion_percent=75,
				current_section="capital_gains",
				progress_data={
					"income_summary": {"gross_total_income": 1800000.0, "salary_income": 1500000.0},
					"deductions_summary": {"total_chapter_via": 150000.0},
				},
			)
			session.add(w)
			await session.commit()

			executor = AIToolExecutor(user_id=10, db=session)

			# 1. Profile Tool
			profile_data = await executor.execute_tool("get_user_tax_profile", {})
			assert profile_data["display_name"] == "Rahul Verma"
			assert "8899" in profile_data["pan_masked"]

			# 2. Income Tool
			income_data = await executor.execute_tool("get_income_details", {})
			assert income_data["income_summary"]["gross_total_income"] == 1800000.0

			# 3. Calculation Tool
			calc = await executor.execute_tool(
				"calculate_tax_breakdown",
				{"gross_income": 1800000.0, "regime": "new", "deductions": 0},
			)
			assert "tax_after_cess" in calc
			assert calc["taxable_income"] == 1800000.0 - 75000.0  # Standard deduction applied

			# 4. Regime Comparison Tool
			comp = await executor.execute_tool(
				"compare_tax_regimes",
				{"gross_income": 1800000.0, "old_regime_deductions": 200000.0},
			)
			assert "old" in comp
			assert "new" in comp
			assert "tax_savings" in comp
			assert "optimal_regime" in comp

			# 5. ITR Selector Tool
			itr_res = await executor.execute_tool(
				"recommend_itr_form",
				{"has_salary": True, "has_capital_gains": True},
			)
			assert itr_res["recommended_itr"] == "ITR-2"

		await engine.dispose()

	asyncio.run(run())


def test_conversation_crud_and_isolation(client: TestClient):
	token1 = create_access_token(1)
	token2 = create_access_token(2)

	# User 1 creates conversation
	client.cookies.set("itrhub_session", token1)
	resp = client.post("/api/chat", json={"query": "Hello ITRHUB assistant"})
	assert resp.status_code == 200
	conv_id = resp.json()["conversation_id"]

	# List conversations
	list_resp = client.get("/api/chat/conversations")
	assert list_resp.status_code == 200
	convs = list_resp.json()
	assert len(convs) == 1
	assert convs[0]["id"] == conv_id
	assert convs[0]["message_count"] == 2

	# Retrieve detail
	detail_resp = client.get(f"/api/chat/conversations/{conv_id}")
	assert detail_resp.status_code == 200
	assert len(detail_resp.json()["messages"]) == 2

	# Rename conversation
	patch_resp = client.patch(
		f"/api/chat/conversations/{conv_id}",
		json={"title": "Custom Tax Strategy 2026"},
	)
	assert patch_resp.status_code == 200
	assert patch_resp.json()["title"] == "Custom Tax Strategy 2026"

	# User 2 attempts unauthorized access
	client.cookies.set("itrhub_session", token2)

	assert client.get(f"/api/chat/conversations/{conv_id}").status_code == 404
	assert (
		client.patch(
			f"/api/chat/conversations/{conv_id}", json={"title": "Hacked Title"}
		).status_code
		== 404
	)
	assert client.delete(f"/api/chat/conversations/{conv_id}").status_code == 404

	# User 1 deletes conversation
	client.cookies.set("itrhub_session", token1)
	del_resp = client.delete(f"/api/chat/conversations/{conv_id}")
	assert del_resp.status_code == 204
	assert client.get(f"/api/chat/conversations/{conv_id}").status_code == 404


def test_streaming_chat_endpoint(client: TestClient):
	token = create_access_token(1)
	client.cookies.set("itrhub_session", token)

	resp = client.post(
		"/api/chat",
		json={"query": "Calculate my tax", "stream": True},
	)
	assert resp.status_code == 200
	assert "text/event-stream" in resp.headers["content-type"]
	content = resp.text
	assert "data: " in content
