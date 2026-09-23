"""Contenido del estudio: artículos del blog y testimonios (kind los distingue)."""
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.db.base import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Post(Base):
    __tablename__ = "posts"
    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    kind: Mapped[str] = mapped_column(String(20), default="articulo", index=True)
    title: Mapped[str] = mapped_column(String(200))
    excerpt: Mapped[str | None] = mapped_column(Text)
    body: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(60), default="General", index=True)
    image_url: Mapped[str | None] = mapped_column(String(500))
    read_minutes: Mapped[int] = mapped_column(Integer, default=4)
    author: Mapped[str | None] = mapped_column(String(200))
    rating: Mapped[int | None] = mapped_column(Integer)
    design_name: Mapped[str | None] = mapped_column(String(150))
    published: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class PostCategory(Base):
    """Categorías administrables del blog (se asocian por nombre en Post.category)."""
    __tablename__ = "post_categories"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
