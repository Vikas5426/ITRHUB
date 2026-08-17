import json
import logging
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decrypt_document
from app.models.user import FilingDocument, FilingWorkspace, TaxpayerProfile, User
from app.services import tax_engine
from app.services.document_import_service import extract_pdf_text, parse_document

logger = logging.getLogger(__name__)

# --- Tool Schemas for Groq (OpenAI Function Calling Spec) ---
AI_TOOLS_DEFINITIONS: List[Dict[str, Any]] = [
	{
		"type": "function",
		"function": {
			"name": "get_user_tax_profile",
			"description": "Retrieve the authenticated user's taxpayer profile, including display name, PAN status, residency, and entity type.",
			"parameters": {
				"type": "object",
				"properties": {},
			},
		},
	},
	{
		"type": "function",
		"function": {
			"name": "get_income_details",
			"description": "Retrieve the user's recorded income streams (salary, house property, business, capital gains, foreign, other income) for their active return.",
			"parameters": {
				"type": "object",
				"properties": {},
			},
		},
	},
	{
		"type": "function",
		"function": {
			"name": "get_deductions_summary",
			"description": "Retrieve the user's recorded tax deductions (80C, 80D, 80CCD, HRA, home loan 24b, etc.) for their active return.",
			"parameters": {
				"type": "object",
				"properties": {},
			},
		},
	},
	{
		"type": "function",
		"function": {
			"name": "get_filing_status",
			"description": "Retrieve the user's filing progress, current step/section, completion percentage, recommended ITR form, and AY.",
			"parameters": {
				"type": "object",
				"properties": {},
			},
		},
	},
	{
		"type": "function",
		"function": {
			"name": "get_uploaded_documents_info",
			"description": "Retrieve metadata of documents uploaded to the evidence vault (Form 16, AIS, 26AS, capital gains, bank statements).",
			"parameters": {
				"type": "object",
				"properties": {},
			},
		},
	},
	{
		"type": "function",
		"function": {
			"name": "calculate_tax_breakdown",
			"description": "Deterministically calculate Indian income tax slab-by-slab under Old or New Regime for AY 2026-27.",
			"parameters": {
				"type": "object",
				"properties": {
					"gross_income": {
						"type": "number",
						"description": "Gross Total Income in INR before deductions",
					},
					"deductions": {
						"type": "number",
						"description": "Eligible deductions in INR (for Old Regime)",
						"default": 0.0,
					},
					"regime": {
						"type": "string",
						"enum": ["new", "old"],
						"description": "Tax regime to apply ('new' or 'old')",
					},
				},
				"required": ["gross_income", "regime"],
			},
		},
	},
	{
		"type": "function",
		"function": {
			"name": "compare_tax_regimes",
			"description": "Deterministically compare tax payable and savings between Old Regime and New Regime (Sec 115BAC) for AY 2026-27.",
			"parameters": {
				"type": "object",
				"properties": {
					"gross_income": {
						"type": "number",
						"description": "Gross Total Income in INR",
					},
					"old_regime_deductions": {
						"type": "number",
						"description": "Total deductions claimable under Old Regime (80C, 80D, HRA, 24b, etc.)",
						"default": 0.0,
					},
				},
				"required": ["gross_income"],
			},
		},
	},
	{
		"type": "function",
		"function": {
			"name": "estimate_tax_refund",
			"description": "Estimate whether the user is due a tax refund or has balance tax payable based on TDS and estimated tax liability.",
			"parameters": {
				"type": "object",
				"properties": {
					"gross_income": {
						"type": "number",
						"description": "Gross Total Income in INR",
					},
					"deductions": {
						"type": "number",
						"description": "Total deductions in INR",
						"default": 0.0,
					},
					"tds_paid": {
						"type": "number",
						"description": "Total TDS or advance tax already deposited with IT Department",
					},
					"regime": {
						"type": "string",
						"enum": ["new", "old"],
						"default": "new",
					},
				},
				"required": ["gross_income", "tds_paid"],
			},
		},
	},
	{
		"type": "function",
		"function": {
			"name": "get_tax_summary",
			"description": "Retrieve an aggregated financial & tax summary for the user's active return, including gross total income, total deductions, taxable income, computed tax under both regimes, TDS paid, and net refund or payable.",
			"parameters": {
				"type": "object",
				"properties": {},
			},
		},
	},
	{
		"type": "function",
		"function": {
			"name": "get_user_capital_gains",
			"description": "Retrieve the user's capital gains breakdown (STCG 20% under Sec 111A, LTCG 12.5% under Sec 112A, property gains, crypto/VDA gains, and loss carry-forward).",
			"parameters": {
				"type": "object",
				"properties": {},
			},
		},
	},
	{
		"type": "function",
		"function": {
			"name": "query_user_documents",
			"description": "Search and extract relevant text, numbers, or facts from the authenticated user's uploaded evidence documents (Form 16, AIS, 26AS, bank statements, etc.).",
			"parameters": {
				"type": "object",
				"properties": {
					"query": {
						"type": "string",
						"description": "Keywords or specific question about the document (e.g. 'TDS', 'gross salary', 'dividend', 'employer name')",
					},
					"document_type": {
						"type": "string",
						"description": "Optional category filter (e.g. 'form_16', 'ais_tis', 'form_26as', 'bank_interest', 'all')",
						"default": "all",
					},
				},
				"required": ["query"],
			},
		},
	},
	{
		"type": "function",
		"function": {
			"name": "recommend_itr_form",
			"description": "Determine the mandatory/recommended Indian ITR form (ITR-1 Sahaj, ITR-2, ITR-3, ITR-4 Sugam) based on income sources and asset profile.",
			"parameters": {
				"type": "object",
				"properties": {
					"has_salary": {"type": "boolean", "default": False},
					"has_business": {"type": "boolean", "default": False},
					"has_capital_gains": {"type": "boolean", "default": False},
					"has_foreign_income": {"type": "boolean", "default": False},
					"is_presumptive": {"type": "boolean", "default": False},
				},
			},
		},
	},
]


