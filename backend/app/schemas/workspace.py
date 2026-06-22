from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


EntityType = Literal["individual", "huf"]
RelationshipType = Literal["self", "spouse", "parent", "child", "other", "huf"]
ResidencyStatus = Literal["resident", "nri", "rnor"]


class ProfileCreate(BaseModel):
	display_name: str = Field(min_length=2, max_length=120)
	entity_type: EntityType = "individual"
	relationship: RelationshipType = "self"
	pan_last_four: str | None = Field(default=None, min_length=4, max_length=4)
	date_of_birth: date | None = None
	residency_status: ResidencyStatus = "resident"

	@field_validator("pan_last_four")
	@classmethod
	def normalize_pan_suffix(cls, value: str | None) -> str | None:
		if value is None:
			return None
		value = value.upper()
		if not value.isalnum():
			raise ValueError("PAN suffix must contain only letters and numbers")
		return value


class ProfileUpdate(BaseModel):
	display_name: str | None = Field(default=None, min_length=2, max_length=120)
	relationship: RelationshipType | None = None
	pan_last_four: str | None = Field(default=None, min_length=4, max_length=4)
	date_of_birth: date | None = None
	residency_status: ResidencyStatus | None = None


class ProfileResponse(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	id: int
	display_name: str
	entity_type: str
	relationship: str
	pan_last_four: str | None
	date_of_birth: date | None
	residency_status: str
	is_primary: bool
	created_at: datetime
	updated_at: datetime


class WorkspaceCreate(BaseModel):
	profile_id: int
	assessment_year_start: int = Field(ge=2020, le=2100)
	itr_form: str | None = Field(default=None, max_length=10)


class WorkspaceUpdate(BaseModel):
	itr_form: str | None = Field(default=None, max_length=10)
	status: Literal[
		"not_started", "in_progress", "ready_for_review", "filed"
	] | None = None


class ProgressUpdate(BaseModel):
	expected_revision: int = Field(ge=1)
	current_section: str = Field(min_length=1, max_length=80)
	completion_percent: int = Field(ge=0, le=100)
	progress_data: dict[str, Any]


class WorkspaceResponse(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	id: int
	profile_id: int
	assessment_year_start: int
	itr_form: str | None
	status: str
	completion_percent: int
	current_section: str
	revision: int
	progress_data: dict[str, Any]
	created_at: datetime
	updated_at: datetime


class DocumentResponse(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	id: int
	workspace_id: int
	category: str
	original_name: str
	content_type: str
	size_bytes: int
	sha256: str
	uploaded_at: datetime


class ReconciliationRequest(BaseModel):
	document_ids: list[int] | None = None


class ReconciliationResponse(BaseModel):
	workspace_id: int
	generated_at: datetime | str
	documents_reviewed: list[dict[str, Any]]
	totals: dict[str, float]
	items: list[dict[str, Any]]
	findings: list[dict[str, str]]
	action_items: list[str]


class SalaryIncome(BaseModel):
	enabled: bool = False
	employer_count: int = Field(default=1, ge=1, le=20)
	gross_salary: float = Field(default=0, ge=0)
	standard_deduction: float = Field(default=75_000, ge=0)
	professional_tax: float = Field(default=0, ge=0)
	tds: float = Field(default=0, ge=0)


class HousePropertyIncome(BaseModel):
	enabled: bool = False
	property_count: int = Field(default=1, ge=1, le=20)
	rental_income: float = Field(default=0, ge=0)
	home_loan_interest: float = Field(default=0, ge=0)
	municipal_taxes: float = Field(default=0, ge=0)


class BusinessIncome(BaseModel):
	enabled: bool = False
	business_type: Literal["none", "freelance", "profession", "business", "trading"] = "none"
	presumptive_scheme: Literal["none", "44ad", "44ada", "44ae"] = "none"
	gross_receipts: float = Field(default=0, ge=0)
	expenses: float = Field(default=0, ge=0)
	net_profit: float = Field(default=0, ge=0)
	requires_audit: bool = False


class CapitalGainsIncome(BaseModel):
	enabled: bool = False
	listed_equity_stcg: float = Field(default=0, ge=0)
	listed_equity_ltcg: float = Field(default=0, ge=0)
	property_gains: float = Field(default=0, ge=0)
	crypto_vda_gains: float = Field(default=0, ge=0)
	has_loss_carry_forward: bool = False


class ForeignIncome(BaseModel):
	enabled: bool = False
	foreign_income: float = Field(default=0, ge=0)
	foreign_assets: bool = False
	foreign_tax_credit: float = Field(default=0, ge=0)


class OtherIncome(BaseModel):
	interest_income: float = Field(default=0, ge=0)
	dividend_income: float = Field(default=0, ge=0)
	agricultural_income: float = Field(default=0, ge=0)
	other_income: float = Field(default=0, ge=0)
	exempt_income: float = Field(default=0, ge=0)


class IncomeSourcesPayload(BaseModel):
	salary: SalaryIncome = Field(default_factory=SalaryIncome)
	house_property: HousePropertyIncome = Field(default_factory=HousePropertyIncome)
	business: BusinessIncome = Field(default_factory=BusinessIncome)
	capital_gains: CapitalGainsIncome = Field(default_factory=CapitalGainsIncome)
	foreign: ForeignIncome = Field(default_factory=ForeignIncome)
	other: OtherIncome = Field(default_factory=OtherIncome)
	taxpayer_notes: str = Field(default="", max_length=2000)


class IncomeSourcesResponse(BaseModel):
	workspace_id: int
	income_sources: IncomeSourcesPayload
	summary: dict[str, Any]
	recommended_itr: str
	warnings: list[str]


class ReturnPreparationResponse(BaseModel):
	workspace_id: int
	assessment_year: str
	itr_form: str
	recommended_itr: str
	engine_version: str
	official_utility_status: str
	schedules: list[dict[str, Any]]
	validations: list[dict[str, Any]]
	tax_summary: dict[str, Any]
	challan_guidance: dict[str, Any]
	portal_json: dict[str, Any]


class ReturnPreparationRequest(BaseModel):
	itr_form: Literal["ITR-1", "ITR-2", "ITR-3", "ITR-4", "ITR-5", "ITR-6", "ITR-7"] | None = None
