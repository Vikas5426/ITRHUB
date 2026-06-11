import asyncio

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.main import app


@pytest.fixture()
def client(tmp_path):
	database_path = tmp_path / "workspace-test.db"
	engine = create_async_engine(f"sqlite+aiosqlite:///{database_path}")
	session_maker = async_sessionmaker(engine, expire_on_commit=False)

	async def prepare_database():
		async with engine.begin() as connection:
			await connection.run_sync(Base.metadata.create_all)

	asyncio.run(prepare_database())

	async def override_get_db():
		async with session_maker() as session:
			yield session

	app.dependency_overrides[get_db] = override_get_db
	with TestClient(app) as test_client:
		yield test_client
	app.dependency_overrides.clear()
	asyncio.run(engine.dispose())


def register(client: TestClient, email: str = "vikas@example.com") -> dict:
	response = client.post(
		"/api/auth/register",
		json={
			"full_name": "Vikas Sharma",
			"email": email,
			"password": "StrongPass123",
		},
	)
	assert response.status_code == 201
	return response.json()


def test_register_creates_primary_profile_and_session(client: TestClient):
	body = register(client)
	assert body["user"]["email"] == "vikas@example.com"
	assert "itrhub_session" in client.cookies

	me = client.get("/api/auth/me")
	assert me.status_code == 200
	assert me.json()["full_name"] == "Vikas Sharma"

	profiles = client.get("/api/workspace/profiles")
	assert profiles.status_code == 200
	assert profiles.json()[0]["is_primary"] is True
	assert profiles.json()[0]["relationship"] == "self"


def test_login_rejects_bad_password_and_logout_clears_session(client: TestClient):
	register(client)
	client.post("/api/auth/logout")
	assert client.get("/api/auth/me").status_code == 401

	bad_login = client.post(
		"/api/auth/login",
		json={"email": "vikas@example.com", "password": "wrong-password"},
	)
	assert bad_login.status_code == 401

	login = client.post(
		"/api/auth/login",
		json={"email": "vikas@example.com", "password": "StrongPass123"},
	)
	assert login.status_code == 200
	assert client.get("/api/auth/me").status_code == 200


def test_workspace_autosave_documents_and_owner_isolation(client: TestClient):
	register(client)
	profile_id = client.get("/api/workspace/profiles").json()[0]["id"]
	workspace_response = client.post(
		"/api/workspace/filings",
		json={"profile_id": profile_id, "assessment_year_start": 2026},
	)
	assert workspace_response.status_code == 201
	workspace = workspace_response.json()

	saved = client.put(
		f"/api/workspace/filings/{workspace['id']}/progress",
		json={
			"expected_revision": workspace["revision"],
			"current_section": "income_sources",
			"completion_percent": 25,
			"progress_data": {"notes": "Form 16 received"},
		},
	)
	assert saved.status_code == 200
	assert saved.json()["revision"] == 2

	conflict = client.put(
		f"/api/workspace/filings/{workspace['id']}/progress",
		json={
			"expected_revision": 1,
			"current_section": "deductions",
			"completion_percent": 50,
			"progress_data": {},
		},
	)
	assert conflict.status_code == 409

	content = b"sample encrypted tax document"
	uploaded = client.post(
		f"/api/workspace/filings/{workspace['id']}/documents",
		data={"category": "form_16"},
		files={"file": ("form16.pdf", content, "application/pdf")},
	)
	assert uploaded.status_code == 201
	document_id = uploaded.json()["id"]
	download = client.get(f"/api/workspace/documents/{document_id}/download")
	assert download.status_code == 200
	assert download.content == content
	assert download.headers["cache-control"] == "no-store"

	client.post("/api/auth/logout")
	register(client, "other@example.com")
	assert client.get(f"/api/workspace/documents/{document_id}/download").status_code == 404


def test_document_import_reconciliation_totals_and_persistence(client: TestClient):
	register(client)
	profile_id = client.get("/api/workspace/profiles").json()[0]["id"]
	workspace = client.post(
		"/api/workspace/filings",
		json={"profile_id": profile_id, "assessment_year_start": 2026},
	).json()

	ais_json = b"""
	{
	  "salary": 1200000,
	  "interest": 22000,
	  "taxDeducted": 85000,
	  "capitalGains": 45000
	}
	"""
	form16_csv = (
		"Description,Amount\n"
		"Gross Salary,1200000\n"
		"TDS,85000\n"
		"80C,150000\n"
	).encode("utf-8")

	for name, category, content_type, content in [
		("ais.json", "ais_tis", "application/json", ais_json),
		("form16.csv", "form_16", "text/csv", form16_csv),
	]:
		response = client.post(
			f"/api/workspace/filings/{workspace['id']}/documents",
			data={"category": category},
			files={"file": (name, content, content_type)},
		)
		assert response.status_code == 201

	reconciled = client.post(
		f"/api/workspace/filings/{workspace['id']}/reconciliation",
		json={},
	)
	assert reconciled.status_code == 200
	report = reconciled.json()
	assert report["workspace_id"] == workspace["id"]
	assert report["totals"]["salary_income"] == 1_200_000
	assert report["totals"]["interest_income"] == 22_000
	assert report["totals"]["tds"] == 85_000
	assert report["totals"]["deduction_80c"] == 150_000
	assert any("Capital gains" in item["message"] for item in report["findings"])

	persisted = client.get(f"/api/workspace/filings/{workspace['id']}/reconciliation")
	assert persisted.status_code == 200
	assert persisted.json()["totals"] == report["totals"]

	client.post("/api/auth/logout")
	register(client, "reconcile-other@example.com")
	assert client.get(f"/api/workspace/filings/{workspace['id']}/reconciliation").status_code == 404
