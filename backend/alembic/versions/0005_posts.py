"""Tabla posts (blog + testimonios).

Revision ID: 0005_posts
Revises: 0004_crc_prices
"""
from alembic import op
import sqlalchemy as sa

revision = "0005_posts"
down_revision = "0004_crc_prices"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "posts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("slug", sa.String(120), nullable=False),
        sa.Column("kind", sa.String(20), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("excerpt", sa.Text(), nullable=True),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("category", sa.String(60), nullable=False),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("read_minutes", sa.Integer(), nullable=False),
        sa.Column("author", sa.String(200), nullable=True),
        sa.Column("rating", sa.Integer(), nullable=True),
        sa.Column("design_name", sa.String(150), nullable=True),
        sa.Column("published", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_posts_slug", "posts", ["slug"], unique=True)
    op.create_index("ix_posts_kind", "posts", ["kind"])
    op.create_index("ix_posts_category", "posts", ["category"])


def downgrade() -> None:
    op.drop_index("ix_posts_category", table_name="posts")
    op.drop_index("ix_posts_kind", table_name="posts")
    op.drop_index("ix_posts_slug", table_name="posts")
    op.drop_table("posts")
