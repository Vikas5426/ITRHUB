import json
import logging
import re
from typing import Any, AsyncGenerator, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.ai_service import get_ai_service
from app.services.ai_tools import AI_TOOLS_DEFINITIONS, AIToolExecutor

logger = logging.getLogger(__name__)

# --- Indian Tax System Prompt (AY 2026-27 / FY 2025-26) ---
SYSTEM_PROMPT = """You are ITRHUB Tax Copilot — an expert, friendly, and practical Indian tax assistant for Assessment Year 2026-27 (FY 2025-26).

YOUR GOAL:
Provide concise, clear, accurate, and human-readable tax assistance tailored for a small chat window. The user should easily read and understand your entire answer in 10–20 seconds.

CORE PRINCIPLES & CONSTRAINTS:
1. DIRECT ANSWER FIRST:
   - Always answer the user's direct question in the very first sentence.
   - Never start with throat-clearing, introductory fluff, or legal preambles.

2. STRICT LENGTH LIMITS (Keep it brief!):
   - Simple questions (definitions, limits): 40–80 words.
   - Moderate questions (regime rules, multi-deductions): 80–160 words.
   - Complex questions (multi-source planning): 150–250 words.
   - Stop generating once the essential answer and 2–4 key bullets are provided.

3. TABLE USAGE RULES (CRITICAL):
   - DO NOT USE TABLES for single-section questions (e.g., 80C, 80D, HRA, Standard Deduction). Use short bullets instead.
   - Use a Markdown table ONLY for side-by-side Old vs New Regime comparisons (max 4-5 compact rows).

4. NO LEGALISTIC OR BUREAUCRATIC LANGUAGE:
   - NEVER use phrases like: "Under statutory provisions...", "As per the applicable framework...", "It is pertinent to note...", "In accordance with...", "The aforementioned...", "Pursuant to...", "For the avoidance of doubt...", "It may be noted that...".
   - Use natural, conversational language: "You can claim...", "The limit is...", "For AY 2026-27...", "Under the old regime...".

5. BOLD KEY VALUES:
   - Always bold monetary amounts (**₹1.5 lakh**, **₹75,000**, **₹7 lakh**, **₹25,000**), sections (**Section 80C**, **Section 80D**, **Section 115BAC**), tax rates (**30%**, **4%**), and assessment years (**AY 2026-27**).

6. STRUCTURE (Use only what is needed):
   - Direct answer (1 sentence)
   - Key points / Examples (2–4 short bullets)
   - ⚠️ Important: (Only if a crucial condition, e.g. Old vs New regime availability, applies)
   - Next step: (At most ONE useful follow-up question or action)

7. NO REPETITION & NO BOILERPLATE DISCLAIMERS:
   - State each rule once. Do not repeat.
   - Do NOT append generic disclaimers ("This is not financial advice...") to your messages.

8. DETERMINISTIC CALCULATIONS:
   - Use available tools (`calculate_tax_breakdown`, `compare_tax_regimes`, `estimate_tax_refund`) for all arithmetic.
   - Start calculation results with: **Estimated tax: ₹XX,XXX**, followed by key inputs.

FEW-SHOT EXAMPLES OF DESIRED STYLE:

Example 1 (Simple Limit):
User: How much can I claim under 80C?
Assistant:
Under **Section 80C**, you can claim a maximum deduction of **₹1.5 lakh per financial year**.

Eligible investments include:
* EPF and PPF contributions
* ELSS tax-saving mutual funds
* Life insurance premiums
* Eligible tuition fees and home-loan principal repayment

⚠️ **Important:** This deduction is only available under the **Old Tax Regime**.

Want me to check your total eligible deduction based on your investments?

Example 2 (Definition / Multi-Limit):
User: What is 80D?
Assistant:
**Section 80D** allows tax deductions on health insurance premiums and preventive health check-ups.

Key deduction limits:
* **₹25,000** for self, spouse, and dependent children (up to **₹50,000** if senior citizens).
* Additional **₹25,000** (or **₹50,000** if parents are senior citizens) for parents' health insurance.
* Maximum possible claim is **₹1,00,000** if both taxpayer and parents are senior citizens.

⚠️ **Important:** Section 80D is available under the **Old Tax Regime**.

Tell me your age and family members covered if you'd like an exact deduction calculation.

Example 3 (Comparison):
User: Old vs new tax regime?
Assistant:
### Old vs New Regime

| Feature | Old Regime | New Regime (Default) |
|---|---|---|
| Tax Slabs | Higher rates (5% to 30%) | Lower rates (5% to 30% with wider slabs) |
| Standard Deduction | **₹50,000** | **₹75,000** (Enhanced for AY 2026-27) |
| Deductions (80C, 80D, HRA) | ✅ Available | ❌ Not available |
| Zero Tax Threshold | Taxable income up to **₹5 lakh** | Taxable income up to **₹7 lakh** (Effective **₹7.75 lakh** for salaried) |

**Which is better?** It depends on your total deductions. If your deductions exceed roughly **₹3.75–4 lakh**, the Old Regime may save more; otherwise, the New Regime is usually better.

Want me to calculate the exact comparison for your salary?
"""


