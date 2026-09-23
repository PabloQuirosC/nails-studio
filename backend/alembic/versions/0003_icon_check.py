"""CHECK cerrado para category.icon (blinda el set Lucide a nivel BD).

Revision ID: 0003_icon_check
Revises: 0002_studio
"""
from alembic import op

revision = "0003_icon_check"
down_revision = "0002_studio"
branch_labels = None
depends_on = None

CONSTRAINT = "ck_categories_icon"
EXPR = (
    "icon IN ('gem','sparkles','flower','footprints','layers','leaf',"
    "'wand','brush','palette','heart','star','crown')"
)


def upgrade() -> None:
    op.create_check_constraint(CONSTRAINT, "categories", EXPR)


def downgrade() -> None:
    op.drop_constraint(CONSTRAINT, "categories", type_="check")
