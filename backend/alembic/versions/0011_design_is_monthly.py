"""Flag mensual en diseños (Admin → Catálogo ★, Home → Diseños del mes).

Revision ID: 0011_design_is_monthly
Revises: 0010_referral_info
"""
from alembic import op
import sqlalchemy as sa

revision = "0011_design_is_monthly"
down_revision = "0010_referral_info"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "designs",
        sa.Column("is_monthly", sa.Boolean(), nullable=False, server_default="false"),
    )


def downgrade() -> None:
    op.drop_column("designs", "is_monthly")
