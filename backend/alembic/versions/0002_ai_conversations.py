"""Create AI conversation and message tables.

Revision ID: 0002_ai_conversations
Revises: 0001_taxpayer_workspace
Create Date: 2026-08-17
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0002_ai_conversations"
down_revision: str | None = "0001_taxpayer_workspace"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
	op.create_table(
		"ai_conversations",
		sa.Column("id", sa.Integer(), primary_key=True),
		sa.Column("user_id", sa.Integer(), nullable=False),
		sa.Column("title", sa.String(length=200), nullable=False),
		sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
		sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
		sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
	)
	op.create_index(
		"ix_ai_conversations_user_id", "ai_conversations", ["user_id"]
	)
	op.create_table(
		"ai_messages",
		sa.Column("id", sa.Integer(), primary_key=True),
		sa.Column("conversation_id", sa.Integer(), nullable=False),
		sa.Column("role", sa.String(length=20), nullable=False),
		sa.Column("content", sa.String(), nullable=False),
		sa.Column("sources", sa.JSON(), nullable=True),
		sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
		sa.ForeignKeyConstraint(
			["conversation_id"], ["ai_conversations.id"], ondelete="CASCADE"
		),
	)
	op.create_index(
		"ix_ai_messages_conversation_id", "ai_messages", ["conversation_id"]
	)


def downgrade() -> None:
	op.drop_index("ix_ai_messages_conversation_id", table_name="ai_messages")
	op.drop_table("ai_messages")
	op.drop_index("ix_ai_conversations_user_id", table_name="ai_conversations")
	op.drop_table("ai_conversations")
