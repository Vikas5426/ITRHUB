import json
import logging
from typing import Any, AsyncGenerator, Dict, List, Optional

from groq import AsyncGroq, Groq

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class AIService:
	"""Encapsulates interaction with Groq API and LLM operations."""

	def __init__(self):
		self.settings = get_settings()

	def _get_client(self) -> AsyncGroq:
		api_key = self.settings.groq_api_key
		if not api_key:
			raise ValueError("GROQ_API_KEY is not configured")
		return AsyncGroq(api_key=api_key, timeout=self.settings.ai_timeout)

	async def chat_completion(
		self,
		messages: List[Dict[str, Any]],
		tools: Optional[List[Dict[str, Any]]] = None,
		tool_choice: Optional[str] = None,
	) -> Dict[str, Any]:
		"""Execute non-streaming chat completion with optional tool definitions."""
		client = self._get_client()
		model = self.settings.ai_model
		params: Dict[str, Any] = {
			"model": model,
			"messages": messages,
			"temperature": self.settings.ai_temperature,
			"max_completion_tokens": self.settings.ai_max_tokens,
		}
		if tools:
			params["tools"] = tools
			if tool_choice:
				params["tool_choice"] = tool_choice

		try:
			response = await client.chat.completions.create(**params)
			choice = response.choices[0]
			message = choice.message
			tool_calls = []
			if message.tool_calls:
				for tc in message.tool_calls:
					tool_calls.append({
						"id": tc.id,
						"type": "function",
						"function": {
							"name": tc.function.name,
							"arguments": tc.function.arguments,
						},
					})
			return {
				"content": message.content or "",
				"tool_calls": tool_calls,
				"finish_reason": choice.finish_reason,
				"usage": {
					"prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
					"completion_tokens": response.usage.completion_tokens if response.usage else 0,
					"total_tokens": response.usage.total_tokens if response.usage else 0,
				},
			}
		except Exception as exc:
			logger.error(f"Groq API completion error: {exc}", exc_info=True)
			raise

	async def stream_chat_completion(
		self,
		messages: List[Dict[str, Any]],
		tools: Optional[List[Dict[str, Any]]] = None,
	) -> AsyncGenerator[Dict[str, Any], None]:
		"""Stream chat completion chunks."""
		client = self._get_client()
		model = self.settings.ai_model
		params: Dict[str, Any] = {
			"model": model,
			"messages": messages,
			"temperature": self.settings.ai_temperature,
			"max_completion_tokens": self.settings.ai_max_tokens,
			"stream": True,
		}
		if tools:
			params["tools"] = tools

		try:
			stream = await client.chat.completions.create(**params)
			async for chunk in stream:
				if not chunk.choices:
					continue
				delta = chunk.choices[0].delta
				content = delta.content or ""
				tool_calls = delta.tool_calls or []
				finish_reason = chunk.choices[0].finish_reason
				yield {
					"content": content,
					"tool_calls": tool_calls,
					"finish_reason": finish_reason,
				}
		except Exception as exc:
			logger.error(f"Groq streaming error: {exc}", exc_info=True)
			raise


_ai_service_instance: Optional[AIService] = None


def get_ai_service() -> AIService:
	global _ai_service_instance
	if _ai_service_instance is None:
		_ai_service_instance = AIService()
	return _ai_service_instance
