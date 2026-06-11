import hashlib
import re
from urllib.parse import quote

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import decrypt_document, encrypt_document
from app.dependencies.auth import get_current_user
from app.models.user import FilingDocument, FilingWorkspace, TaxpayerProfile, User
from app.schemas.workspace import (
	DocumentResponse,
	IncomeSourcesPayload,
	IncomeSourcesResponse,
	ProfileCreate,
	ProfileResponse,
	ProfileUpdate,
	ProgressUpdate,
	ReconciliationRequest,
	ReconciliationResponse,
	WorkspaceCreate,
	WorkspaceResponse,
	WorkspaceUpdate,
)
from app.services.document_import_service import reconcile_documents
from app.services.tax_engine import select_itr


router = APIRouter()
ALLOWED_CONTENT_TYPES = {
	"application/pdf",
	"application/json",
	"text/csv",
	"application/vnd.ms-excel",
	"image/jpeg",
	"image/png",
}


async def owned_profile(
	db: AsyncSession, profile_id: int, owner_id: int
) -> TaxpayerProfile:
	profile = await db.scalar(
		select(TaxpayerProfile).where(
			TaxpayerProfile.id == profile_id,
			TaxpayerProfile.owner_id == owner_id,
		)
	)
	if not profile:
		raise HTTPException(status_code=404, detail="Taxpayer profile not found")
	return profile


async def owned_workspace(
	db: AsyncSession, workspace_id: int, owner_id: int
) -> FilingWorkspace:
	workspace = await db.scalar(
		select(FilingWorkspace)
		.join(TaxpayerProfile)
		.where(
			FilingWorkspace.id == workspace_id,
			TaxpayerProfile.owner_id == owner_id,
		)
	)
	if not workspace:
		raise HTTPException(status_code=404, detail="Filing workspace not found")
	return workspace


