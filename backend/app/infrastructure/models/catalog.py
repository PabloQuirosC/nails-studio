"""Catálogo del estudio: categorías 1—N diseños (imágenes por URL externa, v1)."""
from datetime import datetime, timezone

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db.base import Base

# Fuente única del set cerrado (misma lista que CATEGORY_ICONS en el frontend).
CATEGORY_ICON_KEYS: tuple[str, ...] = (
    "gem", "sparkles", "flower", "footprints", "layers", "leaf",
    "wand", "brush", "palette", "heart", "star", "crown",
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Category(Base):
    __tablename__ = "categories"
    __table_args__ = (
        CheckConstraint(
            "icon IN ('gem','sparkles','flower','footprints','layers','leaf',"
            "'wand','brush','palette','heart','star','crown')",
            name="ck_categories_icon",
        ),
    )
    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    icon: Mapped[str] = mapped_column(String(16), default="sparkles")
    color: Mapped[str] = mapped_column(String(16), default="#c9a96e")
    description: Mapped[str | None] = mapped_column(Text)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    designs: Mapped[list["Design"]] = relationship(back_populates="category")


class Design(Base):
    __tablename__ = "designs"
    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id", ondelete="RESTRICT"), index=True)
    name: Mapped[str] = mapped_column(String(150), index=True)
    price: Mapped[int] = mapped_column(Integer)
    duration_min: Mapped[int] = mapped_column(Integer, default=60)
    image_url: Mapped[str | None] = mapped_column(String(500))
    description: Mapped[str | None] = mapped_column(Text)
    technique: Mapped[str | None] = mapped_column(String(300))
    tags: Mapped[list[str]] = mapped_column(ARRAY(String(60)), default=list)
    occasion: Mapped[str | None] = mapped_column(String(60))
    complexity: Mapped[str | None] = mapped_column(String(60))
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    # Visible en Home → "Diseños del mes". Se marca desde Admin → Catálogo (★).
    is_monthly: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    category: Mapped[Category] = relationship(back_populates="designs")