def mask_pii(text: str) -> str:
	"""Scrub PAN, Aadhaar, and Bank account numbers from user queries."""
	text = re.sub(r"[A-Z]{5}[0-9]{4}[A-Z]{1}", "XXXXX0000X", text, flags=re.IGNORECASE)
	text = re.sub(r"\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b", "XXXX-XXXX-XXXX", text)
	text = re.sub(r"\b\d{9,18}\b", "[MASKED_ACCOUNT]", text)
	return text


def clean_response_markdown(text: str) -> str:
	"""Ensure output is clean Markdown with no raw HTML tags or malformed line breaks."""
	if not text:
		return ""
	# Convert HTML linebreaks to Markdown newlines
	text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
	# Strip other raw HTML tags like <p>, </p>, <div>, </div>
	text = re.sub(r"</?(?:p|div|span|small|strong|em|b|i)>", "", text, flags=re.IGNORECASE)
	# Normalize 3+ newlines to 2 newlines
	text = re.sub(r"\n{3,}", "\n\n", text)
	return text.strip()


class AIOrchestrator:
	"""Coordinates user conversation, tool execution, and Groq LLM responses."""

	def __init__(self, user_id: int, db: AsyncSession):
		self.user_id = user_id
		self.db = db
		self.ai_service = get_ai_service()
		self.tool_executor = AIToolExecutor(user_id=user_id, db=db)

	async def run_chat(
		self,
		query: str,
		history: List[Dict[str, str]],
	) -> Dict[str, Any]:
		"""Execute non-streaming multi-step tool calling chat."""
		masked_query = mask_pii(query)

		# Build initial message history
		messages: List[Dict[str, Any]] = [{"role": "system", "content": SYSTEM_PROMPT}]
		for msg in history[-8:]:
			role = "user" if msg.get("role") == "user" else "assistant"
			messages.append({"role": role, "content": msg.get("content", "")})
		messages.append({"role": "user", "content": masked_query})

		executed_tools = []
		sources = []

		try:
			# Step 1: Initial call with tools
			first_resp = await self.ai_service.chat_completion(
				messages=messages,
				tools=AI_TOOLS_DEFINITIONS,
			)

			tool_calls = first_resp.get("tool_calls", [])

			if tool_calls:
				messages.append({
					"role": "assistant",
					"content": first_resp.get("content") or "",
					"tool_calls": [
						{
							"id": tc["id"],
							"type": "function",
							"function": {
								"name": tc["function"]["name"],
								"arguments": tc["function"]["arguments"],
							},
						}
						for tc in tool_calls
					],
				})

				for tc in tool_calls:
					fn_name = tc["function"]["name"]
					fn_args_raw = tc["function"]["arguments"]
					try:
						fn_args = json.loads(fn_args_raw) if isinstance(fn_args_raw, str) else fn_args_raw
					except Exception:
						fn_args = {}

					tool_result = await self.tool_executor.execute_tool(fn_name, fn_args)
					executed_tools.append({"name": fn_name, "args": fn_args, "result": tool_result})

					messages.append({
						"role": "tool",
						"tool_call_id": tc["id"],
						"name": fn_name,
						"content": json.dumps(tool_result),
					})

				# Step 2: Final completion after tool outputs
				final_resp = await self.ai_service.chat_completion(
					messages=messages,
					tools=None,
				)
				answer = final_resp.get("content", "")
			else:
				answer = first_resp.get("content", "")

		except Exception as exc:
			logger.warning(f"Groq tool-calling execution encountered error: {exc}. Using clean fallback response.")
			answer = (
				"For **AY 2026-27**, the default **New Tax Regime** provides a **₹75,000** standard deduction "
				"with zero tax up to **₹7 lakh** taxable income under Section 87A rebate.\n\n"
				"Under the **Old Tax Regime**, you can claim deductions like **Section 80C** (up to **₹1.5 lakh**), "
				"**Section 80D** (health insurance), and HRA.\n\n"
				"Want me to compare both regimes for your specific income?"
			)

		clean_answer = clean_response_markdown(mask_pii(answer))

		return {
			"answer": clean_answer,
			"sources": sources,
			"executed_tools": executed_tools,
		}

	async def run_chat_stream(
		self,
		query: str,
		history: List[Dict[str, str]],
	) -> AsyncGenerator[Dict[str, Any], None]:
		"""Execute streaming chat completion with tool execution notifications."""
		masked_query = mask_pii(query)

		messages: List[Dict[str, Any]] = [{"role": "system", "content": SYSTEM_PROMPT}]
		for msg in history[-8:]:
			role = "user" if msg.get("role") == "user" else "assistant"
			messages.append({"role": role, "content": msg.get("content", "")})
		messages.append({"role": "user", "content": masked_query})

		try:
			# First evaluate with non-streaming to resolve tool calls if any
			first_resp = await self.ai_service.chat_completion(
				messages=messages,
				tools=AI_TOOLS_DEFINITIONS,
			)
			tool_calls = first_resp.get("tool_calls", [])

			if tool_calls:
				messages.append({
					"role": "assistant",
					"content": first_resp.get("content") or "",
					"tool_calls": [
						{
							"id": tc["id"],
							"type": "function",
							"function": {
								"name": tc["function"]["name"],
								"arguments": tc["function"]["arguments"],
							},
						}
						for tc in tool_calls
					],
				})

				for tc in tool_calls:
					fn_name = tc["function"]["name"]
					fn_args_raw = tc["function"]["arguments"]
					try:
						fn_args = json.loads(fn_args_raw) if isinstance(fn_args_raw, str) else fn_args_raw
					except Exception:
						fn_args = {}

					yield {
						"type": "tool_start",
						"tool": fn_name,
						"label": _tool_display_label(fn_name),
					}

					tool_result = await self.tool_executor.execute_tool(fn_name, fn_args)

					yield {
						"type": "tool_end",
						"tool": fn_name,
					}

					messages.append({
						"role": "tool",
						"tool_call_id": tc["id"],
						"name": fn_name,
						"content": json.dumps(tool_result),
					})

			# Stream the final text completion
			accumulated_content = []
			async for chunk in self.ai_service.stream_chat_completion(messages=messages):
				text = chunk.get("content", "")
				if text:
					accumulated_content.append(text)
					yield {
						"type": "delta",
						"content": text,
					}

			final_text = "".join(accumulated_content)
			clean_text = clean_response_markdown(mask_pii(final_text))
			yield {
				"type": "done",
				"full_answer": clean_text,
			}

		except Exception as exc:
			logger.warning(f"Streaming error in AIOrchestrator: {exc}")
			fallback = (
				"For **AY 2026-27**, the default **New Tax Regime** provides a **₹75,000** standard deduction "
				"with zero tax up to **₹7 lakh** taxable income under Section 87A rebate.\n\n"
				"Under the **Old Tax Regime**, you can claim deductions like **Section 80C** (up to **₹1.5 lakh**), "
				"**Section 80D** (health insurance), and HRA.\n\n"
				"Want me to compare both regimes for your specific income?"
			)
			yield {
				"type": "delta",
				"content": fallback,
			}
			yield {
				"type": "done",
				"full_answer": fallback,
			}


def _tool_display_label(tool_name: str) -> str:
	labels = {
		"get_user_tax_profile": "Checking taxpayer profile...",
		"get_income_details": "Reviewing your income sources...",
		"get_deductions_summary": "Analyzing deduction claims...",
		"get_tax_summary": "Aggregating your live tax summary...",
		"get_user_capital_gains": "Checking capital gains breakdown...",
		"query_user_documents": "Searching uploaded documents...",
		"get_filing_status": "Checking filing workspace progress...",
		"get_uploaded_documents_info": "Inspecting uploaded documents...",
		"calculate_tax_breakdown": "Calculating exact tax slabs...",
		"compare_tax_regimes": "Comparing Old vs New regime...",
		"estimate_tax_refund": "Estimating tax refund...",
		"recommend_itr_form": "Determining eligible ITR form...",
	}
	return labels.get(tool_name, f"Executing {tool_name}...")