@router.get("/profiles", response_model=list[ProfileResponse])
async def list_profiles(
	current_user: User = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	result = await db.scalars(
		select(TaxpayerProfile)
		.where(TaxpayerProfile.owner_id == current_user.id)
		.order_by(TaxpayerProfile.is_primary.desc(), TaxpayerProfile.created_at)
	)
	return list(result)


@router.post("/profiles", response_model=ProfileResponse, status_code=201)
async def create_profile(
	payload: ProfileCreate,
	current_user: User = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	profile = TaxpayerProfile(owner_id=current_user.id, **payload.model_dump())
	db.add(profile)
	await db.commit()
	await db.refresh(profile)
	return profile


@router.patch("/profiles/{profile_id}", response_model=ProfileResponse)
async def update_profile(
	profile_id: int,
	payload: ProfileUpdate,
	current_user: User = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	profile = await owned_profile(db, profile_id, current_user.id)
	for field, value in payload.model_dump(exclude_unset=True).items():
		setattr(profile, field, value)
	await db.commit()
	await db.refresh(profile)
	return profile


@router.delete("/profiles/{profile_id}", status_code=204)
async def delete_profile(
	profile_id: int,
	current_user: User = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	profile = await owned_profile(db, profile_id, current_user.id)
	if profile.is_primary:
		raise HTTPException(status_code=400, detail="The primary taxpayer cannot be deleted")
	await db.delete(profile)
	await db.commit()


@router.get("/filings", response_model=list[WorkspaceResponse])
async def list_workspaces(
	profile_id: int | None = None,
	current_user: User = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	query = (
		select(FilingWorkspace)
		.join(TaxpayerProfile)
		.where(TaxpayerProfile.owner_id == current_user.id)
		.order_by(FilingWorkspace.assessment_year_start.desc())
	)
	if profile_id is not None:
		query = query.where(FilingWorkspace.profile_id == profile_id)
	return list(await db.scalars(query))


@router.post("/filings", response_model=WorkspaceResponse, status_code=201)
async def create_workspace(
	payload: WorkspaceCreate,
	current_user: User = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	await owned_profile(db, payload.profile_id, current_user.id)
	workspace = FilingWorkspace(**payload.model_dump())
	db.add(workspace)
	try:
		await db.commit()
	except IntegrityError as exc:
		await db.rollback()
		raise HTTPException(
			status_code=409,
			detail="A workspace already exists for this taxpayer and assessment year",
		) from exc
	await db.refresh(workspace)
	return workspace


@router.patch("/filings/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
	workspace_id: int,
	payload: WorkspaceUpdate,
	current_user: User = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	workspace = await owned_workspace(db, workspace_id, current_user.id)
	for field, value in payload.model_dump(exclude_unset=True).items():
		setattr(workspace, field, value)
	await db.commit()
	await db.refresh(workspace)
	return workspace


@router.put("/filings/{workspace_id}/progress", response_model=WorkspaceResponse)
async def save_progress(
	workspace_id: int,
	payload: ProgressUpdate,
	current_user: User = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	workspace = await owned_workspace(db, workspace_id, current_user.id)
	if workspace.revision != payload.expected_revision:
		raise HTTPException(
			status_code=409,
			detail={
				"message": "This filing changed in another session",
				"current_revision": workspace.revision,
			},
		)
	workspace.current_section = payload.current_section
	workspace.completion_percent = payload.completion_percent
	workspace.progress_data = {
		**(workspace.progress_data or {}),
		**payload.progress_data,
	}
	workspace.revision += 1
	if workspace.status == "not_started":
		workspace.status = "in_progress"
	await db.commit()
	await db.refresh(workspace)
	return workspace


def summarize_income_sources(payload: IncomeSourcesPayload) -> tuple[dict, str, list[str]]:
	salary_total = payload.salary.gross_salary if payload.salary.enabled else 0
	house_total = 0.0
	if payload.house_property.enabled:
		house_total = max(
			0,
			payload.house_property.rental_income
			- payload.house_property.municipal_taxes
			- payload.house_property.home_loan_interest,
		)
	business_total = 0.0
	if payload.business.enabled:
		if payload.business.net_profit > 0:
			business_total = payload.business.net_profit
		else:
			business_total = max(0, payload.business.gross_receipts - payload.business.expenses)
	capital_total = 0.0
	if payload.capital_gains.enabled:
		capital_total = (
			payload.capital_gains.listed_equity_stcg
			+ payload.capital_gains.listed_equity_ltcg
			+ payload.capital_gains.property_gains
			+ payload.capital_gains.crypto_vda_gains
		)
	foreign_total = payload.foreign.foreign_income if payload.foreign.enabled else 0
	other_total = (
		payload.other.interest_income
		+ payload.other.dividend_income
		+ payload.other.other_income
	)
	gross_total = salary_total + house_total + business_total + capital_total + foreign_total + other_total
	taxes_paid = payload.salary.tds + payload.foreign.foreign_tax_credit
	has_capital_gains = payload.capital_gains.enabled and (
		capital_total > 0 or payload.capital_gains.has_loss_carry_forward
	)
	has_business = payload.business.enabled and (
		business_total > 0 or payload.business.gross_receipts > 0 or payload.business.business_type != "none"
	)
	is_presumptive = payload.business.presumptive_scheme != "none" and not payload.business.requires_audit
	has_foreign = payload.foreign.enabled and (
		foreign_total > 0 or payload.foreign.foreign_assets
	)
	if has_business and (has_capital_gains or has_foreign or payload.house_property.property_count > 1):
		recommended_itr = "ITR-3"
	else:
		recommended_itr = select_itr(
			has_salary=payload.salary.enabled,
			has_business=has_business,
			has_capital_gains=has_capital_gains or payload.house_property.property_count > 1,
			has_foreign_income=has_foreign,
			is_presumptive=is_presumptive,
		)
	warnings = []
	if payload.business.requires_audit:
		warnings.append("Business/profession audit is marked as required; verify tax audit deadlines and ITR-3/5 eligibility.")
	if payload.capital_gains.crypto_vda_gains > 0:
		warnings.append("VDA/crypto gains need special tax treatment and cannot be freely offset against other income.")
	if payload.foreign.foreign_assets:
		warnings.append("Foreign assets require careful Schedule FA reporting.")
	if payload.other.agricultural_income > 0:
		warnings.append("Agricultural income may affect rate calculation even when exempt.")
	if payload.salary.employer_count > 1:
		warnings.append("Multiple employers detected; reconcile all Form 16 entries and salary TDS.")
	summary = {
		"salary_income": salary_total,
		"house_property_income": house_total,
		"business_income": business_total,
		"capital_gains": capital_total,
		"foreign_income": foreign_total,
		"other_income": other_total,
		"agricultural_income": payload.other.agricultural_income,
		"exempt_income": payload.other.exempt_income,
		"gross_total_income": gross_total,
		"taxes_paid": taxes_paid,
		"active_sources": [
			name
			for name, enabled in {
				"salary": payload.salary.enabled,
				"house_property": payload.house_property.enabled,
				"business": has_business,
				"capital_gains": has_capital_gains,
				"foreign": has_foreign,
				"other": other_total > 0,
			}.items()
			if enabled
		],
	}
	return summary, recommended_itr, warnings


@router.get(
	"/filings/{workspace_id}/income-sources",
	response_model=IncomeSourcesResponse,
)
async def get_income_sources(
	workspace_id: int,
	current_user: User = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	workspace = await owned_workspace(db, workspace_id, current_user.id)
	raw_payload = (workspace.progress_data or {}).get("income_sources", {})
	payload = IncomeSourcesPayload.model_validate(raw_payload)
	summary, recommended_itr, warnings = summarize_income_sources(payload)
	return {
		"workspace_id": workspace_id,
		"income_sources": payload,
		"summary": summary,
		"recommended_itr": recommended_itr,
		"warnings": warnings,
	}


@router.put(
	"/filings/{workspace_id}/income-sources",
	response_model=IncomeSourcesResponse,
)
async def save_income_sources(
	workspace_id: int,
	payload: IncomeSourcesPayload,
	current_user: User = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	workspace = await owned_workspace(db, workspace_id, current_user.id)
	summary, recommended_itr, warnings = summarize_income_sources(payload)
	progress_data = dict(workspace.progress_data or {})
	completed_sections = set(progress_data.get("completedSections", []))
	completed_sections.add("income_sources")
	progress_data.update(
		{
			"income_sources": payload.model_dump(),
			"income_summary": summary,
			"recommended_itr": recommended_itr,
			"completedSections": list(completed_sections),
		}
	)
	workspace.progress_data = progress_data
	workspace.itr_form = recommended_itr
	workspace.current_section = "deductions"
	workspace.completion_percent = max(workspace.completion_percent, 40)
	workspace.revision += 1
	if workspace.status == "not_started":
		workspace.status = "in_progress"
	await db.commit()
	await db.refresh(workspace)
	return {
		"workspace_id": workspace_id,
		"income_sources": payload,
		"summary": summary,
		"recommended_itr": recommended_itr,
		"warnings": warnings,
	}


@router.get(
	"/filings/{workspace_id}/documents", response_model=list[DocumentResponse]
)
async def list_documents(
	workspace_id: int,
	current_user: User = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	await owned_workspace(db, workspace_id, current_user.id)
	return list(
		await db.scalars(
			select(FilingDocument)
			.where(FilingDocument.workspace_id == workspace_id)
			.order_by(FilingDocument.uploaded_at.desc())
		)
	)


@router.post(
	"/filings/{workspace_id}/documents",
	response_model=DocumentResponse,
	status_code=201,
)
async def upload_document(
	workspace_id: int,
	category: str = Form(..., min_length=2, max_length=40),
	file: UploadFile = File(...),
	current_user: User = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	await owned_workspace(db, workspace_id, current_user.id)
	settings = get_settings()
	content = await file.read(settings.max_document_bytes + 1)
	if not content:
		raise HTTPException(status_code=400, detail="The uploaded file is empty")
	if len(content) > settings.max_document_bytes:
		raise HTTPException(status_code=413, detail="Document exceeds the 10 MB limit")
	content_type = (file.content_type or "application/octet-stream").lower()
	if content_type not in ALLOWED_CONTENT_TYPES:
		raise HTTPException(
			status_code=415,
			detail="Only PDF, JSON, CSV, JPG, and PNG documents are supported",
		)
	filename = re.sub(r"[^A-Za-z0-9._ -]", "_", file.filename or "document")
	document = FilingDocument(
		workspace_id=workspace_id,
		category=category.strip().lower().replace(" ", "_"),
		original_name=filename[:255],
		content_type=content_type,
		size_bytes=len(content),
		sha256=hashlib.sha256(content).hexdigest(),
		encrypted_content=encrypt_document(content),
	)
	db.add(document)
	await db.commit()
	await db.refresh(document)
	return document


@router.get("/documents/{document_id}/download")
async def download_document(
	document_id: int,
	current_user: User = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	document = await db.scalar(
		select(FilingDocument)
		.join(FilingWorkspace)
		.join(TaxpayerProfile)
		.where(
			FilingDocument.id == document_id,
			TaxpayerProfile.owner_id == current_user.id,
		)
	)
	if not document:
		raise HTTPException(status_code=404, detail="Document not found")
	try:
		content = decrypt_document(document.encrypted_content)
	except ValueError as exc:
		raise HTTPException(status_code=500, detail=str(exc)) from exc
	return Response(
		content=content,
		media_type=document.content_type,
		headers={
			"Content-Disposition": (
				f"attachment; filename*=UTF-8''{quote(document.original_name)}"
			),
			"Cache-Control": "no-store",
		},
	)


@router.delete("/documents/{document_id}", status_code=204)
async def delete_document(
	document_id: int,
	current_user: User = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	document = await db.scalar(
		select(FilingDocument)
		.join(FilingWorkspace)
		.join(TaxpayerProfile)
		.where(
			FilingDocument.id == document_id,
			TaxpayerProfile.owner_id == current_user.id,
		)
	)
	if not document:
		raise HTTPException(status_code=404, detail="Document not found")
	await db.delete(document)
	await db.commit()


@router.post(
	"/filings/{workspace_id}/reconciliation",
	response_model=ReconciliationResponse,
)
async def run_reconciliation(
	workspace_id: int,
	payload: ReconciliationRequest,
	current_user: User = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	workspace = await owned_workspace(db, workspace_id, current_user.id)
	query = select(FilingDocument).where(FilingDocument.workspace_id == workspace_id)
	if payload.document_ids:
		query = query.where(FilingDocument.id.in_(payload.document_ids))
	documents = list(await db.scalars(query))
	report = reconcile_documents(documents)
	workspace.progress_data = {
		**(workspace.progress_data or {}),
		"document_reconciliation": report,
	}
	await db.commit()
	return {"workspace_id": workspace_id, **report}


@router.get(
	"/filings/{workspace_id}/reconciliation",
	response_model=ReconciliationResponse,
)
async def get_reconciliation(
	workspace_id: int,
	current_user: User = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	workspace = await owned_workspace(db, workspace_id, current_user.id)
	report = (workspace.progress_data or {}).get("document_reconciliation")
	if not report:
		raise HTTPException(status_code=404, detail="No reconciliation report found")
	return {"workspace_id": workspace_id, **report}
