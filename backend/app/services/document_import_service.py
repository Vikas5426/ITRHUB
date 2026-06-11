import csv
import io
import json
import re
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

from app.core.security import decrypt_document
from app.models.user import FilingDocument


CATEGORY_KEYWORDS = {
	"salary_income": ("salary", "gross salary", "employer", "form 16"),
	"interest_income": ("interest", "savings", "deposit", "fd"),
	"dividend_income": ("dividend",),
	"capital_gains": ("capital gain", "stcg", "ltcg", "securities", "mutual fund"),
	"business_income": ("business", "profession", "freelance", "consulting"),
	"rental_income": ("rent", "house property", "tenant"),
	"tds": ("tds", "tax deducted", "taxdeducted", "deducted"),
	"deduction_80c": ("80c", "elss", "ppf", "life insurance", "epf"),
	"deduction_80d": ("80d", "medical insurance", "health insurance"),
	"other_income": ("other income", "income from other sources"),
}


def reconcile_documents(documents: list[FilingDocument]) -> dict[str, Any]:
	items: list[dict[str, Any]] = []
	document_summaries: list[dict[str, Any]] = []

	for document in documents:
		parsed = parse_document(document)
		items.extend(parsed["items"])
		document_summaries.append(parsed["summary"])

	category_amounts: dict[str, list[float]] = defaultdict(list)
	for item in items:
		category_amounts[item["category"]].append(item["amount"])
	totals = build_totals(category_amounts)

	findings = build_findings(items, totals, document_summaries)
	return {
		"generated_at": datetime.now(timezone.utc).isoformat(),
		"documents_reviewed": document_summaries,
		"totals": dict(sorted(totals.items())),
		"items": items,
		"findings": findings,
		"action_items": [finding["message"] for finding in findings if finding["severity"] != "info"],
	}


def parse_document(document: FilingDocument) -> dict[str, Any]:
	content = decrypt_document(document.encrypted_content)
	text = ""
	items: list[dict[str, Any]] = []
	parser = "unsupported"
	status = "parsed"

	try:
		if document.content_type == "application/json" or document.original_name.lower().endswith(".json"):
			parser = "json"
			payload = json.loads(content.decode("utf-8-sig"))
			items = parse_json_payload(payload, document)
		elif document.content_type in {"text/csv", "application/vnd.ms-excel"} or document.original_name.lower().endswith(".csv"):
			parser = "csv"
			text = content.decode("utf-8-sig")
			items = parse_csv_payload(text, document)
		elif document.content_type == "application/pdf" or document.original_name.lower().endswith(".pdf"):
			parser = "pdf"
			text = extract_pdf_text(content)
			items = parse_text_payload(text, document)
		else:
			status = "needs_manual_review"
	except Exception as exc:  # Keep bad files from breaking the whole reconciliation.
		status = "needs_manual_review"
		text = str(exc)

	if not items and status == "parsed":
		status = "needs_manual_review"

	return {
		"summary": {
			"document_id": document.id,
			"name": document.original_name,
			"category": document.category,
			"parser": parser,
			"status": status,
			"items_found": len(items),
		},
		"items": items,
	}


def build_totals(category_amounts: dict[str, list[float]]) -> dict[str, float]:
	totals: dict[str, float] = {}
	for category, amounts in category_amounts.items():
		rounded = [round(amount, 2) for amount in amounts]
		if len(set(rounded)) == 1:
			totals[category] = rounded[0]
		else:
			totals[category] = round(sum(rounded), 2)
	return totals


def parse_json_payload(payload: Any, document: FilingDocument) -> list[dict[str, Any]]:
	rows = payload if isinstance(payload, list) else flatten_json(payload)
	if isinstance(rows, dict):
		rows = [rows]
	items: list[dict[str, Any]] = []
	for row in rows:
		if isinstance(row, dict):
			items.extend(parse_mapping(row, document))
	return items


def parse_csv_payload(text: str, document: FilingDocument) -> list[dict[str, Any]]:
	reader = csv.DictReader(io.StringIO(text))
	items: list[dict[str, Any]] = []
	for row in reader:
		items.extend(parse_mapping(row, document))
	if not items:
		items = parse_text_payload(text, document)
	return items


def parse_text_payload(text: str, document: FilingDocument) -> list[dict[str, Any]]:
	items: list[dict[str, Any]] = []
	for category, keywords in CATEGORY_KEYWORDS.items():
		for keyword in keywords:
			pattern = rf"{re.escape(keyword)}[^0-9-]*(?:inr|rs\.?|₹)?\s*([0-9][0-9,]*(?:\.\d+)?)"
			for match in re.finditer(pattern, text, flags=re.IGNORECASE):
				items.append(make_item(document, category, keyword.title(), parse_amount(match.group(1)), 0.55))
	return items


