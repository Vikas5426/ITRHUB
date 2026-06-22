from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Any

from app.services.tax_engine import calculate_tax


SUPPORTED_ITR_FORMS = [f"ITR-{index}" for index in range(1, 8)]


@dataclass(frozen=True)
class ValidationRule:
	code: str
	severity: str
	forms: set[str]
	schedule: str
	message: str
	explanation: str
	action: str


VALIDATION_RULES = [
	ValidationRule(
		code="ITRHUB-001",
		severity="error",
		forms=set(SUPPORTED_ITR_FORMS),
		schedule="Part A - General",
		message="Income sources are not completed.",
		explanation="The return cannot be prepared until the income-source wizard has saved a source-wise income summary.",
		action="Open the income-source wizard, review every income bucket, and save it for this filing workspace.",
	),
	ValidationRule(
		code="ITRHUB-002",
		severity="error",
		forms={"ITR-1"},
		schedule="ITR selection",
		message="ITR-1 cannot be used for this income mix.",
		explanation="ITR-1 is intended for simple resident individual returns. Business income, capital gains, foreign assets, multiple house properties, or total income above the supported limit need another ITR form.",
		action="Use the recommended form shown in this preparation pack and re-run preparation.",
	),
	ValidationRule(
		code="ITRHUB-003",
		severity="error",
		forms={"ITR-4"},
		schedule="Business / Profession",
		message="ITR-4 needs presumptive business or profession income.",
		explanation="ITR-4 is designed for eligible presumptive income cases. Non-presumptive business/profession income usually moves to ITR-3 or entity-specific forms.",
		action="Mark a valid presumptive scheme in the income wizard or switch the return form.",
	),
	ValidationRule(
		code="ITRHUB-004",
		severity="warning",
		forms=set(SUPPORTED_ITR_FORMS),
		schedule="TDS / Taxes Paid",
		message="Income exists but no tax credit is captured.",
		explanation="If AIS, Form 16, Form 26AS, or challan details show tax credits, missing them here can overstate self-assessment tax.",
		action="Upload/reconcile Form 16, AIS/TIS, and Form 26AS or add challan details before final filing.",
	),
	ValidationRule(
		code="ITRHUB-005",
		severity="warning",
		forms={"ITR-2", "ITR-3", "ITR-5", "ITR-6", "ITR-7"},
		schedule="Schedule FA",
		message="Foreign asset reporting may be required.",
		explanation="Foreign assets, foreign signing authority, or foreign income require careful Schedule FA and tax-credit reporting.",
		action="Review foreign bank, equity, ESOP, RSU, and tax-credit details before generating final portal JSON.",
	),
	ValidationRule(
		code="ITRHUB-006",
		severity="warning",
		forms=set(SUPPORTED_ITR_FORMS),
		schedule="Reconciliation",
		message="Document reconciliation has not been run.",
		explanation="The preparation pack can be generated from manual entries, but unreconciled documents increase mismatch risk with AIS/26AS/Form 16.",
		action="Open Document Import and run reconciliation before final review.",
	),
]


def _money(value: Any) -> float:
	try:
		return round(float(value or 0), 2)
	except (TypeError, ValueError):
		return 0.0


def _active_sources(income_summary: dict[str, Any]) -> set[str]:
	raw = income_summary.get("active_sources") or []
	return {str(item) for item in raw}


def _recommended_form(progress_data: dict[str, Any], fallback: str | None) -> str:
	recommended = progress_data.get("recommended_itr") or fallback or "ITR-1"
	return recommended if recommended in SUPPORTED_ITR_FORMS else "ITR-1"


