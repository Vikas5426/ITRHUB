import json
import logging
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import FilingDocument, FilingWorkspace, TaxpayerProfile, User
from app.services import tax_engine

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
