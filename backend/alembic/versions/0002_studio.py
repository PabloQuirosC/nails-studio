"""Studio: catalogo, agenda, clientas + gift_cards lealtad.

Revision ID: 0002_studio
Revises: 0001_init
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY

revision = "0002_studio"
down_revision = "0001_init"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("slug", sa.String(60), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("icon", sa.String(16), nullable=False),
        sa.Column("color", sa.String(16), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False),
    )
    op.create_index("ix_categories_slug", "categories", ["slug"], unique=True)

    op.create_table(
        "designs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("category_id", sa.Integer(), sa.ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("duration_min", sa.Integer(), nullable=False),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("technique", sa.String(300), nullable=True),
        sa.Column("tags", ARRAY(sa.String(60)), nullable=False),
        sa.Column("occasion", sa.String(60), nullable=True),
        sa.Column("complexity", sa.String(60), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_designs_category_id", "designs", ["category_id"])
    op.create_index("ix_designs_name", "designs", ["name"])

    op.create_table(
        "clients",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("phone", sa.String(40), nullable=False),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("birthdate", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("points", sa.Integer(), nullable=False),
        sa.Column("visits", sa.Integer(), nullable=False),
        sa.Column("last_visit", sa.DateTime(timezone=True), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_clients_name", "clients", ["name"])
    op.create_index("ix_clients_phone", "clients", ["phone"], unique=True)

    op.create_table(
        "appointments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("client_id", sa.Integer(), sa.ForeignKey("clients.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("design_id", sa.Integer(), sa.ForeignKey("designs.id", ondelete="SET NULL"), nullable=True),
        sa.Column("artist_name", sa.String(200), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_appointments_client_id", "appointments", ["client_id"])
    op.create_index("ix_appointments_starts_at", "appointments", ["starts_at"])
    op.create_index("ix_appointments_ends_at", "appointments", ["ends_at"])
    op.create_index("ix_appointments_status", "appointments", ["status"])
    # Anti-solape a nivel de lectura rápida (la regla dura vive en el servicio).
    op.create_index("ix_appointments_range", "appointments", ["starts_at", "ends_at"])

    op.add_column("gift_cards", sa.Column("source", sa.String(20), nullable=False, server_default="manual"))
    op.add_column("gift_cards", sa.Column("client_id", sa.Integer(), sa.ForeignKey("clients.id", ondelete="SET NULL"), nullable=True))
    op.create_index("ix_gift_cards_source", "gift_cards", ["source"])


def downgrade() -> None:
    op.drop_index("ix_gift_cards_source", table_name="gift_cards")
    op.drop_column("gift_cards", "client_id")
    op.drop_column("gift_cards", "source")
    op.drop_index("ix_appointments_range", table_name="appointments")
    op.drop_index("ix_appointments_status", table_name="appointments")
    op.drop_index("ix_appointments_ends_at", table_name="appointments")
    op.drop_index("ix_appointments_starts_at", table_name="appointments")
    op.drop_index("ix_appointments_client_id", table_name="appointments")
    op.drop_table("appointments")
    op.drop_index("ix_clients_phone", table_name="clients")
    op.drop_index("ix_clients_name", table_name="clients")
    op.drop_table("clients")
    op.drop_index("ix_designs_name", table_name="designs")
    op.drop_index("ix_designs_category_id", table_name="designs")
    op.drop_table("designs")
    op.drop_index("ix_categories_slug", table_name="categories")
    op.drop_table("categories")
