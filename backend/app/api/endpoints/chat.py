from datetime import datetime
import json
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import AIConversation, AIMessageRecord, User
from app.services.ai_orchestrator import AIOrchestrator, mask_pii

logger = logging.getLogger(__name__)

router = APIRouter()


# --- Pydantic Schemas ---
class ChatRequest(BaseModel):
	query: str = Field(min_length=1, max_length=4000)
	conversation_id: Optional[int] = None
	stream: bool = False


class ExecutedToolInfo(BaseModel):
	name: str
	args: Dict[str, Any]
	result: Dict[str, Any]


class ChatResponse(BaseModel):
	answer: str
	sources: List[str] = []
	conversation_id: int
	executed_tools: List[ExecutedToolInfo] = []


class MessageResponse(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	id: int
	role: str
	content: str
	sources: Optional[List[str]] = None
	created_at: datetime


class ConversationSummary(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	id: int
	title: str
	message_count: int = 0
	last_message: Optional[str] = None
	created_at: datetime
	updated_at: datetime


class ConversationDetailResponse(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	id: int
	title: str
	created_at: datetime
	updated_at: datetime
	messages: List[MessageResponse]


class ConversationUpdateRequest(BaseModel):
	title: str = Field(min_length=1, max_length=200)


# --- Helpers ---
async def get_user_conversation(
	db: AsyncSession, conversation_id: int, user_id: int
) -> AIConversation:
	conversation = await db.scalar(
		select(AIConversation)
		.where(
			AIConversation.id == conversation_id,
			AIConversation.user_id == user_id,
		)
		.options(selectinload(AIConversation.messages))
	)
	if not conversation:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="Conversation not found",
		)
	return conversation


# --- Endpoints ---
@router.post("/chat")
async def chat_endpoint(
	request: ChatRequest,
	current_user: User = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	"""Execute an authenticated AI Tax consultation request."""
	clean_query = request.query.strip()
	if not clean_query:
		raise HTTPException(status_code=400, detail="Query cannot be empty")

	# 1. Resolve or create user-scoped conversation
	history = []
	if request.conversation_id is not None:
		conversation = await get_user_conversation(
			db, request.conversation_id, current_user.id
		)
		messages = await db.scalars(
			select(AIMessageRecord)
			.where(AIMessageRecord.conversation_id == conversation.id)
			.order_by(AIMessageRecord.created_at)
		)
		for msg in list(messages)[-10:]:
			history.append({"role": msg.role, "content": msg.content})
	else:
		title = clean_query[:60]
		conversation = AIConversation(
			user_id=current_user.id,
			title=title,
		)
		db.add(conversation)
		await db.flush()

	orchestrator = AIOrchestrator(user_id=current_user.id, db=db)

	# 3. Handle Streaming Mode
	if request.stream:
		async def sse_event_generator():
			full_answer = ""
			try:
				# Save initial user message
				user_msg = AIMessageRecord(
					conversation_id=conversation.id,
					role="user",
					content=mask_pii(clean_query),
				)
				db.add(user_msg)
				await db.commit()

				# Yield conversation info event
				yield f"data: {json.dumps({'type': 'init', 'conversation_id': conversation.id})}\n\n"

				async for chunk in orchestrator.run_chat_stream(clean_query, history):
					if chunk["type"] == "done":
						full_answer = chunk["full_answer"]
					yield f"data: {json.dumps(chunk)}\n\n"

				# Persist final assistant message
				if full_answer:
					ai_msg = AIMessageRecord(
						conversation_id=conversation.id,
						role="assistant",
						content=full_answer,
					)
					db.add(ai_msg)
					await db.commit()

			except Exception as exc:
				logger.error(f"Error during SSE stream: {exc}", exc_info=True)
				yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"

		return StreamingResponse(
			sse_event_generator(),
			media_type="text/event-stream",
			headers={
				"Cache-Control": "no-cache",
				"Connection": "keep-alive",
				"X-Accel-Buffering": "no",
			},
		)

	# 4. Handle Non-Streaming Mode
	result = await orchestrator.run_chat(clean_query, history)
	answer = result["answer"]
	sources = result.get("sources", [])
	executed_tools = result.get("executed_tools", [])

	user_msg = AIMessageRecord(
		conversation_id=conversation.id,
		role="user",
		content=mask_pii(clean_query),
	)
	ai_msg = AIMessageRecord(
		conversation_id=conversation.id,
		role="assistant",
		content=answer,
		sources=sources,
	)
	db.add(user_msg)
	db.add(ai_msg)
	await db.commit()

	return ChatResponse(
		answer=answer,
		sources=sources,
		conversation_id=conversation.id,
		executed_tools=[
			ExecutedToolInfo(
				name=t["name"],
				args=t.get("args", {}),
				result=t.get("result", {}),
			)
			for t in executed_tools
		],
	)


@router.get("/chat/conversations", response_model=List[ConversationSummary])
async def list_conversations(
	current_user: User = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	"""List all conversations belonging to the authenticated user."""
	conversations = await db.scalars(
		select(AIConversation)
		.where(AIConversation.user_id == current_user.id)
		.order_by(desc(AIConversation.updated_at))
		.options(selectinload(AIConversation.messages))
	)

	summaries = []
	for conv in conversations:
		last_msg = conv.messages[-1].content if conv.messages else None
		summaries.append(
			ConversationSummary(
				id=conv.id,
				title=conv.title,
				message_count=len(conv.messages),
				last_message=last_msg[:100] if last_msg else None,
				created_at=conv.created_at,
				updated_at=conv.updated_at,
			)
		)
	return summaries


@router.get(
	"/chat/conversations/{conversation_id}",
	response_model=ConversationDetailResponse,
)
async def get_conversation(
	conversation_id: int,
	current_user: User = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	"""Retrieve full message history for a specific conversation."""
	return await get_user_conversation(db, conversation_id, current_user.id)


@router.patch(
	"/chat/conversations/{conversation_id}",
	response_model=ConversationDetailResponse,
)
async def update_conversation(
	conversation_id: int,
	payload: ConversationUpdateRequest,
	current_user: User = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	"""Rename a user conversation."""
	conversation = await get_user_conversation(db, conversation_id, current_user.id)
	conversation.title = payload.title.strip()
	await db.commit()
	await db.refresh(conversation)
	return conversation


@router.delete(
	"/chat/conversations/{conversation_id}",
	status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_conversation(
	conversation_id: int,
	current_user: User = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	"""Delete a user conversation and its messages."""
	conversation = await get_user_conversation(db, conversation_id, current_user.id)
	await db.delete(conversation)
	await db.commit()
