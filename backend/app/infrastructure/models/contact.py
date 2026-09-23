"""Contacto: buzón de mensajes públicos + datos editables del estudio (singleton)."""
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.db.base import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ContactMessage(Base):
    __tablename__ = "contact_messages"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    email: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(40))
    message: Mapped[str] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class ContactInfo(Base):
    """Una sola fila (id=1): datos que muestra la página Contacto."""
    __tablename__ = "contact_info"
    id: Mapped[int] = mapped_column(primary_key=True)
    address: Mapped[str] = mapped_column(String(300), default="Av. Artística 2410, Local 3\nCol. Centro, Ciudad")
    schedule: Mapped[str] = mapped_column(String(300), default="Lunes–Sábado: 10:00–19:00\nDomingo: 11:00–16:00")
    whatsapp: Mapped[str] = mapped_column(String(40), default="+52 55 1234 5678")
    instagram: Mapped[str] = mapped_column(String(100), default="@nailsstudio.mx")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)


class ContactSocial(Base):
    """Redes sociales agregables (Facebook, TikTok…). `icon` es clave libre (facebook, tiktok…)."""
    __tablename__ = "contact_socials"
    id: Mapped[int] = mapped_column(primary_key=True)
    label: Mapped[str] = mapped_column(String(60))
    url: Mapped[str] = mapped_column(String(500))
    icon: Mapped[str] = mapped_column(String(30), default="web")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
