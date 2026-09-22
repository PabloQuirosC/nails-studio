"""Contenido administrable del programa de referidos (referral_info singleton).

Revision ID: 0010_referral_info
Revises: 0009_post_categories
"""
from alembic import op
import sqlalchemy as sa

revision = "0010_referral_info"
down_revision = "0009_post_categories"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "referral_info",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(120), nullable=False),
        sa.Column("subtitle", sa.String(300), nullable=False),
        sa.Column("steps", sa.JSON(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("referral_info")