class AIToolExecutor:
	"""Executes authorized, user-scoped tools against the database and deterministic calculators."""

	def __init__(self, user_id: int, db: AsyncSession):
		self.user_id = user_id
		self.db = db

	async def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
		"""Dispatch and execute an authorized tool call."""
		try:
			if tool_name == "get_user_tax_profile":
				return await self._get_user_tax_profile()
			elif tool_name == "get_income_details":
				return await self._get_income_details()
			elif tool_name == "get_deductions_summary":
				return await self._get_deductions_summary()
			elif tool_name == "get_filing_status":
				return await self._get_filing_status()
			elif tool_name == "get_uploaded_documents_info":
				return await self._get_uploaded_documents_info()
			elif tool_name == "get_tax_summary":
				return await self._get_tax_summary()
			elif tool_name == "get_user_capital_gains":
				return await self._get_user_capital_gains()
			elif tool_name == "query_user_documents":
				return await self._query_user_documents(arguments)
			elif tool_name == "calculate_tax_breakdown":
				return self._calculate_tax_breakdown(arguments)
			elif tool_name == "compare_tax_regimes":
				return self._compare_tax_regimes(arguments)
			elif tool_name == "estimate_tax_refund":
				return self._estimate_tax_refund(arguments)
			elif tool_name == "recommend_itr_form":
				return self._recommend_itr_form(arguments)
			else:
				return {"error": f"Unknown tool: {tool_name}"}
		except Exception as exc:
			logger.error(f"Error executing AI tool '{tool_name}': {exc}", exc_info=True)
			return {"error": f"Failed to execute tool {tool_name}: {str(exc)}"}

	async def _get_primary_profile(self) -> Optional[TaxpayerProfile]:
		return await self.db.scalar(
			select(TaxpayerProfile)
			.where(TaxpayerProfile.owner_id == self.user_id)
			.order_by(TaxpayerProfile.is_primary.desc(), TaxpayerProfile.created_at)
		)

	async def _get_active_workspace(self) -> Optional[FilingWorkspace]:
		return await self.db.scalar(
			select(FilingWorkspace)
			.join(TaxpayerProfile)
			.where(TaxpayerProfile.owner_id == self.user_id)
			.order_by(FilingWorkspace.assessment_year_start.desc())
		)

	async def _get_user_tax_profile(self) -> Dict[str, Any]:
		profile = await self._get_primary_profile()
		if not profile:
			return {"status": "no_profile_found", "message": "No taxpayer profile created yet."}
		return {
			"display_name": profile.display_name,
			"entity_type": profile.entity_type,
			"relationship": profile.relationship,
			"pan_masked": f"XXXX{profile.pan_last_four}" if profile.pan_last_four else "Not provided",
			"residency_status": profile.residency_status,
			"is_primary": profile.is_primary,
		}

	async def _get_income_details(self) -> Dict[str, Any]:
		workspace = await self._get_active_workspace()
		if not workspace or not workspace.progress_data:
			return {"status": "no_income_data", "message": "No income sources entered yet in the workspace."}
		income_sources = workspace.progress_data.get("income_sources", {})
		income_summary = workspace.progress_data.get("income_summary", {})
		return {
			"income_summary": income_summary,
			"income_sources": income_sources,
		}

	async def _get_deductions_summary(self) -> Dict[str, Any]:
		workspace = await self._get_active_workspace()
		if not workspace or not workspace.progress_data:
			return {"status": "no_deductions_data", "message": "No deductions entered yet in the workspace."}
		deductions = workspace.progress_data.get("deductions", {})
		deductions_summary = workspace.progress_data.get("deductions_summary", {})
		return {
			"deductions": deductions,
			"deductions_summary": deductions_summary,
		}

	async def _get_filing_status(self) -> Dict[str, Any]:
		workspace = await self._get_active_workspace()
		if not workspace:
			return {"status": "no_workspace", "message": "No active return workspace found."}
		return {
			"assessment_year": f"AY {workspace.assessment_year_start}-{str(workspace.assessment_year_start + 1)[-2:]}",
			"itr_form": workspace.itr_form or "Undetermined",
			"status": workspace.status,
			"completion_percent": workspace.completion_percent,
			"current_section": workspace.current_section,
			"revision": workspace.revision,
		}

	async def _get_uploaded_documents_info(self) -> Dict[str, Any]:
		docs = await self.db.scalars(
			select(FilingDocument)
			.join(FilingWorkspace)
			.join(TaxpayerProfile)
			.where(TaxpayerProfile.owner_id == self.user_id)
			.order_by(FilingDocument.uploaded_at.desc())
		)
		doc_list = [
			{
				"id": d.id,
				"category": d.category,
				"original_name": d.original_name,
				"size_kb": round(d.size_bytes / 1024, 1),
				"uploaded_at": str(d.uploaded_at),
			}
			for d in docs
		]
		return {"document_count": len(doc_list), "documents": doc_list}

	def _calculate_tax_breakdown(self, args: Dict[str, Any]) -> Dict[str, Any]:
		gross = float(args.get("gross_income", 0))
		deductions = float(args.get("deductions", 0))
		regime = str(args.get("regime", "new")).lower()
		return tax_engine.calculate_tax(
			income=gross,
			deductions=deductions,
			regime=regime,
			apply_standard_deduction=True,
		)

	def _compare_tax_regimes(self, args: Dict[str, Any]) -> Dict[str, Any]:
		gross = float(args.get("gross_income", 0))
		old_deductions = float(args.get("old_regime_deductions", 0))
		return tax_engine.compare_regimes(
			income=gross,
			old_deductions=old_deductions,
		)

	def _estimate_tax_refund(self, args: Dict[str, Any]) -> Dict[str, Any]:
		gross = float(args.get("gross_income", 0))
		deductions = float(args.get("deductions", 0))
		tds = float(args.get("tds_paid", 0))
		regime = str(args.get("regime", "new")).lower()
		return tax_engine.estimate_refund(
			income=gross,
			deductions=deductions,
			tds_paid=tds,
			regime=regime,
		)

	def _recommend_itr_form(self, args: Dict[str, Any]) -> Dict[str, Any]:
		itr = tax_engine.select_itr(
			has_salary=bool(args.get("has_salary", False)),
			has_business=bool(args.get("has_business", False)),
			has_capital_gains=bool(args.get("has_capital_gains", False)),
			has_foreign_income=bool(args.get("has_foreign_income", False)),
			is_presumptive=bool(args.get("is_presumptive", False)),
		)
		return {"recommended_itr": itr}

	async def _get_tax_summary(self) -> Dict[str, Any]:
		workspace = await self._get_active_workspace()
		if not workspace or not workspace.progress_data:
			return {"status": "no_workspace_data", "message": "No active return workspace found."}

		income_sources = workspace.progress_data.get("income_sources", {})
		deductions = workspace.progress_data.get("deductions", {})

		salary = float(income_sources.get("salary", {}).get("gross_salary", 0)) if income_sources.get("salary", {}).get("enabled") else 0.0
		tds = float(income_sources.get("salary", {}).get("tds", 0)) if income_sources.get("salary", {}).get("enabled") else 0.0
		house = max(0.0, float(income_sources.get("house_property", {}).get("rental_income", 0)) - float(income_sources.get("house_property", {}).get("home_loan_interest", 0))) if income_sources.get("house_property", {}).get("enabled") else 0.0
		business = float(income_sources.get("business", {}).get("net_profit", 0)) if income_sources.get("business", {}).get("enabled") else 0.0
		cg = income_sources.get("capital_gains", {})
		capital_gains = (float(cg.get("listed_equity_stcg", 0)) + float(cg.get("listed_equity_ltcg", 0)) + float(cg.get("property_gains", 0)) + float(cg.get("crypto_vda_gains", 0))) if cg.get("enabled") else 0.0
		other = float(income_sources.get("other", {}).get("interest_income", 0)) + float(income_sources.get("other", {}).get("dividend_income", 0)) + float(income_sources.get("other", {}).get("other_income", 0))

		gti = salary + house + business + capital_gains + other

		sec_80c = min(150000.0, float(deductions.get("sec_80c", 0)))
		sec_80d = float(deductions.get("sec_80d_self", 0)) + float(deductions.get("sec_80d_parents", 0))
		sec_80ccd = min(50000.0, float(deductions.get("sec_80ccd_1b", 0)))
		hra = float(deductions.get("hra_exemption", 0))
		sec_24b = min(200000.0, float(deductions.get("sec_24b_home_loan", 0)))

		total_old_deductions = sec_80c + sec_80d + sec_80ccd + hra + sec_24b

		old_calc = tax_engine.calculate_tax(gti, total_old_deductions, "old", apply_standard_deduction=True)
		new_calc = tax_engine.calculate_tax(gti, 0.0, "new", apply_standard_deduction=True)

		new_tax = new_calc.get("tax_after_cess", 0.0)
		old_tax = old_calc.get("tax_after_cess", 0.0)

		recommended_regime = "new" if new_tax <= old_tax else "old"
		chosen_tax = min(new_tax, old_tax)

		refund_due = max(0.0, tds - chosen_tax)
		balance_payable = max(0.0, chosen_tax - tds)

		return {
			"gross_total_income": gti,
			"breakdown": {
				"salary": salary,
				"house_property": house,
				"business": business,
				"capital_gains": capital_gains,
				"other_income": other,
			},
			"deductions_claimed": {
				"section_80c": sec_80c,
				"section_80d": sec_80d,
				"section_80ccd_1b": sec_80ccd,
				"hra_exemption": hra,
				"section_24b": sec_24b,
				"total_old_deductions": total_old_deductions,
			},
			"tds_deposited": tds,
			"new_regime_tax": new_tax,
			"old_regime_tax": old_tax,
			"cheaper_regime": recommended_regime,
			"tax_savings_under_cheaper": abs(new_tax - old_tax),
			"estimated_refund": refund_due,
			"estimated_balance_due": balance_payable,
		}

	async def _get_user_capital_gains(self) -> Dict[str, Any]:
		workspace = await self._get_active_workspace()
		if not workspace or not workspace.progress_data:
			return {"status": "no_capital_gains_data", "message": "No capital gains recorded yet in the return workspace."}

		cg = workspace.progress_data.get("income_sources", {}).get("capital_gains", {})
		return {
			"enabled": cg.get("enabled", False),
			"listed_equity_stcg_sec111a": float(cg.get("listed_equity_stcg", 0)),
			"listed_equity_ltcg_sec112a": float(cg.get("listed_equity_ltcg", 0)),
			"property_gains": float(cg.get("property_gains", 0)),
			"crypto_vda_gains": float(cg.get("crypto_vda_gains", 0)),
			"has_loss_carry_forward": bool(cg.get("has_loss_carry_forward", False)),
			"applicable_rates": {
				"stcg_equity": "20% under Section 111A",
				"ltcg_equity": "12.5% under Section 112A (with ₹1.25L exemption threshold)",
				"crypto_vda": "30% under Section 115BBH (no loss offset)",
			},
		}

	async def _query_user_documents(self, args: Dict[str, Any]) -> Dict[str, Any]:
		query = str(args.get("query", "")).strip().lower()
		doc_type = str(args.get("document_type", "all")).lower()

		query_stmt = (
			select(FilingDocument)
			.join(FilingWorkspace)
			.join(TaxpayerProfile)
			.where(TaxpayerProfile.owner_id == self.user_id)
		)
		if doc_type != "all":
			query_stmt = query_stmt.where(FilingDocument.category == doc_type)
		query_stmt = query_stmt.order_by(FilingDocument.uploaded_at.desc())

		docs = list(await self.db.scalars(query_stmt))
		if not docs:
			return {
				"status": "no_documents_found",
				"message": f"No uploaded documents found for user in category '{doc_type}'.",
				"matches": [],
			}

		matches = []
		keywords = [k for k in query.split() if len(k) > 2]

		for doc in docs:
			try:
				parsed = parse_document(doc)
				items = parsed.get("items", [])
				matching_items = []
				for item in items:
					desc = str(item.get("description", "")).lower()
					cat = str(item.get("category", "")).lower()
					if any(kw in desc or kw in cat for kw in keywords) or query in desc or query in cat:
						matching_items.append(item)
					elif not keywords:
						matching_items.append(item)

				raw_excerpt = ""
				try:
					decrypted = decrypt_document(doc.encrypted_content)
					if doc.content_type == "application/pdf" or doc.original_name.lower().endswith(".pdf"):
						raw_text = extract_pdf_text(decrypted)
						for line in raw_text.splitlines():
							if any(kw in line.lower() for kw in keywords):
								raw_excerpt += line.strip() + "\n"
				except Exception:
					pass

				if matching_items or raw_excerpt:
					matches.append({
						"document_name": doc.original_name,
						"category": doc.category,
						"uploaded_at": str(doc.uploaded_at),
						"structured_facts": matching_items[:10],
						"text_excerpts": raw_excerpt[:800],
					})
			except Exception as err:
				logger.warning(f"Error reading document {doc.id} in query_user_documents: {err}")

		if not matches:
			return {
				"status": "no_matching_facts",
				"message": f"Searched {len(docs)} uploaded document(s) ({', '.join(d.original_name for d in docs)}), but found no specific details matching '{query}'.",
				"documents_searched": [d.original_name for d in docs],
			}

		return {
			"status": "success",
			"document_count_searched": len(docs),
			"matches": matches,
		}
