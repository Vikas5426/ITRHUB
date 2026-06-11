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
