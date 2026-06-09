"""Create taxpayer workspace tables.

Revision ID: 0001_taxpayer_workspace
Revises:
Create Date: 2026-06-09
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0001_taxpayer_workspace"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
	op.create_table(
		"users",
		sa.Column("id", sa.Integer(), primary_key=True),
		sa.Column("email", sa.String(length=320), nullable=False),
		sa.Column("full_name", sa.String(length=120), nullable=False),
		sa.Column("password_hash", sa.String(length=255), nullable=False),
		sa.Column("is_active", sa.Boolean(), nullable=False),
		sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
		sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
		sa.UniqueConstraint("email"),
	)
	op.create_index("ix_users_email", "users", ["email"], unique=True)
	op.create_table(
		"taxpayer_profiles",
		sa.Column("id", sa.Integer(), primary_key=True),
		sa.Column("owner_id", sa.Integer(), nullable=False),
		sa.Column("display_name", sa.String(length=120), nullable=False),
		sa.Column("entity_type", sa.String(length=20), nullable=False),
		sa.Column("relationship", sa.String(length=30), nullable=False),
		sa.Column("pan_last_four", sa.String(length=4), nullable=True),
		sa.Column("date_of_birth", sa.Date(), nullable=True),
		sa.Column("residency_status", sa.String(length=20), nullable=False),
		sa.Column("is_primary", sa.Boolean(), nullable=False),
		sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
		sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
		sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
	)
	op.create_index(
		"ix_taxpayer_profiles_owner_id", "taxpayer_profiles", ["owner_id"]
	)
	op.create_table(
		"filing_workspaces",
		sa.Column("id", sa.Integer(), primary_key=True),
		sa.Column("profile_id", sa.Integer(), nullable=False),
		sa.Column("assessment_year_start", sa.Integer(), nullable=False),
		sa.Column("itr_form", sa.String(length=10), nullable=True),
		sa.Column("status", sa.String(length=30), nullable=False),
		sa.Column("completion_percent", sa.Integer(), nullable=False),
		sa.Column("current_section", sa.String(length=80), nullable=False),
		sa.Column("revision", sa.Integer(), nullable=False),
		sa.Column("progress_data", sa.JSON(), nullable=False),
		sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
		sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
		sa.ForeignKeyConstraint(["profile_id"], ["taxpayer_profiles.id"], ondelete="CASCADE"),
		sa.UniqueConstraint(
			"profile_id",
			"assessment_year_start",
			name="uq_profile_assessment_year",
		),
	)
	op.create_index(
		"ix_filing_workspaces_profile_id", "filing_workspaces", ["profile_id"]
	)
	op.create_table(
		"filing_documents",
		sa.Column("id", sa.Integer(), primary_key=True),
		sa.Column("workspace_id", sa.Integer(), nullable=False),
		sa.Column("category", sa.String(length=40), nullable=False),
		sa.Column("original_name", sa.String(length=255), nullable=False),
		sa.Column("content_type", sa.String(length=100), nullable=False),
		sa.Column("size_bytes", sa.Integer(), nullable=False),
		sa.Column("sha256", sa.String(length=64), nullable=False),
		sa.Column("encrypted_content", sa.LargeBinary(), nullable=False),
		sa.Column("uploaded_at", sa.DateTime(timezone=True), nullable=False),
		sa.ForeignKeyConstraint(
			["workspace_id"], ["filing_workspaces.id"], ondelete="CASCADE"
		),
	)
	op.create_index(
		"ix_filing_documents_workspace_id", "filing_documents", ["workspace_id"]
	)


def downgrade() -> None:
	op.drop_index("ix_filing_documents_workspace_id", table_name="filing_documents")
	op.drop_table("filing_documents")
	op.drop_index("ix_filing_workspaces_profile_id", table_name="filing_workspaces")
	op.drop_table("filing_workspaces")
	op.drop_index("ix_taxpayer_profiles_owner_id", table_name="taxpayer_profiles")
	op.drop_table("taxpayer_profiles")
	op.drop_index("ix_users_email", table_name="users")
	op.drop_table("users")
