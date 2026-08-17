from datetime import date, datetime, timezone
from typing import Any

from sqlalchemy import (
	Boolean,
	Date,
	DateTime,
	ForeignKey,
	Integer,
	LargeBinary,
	String,
	UniqueConstraint,
	JSON,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship as orm_relationship

from app.core.database import Base


def utc_now() -> datetime:
	return datetime.now(timezone.utc)


class User(Base):
	__tablename__ = "users"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
	full_name: Mapped[str] = mapped_column(String(120))
	password_hash: Mapped[str] = mapped_column(String(255))
	phone_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
	avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
	bio: Mapped[str | None] = mapped_column(String(500), nullable=True)
	occupation: Mapped[str | None] = mapped_column(String(100), nullable=True)
	address_line: Mapped[str | None] = mapped_column(String(255), nullable=True)
	city: Mapped[str | None] = mapped_column(String(100), nullable=True)
	state: Mapped[str | None] = mapped_column(String(100), nullable=True)
	pincode: Mapped[str | None] = mapped_column(String(10), nullable=True)
	gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
	date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
	is_active: Mapped[bool] = mapped_column(Boolean, default=True)
	created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
	updated_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True), default=utc_now, onupdate=utc_now
	)

	profiles: Mapped[list["TaxpayerProfile"]] = orm_relationship(
		back_populates="owner", cascade="all, delete-orphan"
	)
	conversations: Mapped[list["AIConversation"]] = orm_relationship(
		back_populates="user", cascade="all, delete-orphan"
	)


class TaxpayerProfile(Base):
	__tablename__ = "taxpayer_profiles"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	owner_id: Mapped[int] = mapped_column(
		ForeignKey("users.id", ondelete="CASCADE"), index=True
	)
	display_name: Mapped[str] = mapped_column(String(120))
	entity_type: Mapped[str] = mapped_column(String(20), default="individual")
	relationship: Mapped[str] = mapped_column(String(30), default="self")
	full_pan: Mapped[str | None] = mapped_column(String(10), nullable=True)
	pan_last_four: Mapped[str | None] = mapped_column(String(4), nullable=True)
	aadhaar_last_four: Mapped[str | None] = mapped_column(String(4), nullable=True)
	date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
	residency_status: Mapped[str] = mapped_column(String(20), default="resident")
	is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
	created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
	updated_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True), default=utc_now, onupdate=utc_now
	)

	owner: Mapped[User] = orm_relationship(back_populates="profiles")
	workspaces: Mapped[list["FilingWorkspace"]] = orm_relationship(
		back_populates="profile", cascade="all, delete-orphan"
	)


class FilingWorkspace(Base):
	__tablename__ = "filing_workspaces"
	__table_args__ = (
		UniqueConstraint(
			"profile_id", "assessment_year_start", name="uq_profile_assessment_year"
		),
	)

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	profile_id: Mapped[int] = mapped_column(
		ForeignKey("taxpayer_profiles.id", ondelete="CASCADE"), index=True
	)
	assessment_year_start: Mapped[int] = mapped_column(Integer)
	itr_form: Mapped[str | None] = mapped_column(String(10), nullable=True)
	status: Mapped[str] = mapped_column(String(30), default="not_started")
	completion_percent: Mapped[int] = mapped_column(Integer, default=0)
	current_section: Mapped[str] = mapped_column(String(80), default="personal_details")
	revision: Mapped[int] = mapped_column(Integer, default=1)
	progress_data: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
	created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
	updated_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True), default=utc_now, onupdate=utc_now
	)

	profile: Mapped[TaxpayerProfile] = orm_relationship(back_populates="workspaces")
	documents: Mapped[list["FilingDocument"]] = orm_relationship(
		back_populates="workspace", cascade="all, delete-orphan"
	)


class FilingDocument(Base):
	__tablename__ = "filing_documents"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	workspace_id: Mapped[int] = mapped_column(
		ForeignKey("filing_workspaces.id", ondelete="CASCADE"), index=True
	)
	category: Mapped[str] = mapped_column(String(40))
	original_name: Mapped[str] = mapped_column(String(255))
	content_type: Mapped[str] = mapped_column(String(100))
	size_bytes: Mapped[int] = mapped_column(Integer)
	sha256: Mapped[str] = mapped_column(String(64))
	encrypted_content: Mapped[bytes] = mapped_column(LargeBinary)
	uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

	workspace: Mapped[FilingWorkspace] = orm_relationship(back_populates="documents")


class AIConversation(Base):
	__tablename__ = "ai_conversations"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	user_id: Mapped[int] = mapped_column(
		ForeignKey("users.id", ondelete="CASCADE"), index=True
	)
	title: Mapped[str] = mapped_column(String(200), default="Tax Consultation")
	created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
	updated_at: Mapped[datetime] = mapped_column(
		DateTime(timezone=True), default=utc_now, onupdate=utc_now
	)

	user: Mapped[User] = orm_relationship(back_populates="conversations")
	messages: Mapped[list["AIMessageRecord"]] = orm_relationship(
		back_populates="conversation",
		cascade="all, delete-orphan",
		order_by="AIMessageRecord.created_at",
	)


class AIMessageRecord(Base):
	__tablename__ = "ai_messages"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	conversation_id: Mapped[int] = mapped_column(
		ForeignKey("ai_conversations.id", ondelete="CASCADE"), index=True
	)
	role: Mapped[str] = mapped_column(String(20))  # "user" or "assistant"
	content: Mapped[str] = mapped_column(String)
	sources: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
	created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

	conversation: Mapped[AIConversation] = orm_relationship(back_populates="messages")
