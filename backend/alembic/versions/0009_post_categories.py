"""Categorías administrables del blog (post_categories).

Revision ID: 0009_post_categories
Revises: 0008_contact_socials
"""
from alembic import op
import sqlalchemy as sa

revision = "0009_post_categories"
down_revision = "0008_contact_socials"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "post_categories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(60), nullable=False),
        sa.Column("slug", sa.String(80), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_post_categories_name", "post_categories", ["name"], unique=True)
    op.create_index("ix_post_categories_slug", "post_categories", ["slug"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_post_categories_slug", table_name="post_categories")
    op.drop_index("ix_post_categories_name", table_name="post_categories")
    op.drop_table("post_categories")