def _build_common_schedules(
	workspace_id: int,
	assessment_year_start: int,
	itr_form: str,
	income_summary: dict[str, Any],
	income_sources: dict[str, Any],
	reconciliation: dict[str, Any],
) -> list[dict[str, Any]]:
	totals = reconciliation.get("totals", {}) if reconciliation else {}
	other = income_sources.get("other", {}) if income_sources else {}
	salary = income_sources.get("salary", {}) if income_sources else {}
	business = income_sources.get("business", {}) if income_sources else {}
	house = income_sources.get("house_property", {}) if income_sources else {}
	capital = income_sources.get("capital_gains", {}) if income_sources else {}
	foreign = income_sources.get("foreign", {}) if income_sources else {}

	return [
		{
			"code": "PART_A_GENERAL",
			"name": "Part A - General Information",
			"status": "draft",
			"fields": {
				"workspace_id": workspace_id,
				"assessment_year": f"{assessment_year_start}-{str(assessment_year_start + 1)[-2:]}",
				"itr_form": itr_form,
			},
		},
		{
			"code": "SCHEDULE_S",
			"name": "Schedule S - Salary",
			"status": "ready" if _money(income_summary.get("salary_income")) else "not_applicable",
			"fields": {
				"gross_salary": _money(income_summary.get("salary_income")),
				"standard_deduction": _money(salary.get("standard_deduction")),
				"professional_tax": _money(salary.get("professional_tax")),
				"tds": _money(salary.get("tds")) or _money(totals.get("tds")),
			},
		},
		{
			"code": "SCHEDULE_HP",
			"name": "Schedule HP - House Property",
			"status": "ready" if house.get("enabled") else "not_applicable",
			"fields": {
				"property_count": int(house.get("property_count") or 0),
				"rental_income": _money(house.get("rental_income")),
				"municipal_taxes": _money(house.get("municipal_taxes")),
				"home_loan_interest": _money(house.get("home_loan_interest")),
				"net_house_property_income": _money(income_summary.get("house_property_income")),
			},
		},
		{
			"code": "SCHEDULE_BP",
			"name": "Schedule BP - Business or Profession",
			"status": "ready" if _money(income_summary.get("business_income")) or business.get("enabled") else "not_applicable",
			"fields": {
				"business_type": business.get("business_type", "none"),
				"presumptive_scheme": business.get("presumptive_scheme", "none"),
				"gross_receipts": _money(business.get("gross_receipts")),
				"expenses": _money(business.get("expenses")),
				"net_profit": _money(income_summary.get("business_income")),
				"requires_audit": bool(business.get("requires_audit")),
			},
		},
		{
			"code": "SCHEDULE_CG",
			"name": "Schedule CG - Capital Gains",
			"status": "ready" if _money(income_summary.get("capital_gains")) or capital.get("has_loss_carry_forward") else "not_applicable",
			"fields": {
				"listed_equity_stcg": _money(capital.get("listed_equity_stcg")),
				"listed_equity_ltcg": _money(capital.get("listed_equity_ltcg")),
				"property_gains": _money(capital.get("property_gains")),
				"crypto_vda_gains": _money(capital.get("crypto_vda_gains")),
				"has_loss_carry_forward": bool(capital.get("has_loss_carry_forward")),
			},
		},
		{
			"code": "SCHEDULE_OS",
			"name": "Schedule OS - Other Sources",
			"status": "ready" if _money(income_summary.get("other_income")) else "not_applicable",
			"fields": {
				"interest_income": _money(other.get("interest_income")) or _money(totals.get("interest_income")),
				"dividend_income": _money(other.get("dividend_income")) or _money(totals.get("dividend_income")),
				"other_income": _money(other.get("other_income")),
			},
		},
		{
			"code": "SCHEDULE_EI",
			"name": "Schedule EI - Exempt Income",
			"status": "ready" if _money(income_summary.get("exempt_income")) or _money(income_summary.get("agricultural_income")) else "not_applicable",
			"fields": {
				"agricultural_income": _money(income_summary.get("agricultural_income")),
				"other_exempt_income": _money(income_summary.get("exempt_income")),
			},
		},
		{
			"code": "SCHEDULE_FA",
			"name": "Schedule FA - Foreign Assets",
			"status": "needs_review" if foreign.get("foreign_assets") else "not_applicable",
			"fields": {
				"foreign_income": _money(income_summary.get("foreign_income")),
				"foreign_assets": bool(foreign.get("foreign_assets")),
				"foreign_tax_credit": _money(foreign.get("foreign_tax_credit")),
			},
		},
	]


