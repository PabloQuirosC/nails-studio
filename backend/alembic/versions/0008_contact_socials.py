"""Redes sociales agregables de contacto.

Revision ID: 0008_contact_socials
Revises: 0007_contact
"""
from alembic import op
import sqlalchemy as sa

revision = "0008_contact_socials"
down_revision = "0007_contact"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "contact_socials",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("label", sa.String(60), nullable=False),
        sa.Column("url", sa.String(500), nullable=False),
        sa.Column("icon", sa.String(30), nullable=False, server_default="web"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("contact_socials")
