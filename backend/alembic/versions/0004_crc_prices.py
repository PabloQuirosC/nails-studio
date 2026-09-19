"""Precios de diseños $ → ₡ (×500, tasa de referencia CR).

Revision ID: 0004_crc_prices
Revises: 0003_icon_check
"""
from alembic import op

revision = "0004_crc_prices"
down_revision = "0003_icon_check"
branch_labels = None
depends_on = None

RATE = 500


def upgrade() -> None:
    op.execute(f"UPDATE designs SET price = price * {RATE}")


def downgrade() -> None:
    op.execute(f"UPDATE designs SET price = price / {RATE}")
