"""Buzón de contacto + datos editables (singleton contact_info).

Revision ID: 0007_contact
Revises: 0006_gc_audits
"""
from alembic import op
import sqlalchemy as sa

revision = "0007_contact"
down_revision = "0006_gc_audits"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "contact_messages",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(40), nullable=True),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "contact_info",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("address", sa.String(300), nullable=False),
        sa.Column("schedule", sa.String(300), nullable=False),
        sa.Column("whatsapp", sa.String(40), nullable=False),
        sa.Column("instagram", sa.String(100), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    # Fila singleton con los datos actuales del frontend.
    op.execute(
        "INSERT INTO contact_info (id, address, schedule, whatsapp, instagram, updated_at) "
        "VALUES (1, 'Av. Artística 2410, Local 3\nCol. Centro, Ciudad', "
        "'Lunes–Sábado: 10:00–19:00\nDomingo: 11:00–16:00', "
        "'+52 55 1234 5678', '@nailsstudio.mx', NOW()) "
        "ON CONFLICT (id) DO NOTHING"
    )


def downgrade() -> None:
    op.drop_table("contact_info")
    op.drop_table("contact_messages")