def _form_specific_schedules(itr_form: str, income_sources: dict[str, Any]) -> list[dict[str, Any]]:
	business = income_sources.get("business", {}) if income_sources else {}
	return {
		"ITR-1": [
			{"code": "ITR1_SUMMARY", "name": "ITR-1 Sahaj Summary", "status": "draft", "fields": {"supported_scope": "salary_one_house_other_sources"}}
		],
		"ITR-2": [
			{"code": "ITR2_CAPITAL_ASSET_REVIEW", "name": "ITR-2 Capital Asset Review", "status": "draft", "fields": {"capital_gains_supported": True}}
		],
		"ITR-3": [
			{"code": "ITR3_PNL", "name": "ITR-3 Profit and Loss", "status": "needs_review", "fields": {"requires_audit": bool(business.get("requires_audit"))}},
			{"code": "ITR3_BALANCE_SHEET", "name": "ITR-3 Balance Sheet", "status": "needs_review", "fields": {"manual_review_required": True}},
		],
		"ITR-4": [
			{"code": "ITR4_PRESUMPTIVE", "name": "ITR-4 Presumptive Income", "status": "draft", "fields": {"scheme": business.get("presumptive_scheme", "none")}}
		],
		"ITR-5": [
			{"code": "ITR5_ENTITY_RETURN", "name": "ITR-5 Firm/AOP/LLP Schedules", "status": "needs_review", "fields": {"entity_review_required": True}}
		],
		"ITR-6": [
			{"code": "ITR6_COMPANY_RETURN", "name": "ITR-6 Company Schedules", "status": "needs_review", "fields": {"company_review_required": True}}
		],
		"ITR-7": [
			{"code": "ITR7_TRUST_INSTITUTION", "name": "ITR-7 Trust/Institution Schedules", "status": "needs_review", "fields": {"trust_review_required": True}}
		],
	}.get(itr_form, [])


def _validate(
	itr_form: str,
	recommended_itr: str,
	income_summary: dict[str, Any],
	income_sources: dict[str, Any],
	reconciliation: dict[str, Any] | None,
) -> list[dict[str, Any]]:
	active = _active_sources(income_summary)
	business = income_sources.get("business", {}) if income_sources else {}
	foreign = income_sources.get("foreign", {}) if income_sources else {}
	issues: list[dict[str, Any]] = []

	for rule in VALIDATION_RULES:
		applies = False
		if rule.code == "ITRHUB-001":
			applies = not income_summary
		elif rule.code == "ITRHUB-002":
			applies = itr_form == "ITR-1" and recommended_itr != "ITR-1"
		elif rule.code == "ITRHUB-003":
			applies = itr_form == "ITR-4" and business.get("presumptive_scheme", "none") == "none"
		elif rule.code == "ITRHUB-004":
			applies = _money(income_summary.get("gross_total_income")) > 0 and _money(income_summary.get("taxes_paid")) <= 0
		elif rule.code == "ITRHUB-005":
			applies = bool(foreign.get("foreign_assets")) or "foreign" in active
		elif rule.code == "ITRHUB-006":
			applies = not reconciliation

		if applies and itr_form in rule.forms:
			issues.append(
				{
					"code": rule.code,
					"severity": rule.severity,
					"schedule": rule.schedule,
					"message": rule.message,
					"plain_language": rule.explanation,
					"suggested_fix": rule.action,
				}
			)
	return issues


def _interest_estimate(tax_due: float, filing_date: date | None = None) -> dict[str, Any]:
	filing_date = filing_date or date.today()
	monthly_interest_base = max(0.0, tax_due)
	months_after_due = max(0, (filing_date.year - 2026) * 12 + filing_date.month - 7)
	interest_234a = round(monthly_interest_base * 0.01 * months_after_due, 2)
	interest_234b = round(monthly_interest_base * 0.01 * 3, 2) if tax_due >= 10_000 else 0.0
	interest_234c = round(monthly_interest_base * 0.01, 2) if tax_due >= 10_000 else 0.0
	return {
		"section_234a": interest_234a,
		"section_234b": interest_234b,
		"section_234c": interest_234c,
		"total_interest": round(interest_234a + interest_234b + interest_234c, 2),
		"plain_language": "Interest is estimated at 1% per month where applicable. Treat this as a filing-prep estimate and verify against the final portal utility.",
	}


