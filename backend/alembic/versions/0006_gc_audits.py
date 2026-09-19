"""Auditoría de gift cards (historial quién/cuándo de cambios de valor).

Revision ID: 0006_gc_audits
Revises: 0005_posts
"""
from alembic import op
import sqlalchemy as sa

revision = "0006_gc_audits"
down_revision = "0005_posts"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "gift_card_audits",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("code", sa.String(16), nullable=False),
        sa.Column("actor_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("actor_username", sa.String(100), nullable=True),
        sa.Column("field", sa.String(20), nullable=False),
        sa.Column("old_value", sa.String(200), nullable=True),
        sa.Column("new_value", sa.String(200), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_gift_card_audits_code", "gift_card_audits", ["code"])
    op.create_index("ix_gift_card_audits_created_at", "gift_card_audits", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_gift_card_audits_created_at", table_name="gift_card_audits")
    op.drop_index("ix_gift_card_audits_code", table_name="gift_card_audits")
    op.drop_table("gift_card_audits")