def parse_mapping(row: dict[str, Any], document: FilingDocument) -> list[dict[str, Any]]:
	normalized = {normalize_key(key): value for key, value in row.items()}
	description = first_text_value(
		normalized,
		("description", "particulars", "transaction_type", "information_category", "source", "type", "section"),
	)
	items: list[dict[str, Any]] = []
	descriptor_keys = {"description", "particulars", "transaction_type", "information_category", "source", "type", "section"}
	for key, value in normalized.items():
		if key in descriptor_keys:
			continue
		amount = parse_amount(value)
		if amount <= 0:
			continue
		category = classify_value(f"{key} {description}") or classify_value(document.category)
		if category:
			items.append(make_item(document, category, description or key, amount, 0.8))
	return collapse_duplicate_row_items(items)


def flatten_json(payload: Any, prefix: str = "") -> dict[str, Any] | list[dict[str, Any]]:
	if isinstance(payload, list):
		flattened = []
		for item in payload:
			if isinstance(item, dict):
				flattened.append(flatten_json(item))
		return flattened
	if not isinstance(payload, dict):
		return {prefix or "value": payload}
	result: dict[str, Any] = {}
	for key, value in payload.items():
		next_key = f"{prefix}_{key}" if prefix else str(key)
		if isinstance(value, dict):
			result.update(flatten_json(value, next_key))
		elif isinstance(value, list):
			for index, item in enumerate(value):
				if isinstance(item, dict):
					result.update(flatten_json(item, f"{next_key}_{index}"))
				else:
					result[f"{next_key}_{index}"] = item
		else:
			result[next_key] = value
	return result


def collapse_duplicate_row_items(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
	seen: set[tuple[str, float]] = set()
	collapsed: list[dict[str, Any]] = []
	for item in items:
		key = (item["category"], item["amount"])
		if key not in seen:
			seen.add(key)
			collapsed.append(item)
	return collapsed


def build_findings(
	items: list[dict[str, Any]], totals: dict[str, float], summaries: list[dict[str, Any]]
) -> list[dict[str, str]]:
	findings: list[dict[str, str]] = []
	if not summaries:
		return [{"severity": "warning", "message": "Upload Form 16, AIS/TIS, or Form 26AS before reconciling."}]
	for summary in summaries:
		if summary["status"] != "parsed":
			findings.append({
				"severity": "warning",
				"message": f"{summary['name']} needs manual review; no structured tax data was extracted.",
			})
	if totals.get("salary_income", 0) > 0 and totals.get("tds", 0) <= 0:
		findings.append({"severity": "warning", "message": "Salary income was found but no TDS amount was detected."})
	if totals.get("interest_income", 0) > 0 and totals.get("interest_income", 0) >= 10_000:
		findings.append({"severity": "info", "message": "Interest income crosses Rs 10,000; verify savings and FD interest treatment."})
	if totals.get("capital_gains", 0) > 0:
		findings.append({"severity": "warning", "message": "Capital gains were found; ensure broker/CAS statements are imported before selecting the ITR form."})
	if not items:
		findings.append({"severity": "warning", "message": "No recognizable income, deduction, or tax-paid entries were found."})
	if not findings:
		findings.append({"severity": "info", "message": "No obvious mismatches found from the imported documents."})
	return findings


def classify_value(text: str) -> str | None:
	normalized = text.lower().replace("_", " ")
	for category, keywords in CATEGORY_KEYWORDS.items():
		if any(keyword in normalized for keyword in keywords):
			return category
	if "amount" in normalized and "income" in normalized:
		return "other_income"
	return None


def first_text_value(row: dict[str, Any], keys: tuple[str, ...]) -> str:
	for key in keys:
		value = row.get(key)
		if value not in (None, ""):
			return str(value)
	return ""


def normalize_key(key: Any) -> str:
	text = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", str(key).strip())
	return re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")


def parse_amount(value: Any) -> float:
	if value is None:
		return 0.0
	text = str(value)
	if not re.search(r"\d", text):
		return 0.0
	text = text.replace(",", "").replace("₹", "").replace("Rs.", "").replace("INR", "")
	match = re.search(r"-?\d+(?:\.\d+)?", text)
	if not match:
		return 0.0
	try:
		return abs(float(match.group(0)))
	except ValueError:
		return 0.0


def make_item(
	document: FilingDocument,
	category: str,
	description: str,
	amount: float,
	confidence: float,
) -> dict[str, Any]:
	return {
		"document_id": document.id,
		"document_name": document.original_name,
		"document_category": document.category,
		"category": category,
		"description": description[:120] or category,
		"amount": round(amount, 2),
		"confidence": confidence,
	}


def extract_pdf_text(content: bytes) -> str:
	try:
		import pdfplumber
	except ImportError as exc:
		raise RuntimeError("PDF parsing dependencies are not installed") from exc
	with pdfplumber.open(io.BytesIO(content)) as pdf:
		return "\n".join(page.extract_text() or "" for page in pdf.pages)
