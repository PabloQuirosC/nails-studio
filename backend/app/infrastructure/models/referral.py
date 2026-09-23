"""Programa de referidos editable (singleton id=1): lo que ve la página pública."""
from datetime import datetime, timezone

from sqlalchemy import DateTime, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.db.base import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ReferralInfo(Base):
    __tablename__ = "referral_info"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(120), default="Programa de referidos")
    subtitle: Mapped[str] = mapped_column(
        String(300),
        default="Invita a tus amigas y acumula recompensas de lealtad.",
    )
    steps: Mapped[list] = mapped_column(
        JSON,
        default=lambda: [
            "Comparte el estudio con tus amigas e invítalas a agendar",
            "Cada 10 visitas acumulas una gift card de lealtad",
            "Consulta aquí tu saldo con el teléfono de tu registro",
        ],
    )
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)
