"""Feed global de actividad: une auditorías de auth y gift cards (quién/cuándo/qué)."""
import logging
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.infrastructure.models.giftcard import GiftCardAudit
from app.infrastructure.models.rbac import LoginAudit

logger = logging.getLogger(__name__)

FIELD_LABEL = {"amount": "Monto", "buyer": "Comprador", "recipient": "Destinataria", "used": "Estado"}


def _fmt_money(value: str | None) -> str:
    try:
        return f"₡{int(value or 0):,}".replace(",", ".")
    except (TypeError, ValueError):
        return value or "—"


def _fmt_field(field: str, old: str | None, new: str | None) -> str:
    if field == "amount":
        return f"{_fmt_money(old)} → {_fmt_money(new)}"
    if field == "used":
        return "canjeada" if (new or "").lower() == "true" else "reactivada"
    return f"{old or '—'} → {new or '—'}"


def recent(db: Session, limit: int = 20) -> list[dict]:
    """Últimos eventos de login y gift cards, ordenados desc. Solo lectura."""
    limit = max(1, min(limit, 100))
    logins = db.scalars(select(LoginAudit).order_by(LoginAudit.id.desc()).limit(limit)).all()
    gifts = db.scalars(select(GiftCardAudit).order_by(GiftCardAudit.id.desc()).limit(limit)).all()

    items: list[dict] = []
    for row in logins:
        ok = bool(row.success)
        items.append({
            "kind": "login_ok" if ok else "login_fail",
            "text": f"Sesión iniciada: {row.username}" if ok else f"Login fallido: {row.username}",
            "actor": row.username,
            "created_at": row.created_at,
        })
    for row in gifts:
        label = FIELD_LABEL.get(row.field, row.field)
        items.append({
            "kind": "giftcard",
            "text": f"{row.code} · {label}: {_fmt_field(row.field, row.old_value, row.new_value)}",
            "actor": row.actor_username or "sistema",
            "created_at": row.created_at,
        })
    items.sort(key=lambda e: e["created_at"] or datetime.min, reverse=True)
    return items[:limit]
