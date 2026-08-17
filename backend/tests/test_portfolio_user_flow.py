import asyncio
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.core.security import create_access_token
from app.main import app
from app.models.user import User


@pytest.fixture()
def client(tmp_path):
	database_path = tmp_path / "portfolio-test.db"
	engine = create_async_engine(f"sqlite+aiosqlite:///{database_path}")
	session_maker = async_sessionmaker(engine, expire_on_commit=False)

	async def prepare_database():
		async with engine.begin() as connection:
			await connection.run_sync(Base.metadata.create_all)
		async with session_maker() as session:
			u1 = User(id=1, email="user1@example.com", full_name="User One", password_hash="hash")
			u2 = User(id=2, email="user2@example.com", full_name="User Two", password_hash="hash")
			session.add_all([u1, u2])
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


def test_portfolio_analyze_with_authenticated_user(client: TestClient):
	csv = """Asset Name,Asset Type,Buy Date,Sell Date,Buy Price,Sell Price,Quantity
Test Equity,Listed Equity,2020-01-01,2024-01-02,100,300,1000
"""
	# Authenticate as User 1
	token = create_access_token(1)
	client.cookies.set("itrhub_session", token)

	files = {"file": ("test.csv", csv, "text/csv")}
	data = {"regime": "old"}
	resp = client.post("/api/portfolio/analyze", files=files, data=data)
	assert resp.status_code == 200
	body = resp.json()
	assert "data" in body
	assert "special_tax_components" in body
	assert "tax_summary" in body
	assert isinstance(body["tax_summary"]["tax_after_cess"], (int, float))


def test_portfolio_analyze_with_explicit_income_unauthenticated(client: TestClient):
	csv = """Asset Name,Asset Type,Buy Date,Sell Date,Buy Price,Sell Price,Quantity
Test Equity,Listed Equity,2020-01-01,2024-01-02,100,300,1000
"""
	files = {"file": ("test.csv", csv, "text/csv")}
	data = {"income": "1200000", "regime": "new"}
	resp = client.post("/api/portfolio/analyze", files=files, data=data)
	assert resp.status_code == 200
	body = resp.json()
	assert "tax_summary" in body
	assert body["tax_summary"]["gross_income"] == 1200000
