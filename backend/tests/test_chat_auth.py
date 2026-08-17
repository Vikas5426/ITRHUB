import asyncio
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.core.security import create_access_token
from app.main import app
from app.models.user import AIConversation, AIMessageRecord, User


@pytest.fixture()
def client(tmp_path):
	database_path = tmp_path / "chat-test.db"
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


def test_chat_unauthenticated_returns_401(client: TestClient):
	resp = client.post("/api/chat", json={"query": "What is Section 80C?"})
	assert resp.status_code == 401
	assert resp.json()["detail"] == "Authentication required"


def test_chat_authenticated_creates_conversation_and_messages(client: TestClient):
	token = create_access_token(1)
	client.cookies.set("itrhub_session", token)

	resp = client.post("/api/chat", json={"query": "How much can I claim under 80C?"})
	assert resp.status_code == 200
	data = resp.json()
	assert "answer" in data
	assert "conversation_id" in data
	conv_id = data["conversation_id"]

	# Second turn in the same conversation
	resp2 = client.post(
		"/api/chat",
		json={"query": "What about 80D for parents?", "conversation_id": conv_id},
	)
	assert resp2.status_code == 200
	data2 = resp2.json()
	assert data2["conversation_id"] == conv_id

	# Check conversation detail endpoint
	detail_resp = client.get(f"/api/chat/conversations/{conv_id}")
	assert detail_resp.status_code == 200
	detail = detail_resp.json()
	assert detail["id"] == conv_id
	assert len(detail["messages"]) == 4  # 2 user queries + 2 AI answers


def test_chat_cross_user_isolation(client: TestClient):
	# User 1 creates conversation
	token1 = create_access_token(1)
	client.cookies.set("itrhub_session", token1)

	resp1 = client.post("/api/chat", json={"query": "My confidential tax plan"})
	assert resp1.status_code == 200
	user1_conv_id = resp1.json()["conversation_id"]

	# User 2 logs in and tries to access User 1's conversation
	token2 = create_access_token(2)
	client.cookies.set("itrhub_session", token2)

	# User 2 tries to fetch User 1's conversation detail
	detail_resp = client.get(f"/api/chat/conversations/{user1_conv_id}")
	assert detail_resp.status_code == 404

	# User 2 tries to post into User 1's conversation
	post_resp = client.post(
		"/api/chat",
		json={"query": "Can I read User 1 chat?", "conversation_id": user1_conv_id},
	)
	assert post_resp.status_code == 404

	# User 2 lists conversations -> should be empty
	list_resp = client.get("/api/chat/conversations")
	assert list_resp.status_code == 200
	assert len(list_resp.json()) == 0
