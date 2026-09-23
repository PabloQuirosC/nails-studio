"""Casos de uso de Gift Cards (código único generado en servidor, canje idempotente)."""
import logging
import secrets
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import Conflict, NotFound
from app.infrastructure.models.giftcard import GiftCard, GiftCardAudit
from app.infrastructure.models.rbac import User

logger = logging.getLogger(__name__)
_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def _audit(db: Session, gc: GiftCard, actor: User | None, field: str,
           old: object | None, new: object | None) -> None:
    """Best-effort: la auditoría nunca rompe la operación principal."""
    try:
        db.add(GiftCardAudit(
            code=gc.code,
            actor_user_id=actor.id if actor else None,
            actor_username=actor.username if actor else None,
            field=field,
            old_value=None if old is None else str(old),
            new_value=None if new is None else str(new),
        ))
        db.flush()
    except Exception as exc:
        logger.warning("No se pudo auditar %s.%s: %s", gc.code, field, exc)


def _gen_code(db: Session) -> str:
    for _ in range(20):
        code = "NS-GC-" + "".join(secrets.choice(_ALPHABET) for _ in range(4))
        if db.scalar(select(GiftCard).where(GiftCard.code == code)) is None:
            return code
    raise Conflict("No se pudo generar un código único, reintenta")


def create_gift_card(db: Session, *, amount: int, buyer: str, recipient: str | None,
                     source: str = "manual", client_id: int | None = None) -> GiftCard:
    if amount <= 0:
        raise Conflict("El monto debe ser mayor a 0")
    if not buyer.strip():
        raise Conflict("El comprador es obligatorio")
    if source not in ("manual", "loyalty"):
        raise Conflict("Origen inválido (manual|loyalty)")
    gc = GiftCard(code=_gen_code(db), amount=amount, buyer=buyer.strip(),
                  recipient=recipient.strip() if recipient and recipient.strip() else None,
                  source=source, client_id=client_id)
    db.add(gc)
    db.commit()
    db.refresh(gc)
    logger.info("Gift card creada: %s (₡%s, comprador=%s, origen=%s)", gc.code, gc.amount, gc.buyer, source)
    return gc


def list_gift_cards(db: Session, *, offset: int = 0, limit: int = 50, q: str = "",
                    used: bool | None = None, source: str | None = None) -> tuple[list[GiftCard], int]:
    filters = []
    if q.strip():
        like = f"%{q.strip().lower()}%"
        filters.append(func.lower(GiftCard.code).like(like) | func.lower(GiftCard.buyer).like(like))
    if used is not None:
        filters.append(GiftCard.used.is_(used))
    if source:
        filters.append(GiftCard.source == source)
    base = select(GiftCard)
    if filters:
        base = base.where(*filters)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    items = list(db.scalars(base.order_by(GiftCard.id.desc()).offset(offset).limit(min(limit, 100))).all())
    return items, total


def set_used(db: Session, code: str, used: bool, actor: User | None = None) -> GiftCard:
    gc = db.scalar(select(GiftCard).where(GiftCard.code == code))
    if gc is None:
        raise NotFound("Gift card no encontrada")
    if gc.used != used:
        _audit(db, gc, actor, "used", gc.used, used)
    gc.used = used
    gc.used_at = datetime.now(timezone.utc) if used else None
    db.commit()
    db.refresh(gc)
    logger.info("Gift card %s: %s", gc.code, "canjeada" if used else "reactivada")
    return gc


def update_gift_card(db: Session, code: str, actor: User | None = None, **fields) -> GiftCard:
    """Edición de monto/comprador/destinataria. El código nunca cambia."""
    gc = db.scalar(select(GiftCard).where(GiftCard.code == code))
    if gc is None:
        raise NotFound("Gift card no encontrada")
    if fields.get("amount") is not None and fields["amount"] <= 0:
        raise Conflict("El monto debe ser mayor a 0")
    for key in ("amount", "buyer", "recipient"):
        value = fields.get(key)
        if value is not None:
            clean = value.strip() if isinstance(value, str) and value.strip() else value
            if getattr(gc, key) != clean:
                _audit(db, gc, actor, key, getattr(gc, key), clean)
                setattr(gc, key, clean)
    db.commit()
    db.refresh(gc)
    logger.info("Gift card actualizada: %s (₡%s, comprador=%s)", gc.code, gc.amount, gc.buyer)
    return gc


def history(db: Session, code: str) -> list[GiftCardAudit]:
    if db.scalar(select(GiftCard.id).where(GiftCard.code == code)) is None:
        raise NotFound("Gift card no encontrada")
    return list(db.scalars(
        select(GiftCardAudit).where(GiftCardAudit.code == code).order_by(GiftCardAudit.id.desc())
    ).all())


def delete_gift_card(db: Session, code: str) -> None:
    gc = db.scalar(select(GiftCard).where(GiftCard.code == code))
    if gc is None:
        raise NotFound("Gift card no encontrada")
    logger.info("Gift card eliminada: %s (₡%s)", gc.code, gc.amount)
    db.delete(gc)
    db.commit()