def prepare_return_pack(
	workspace_id: int,
	assessment_year_start: int,
	itr_form: str | None,
	progress_data: dict[str, Any] | None,
) -> dict[str, Any]:
	progress_data = progress_data or {}
	income_summary = progress_data.get("income_summary") or {}
	income_sources = progress_data.get("income_sources") or {}
	reconciliation = progress_data.get("document_reconciliation")
	recommended_itr = _recommended_form(progress_data, itr_form)
	selected_itr = itr_form or recommended_itr

	gross_total_income = _money(income_summary.get("gross_total_income"))
	tax_paid = _money(income_summary.get("taxes_paid"))
	deductions = _money(income_sources.get("salary", {}).get("standard_deduction"))
	tax_calc = calculate_tax(
		gross_total_income,
		deductions=deductions,
		regime="new",
		apply_standard_deduction=False,
	)
	tax_payable_before_credits = _money(tax_calc.get("tax_after_cess"))
	net_due = round(tax_payable_before_credits - tax_paid, 2)
	refund = abs(net_due) if net_due < 0 else 0.0
	tax_due = net_due if net_due > 0 else 0.0
	interest = _interest_estimate(tax_due)
	total_payable = round(tax_due + interest["total_interest"], 2)

	schedules = _build_common_schedules(
		workspace_id,
		assessment_year_start,
		selected_itr,
		income_summary,
		income_sources,
		reconciliation or {},
	)
	schedules.extend(_form_specific_schedules(selected_itr, income_sources))
	validations = _validate(selected_itr, recommended_itr, income_summary, income_sources, reconciliation)

	portal_json = {
		"ITR": {
			"schemaVersion": "ITRHUB-DRAFT-AY2026-27-v1",
			"form": selected_itr,
			"assessmentYear": f"{assessment_year_start}-{str(assessment_year_start + 1)[-2:]}",
			"filingWorkspaceId": workspace_id,
			"partB_TI": {
				"grossTotalIncome": gross_total_income,
				"deductionsClaimed": deductions,
				"totalIncome": _money(tax_calc.get("taxable_income")),
			},
			"partB_TTI": {
				"taxBeforeCredits": tax_payable_before_credits,
				"taxPaid": tax_paid,
				"interest234A": interest["section_234a"],
				"interest234B": interest["section_234b"],
				"interest234C": interest["section_234c"],
				"taxPayable": total_payable,
				"refundDue": refund,
			},
			"schedules": {schedule["code"]: schedule["fields"] for schedule in schedules},
		}
	}

	return {
		"workspace_id": workspace_id,
		"assessment_year": portal_json["ITR"]["assessmentYear"],
		"itr_form": selected_itr,
		"recommended_itr": recommended_itr,
		"engine_version": "ITRHUB-DRAFT-AY2026-27-v1",
		"official_utility_status": "draft_compatible_export",
		"schedules": schedules,
		"validations": validations,
		"tax_summary": {
			"regime": tax_calc["regime"],
			"gross_total_income": gross_total_income,
			"deductions": deductions,
			"taxable_income": tax_calc["taxable_income"],
			"tax_before_credits": tax_payable_before_credits,
			"tax_paid": tax_paid,
			"refund": refund,
			"self_assessment_tax_due": tax_due,
			"interest": interest,
			"total_payable": total_payable,
		},
		"challan_guidance": {
			"is_required": total_payable > 0,
			"amount": total_payable,
			"challan": "ITNS 280 / e-Pay Tax",
			"minor_head": "300 - Self Assessment Tax",
			"plain_language": (
				"Pay this as self-assessment tax before final submission and enter the BSR code, challan serial number, date of deposit, and amount."
				if total_payable > 0
				else "No self-assessment tax is currently estimated. Verify AIS/26AS credits before filing."
			),
		},
		"portal_json": portal_json,
	}
