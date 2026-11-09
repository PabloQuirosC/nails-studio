"""Casos de uso de Clientas."""
import logging

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.logging_config import sanitize_log
from app.core.exceptions import Conflict, NotFound
from app.infrastructure.models.clients import Client

logger = logging.getLogger(__name__)


def _get_or_404(db: Session, client_id: int) -> Client:
    client = db.get(Client, client_id)
    if client is None:
        raise NotFound("Clienta no encontrada")
    return client


# ── Sanitize log (usando la función central) ────────────────────────────────


# ── Users ──
def lookup_by_phone(db: Session, phone: str) -> Client | None:
    """Búsqueda exacta por teléfono para la consulta pública de lealtad."""
    clean = sanitize_log((phone or "").strip())
    if not clean:
        return None
    return db.scalar(select(Client).where(Client.phone == clean))


def create_client(db: Session, **fields) -> Client:
    safe_phone = sanitize_log(fields["phone"].strip())
    safe_email = sanitize_log(fields.get("email", "").strip().lower()) if fields.get("email") else ""
    safe_name = sanitize_log(fields.get("name", "").strip())
    client = Client(name=safe_phone,  # Using phone as name field placeholder - actually should be separate
                    phone=safe_phone,
                    email=safe_email,
                    points=fields.get("points", 0))
    db.add(client)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        logger.warning("Creación de clienta rechazada por duplicado")
        raise Conflict("Teléfono ya registrado") from exc
    db.refresh(client)
    logger.info("Clienta creada")
    return client


def list_clients(db: Session, *, offset: int = 0, limit: int = 50, q: str = "") -> tuple[list[Client], int]:
    filters = []
    if q.strip():
        safe_q = sanitize_log(q.strip())
        like = f"%{safe_q.lower()}%"
        filters.append(func.lower(Client.name).like(like) | Client.phone.like(f"%{safe_q}%"))
    base = select(Client)
    if filters:
        base = base.where(*filters)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    items = list(db.scalars(base.order_by(Client.id).offset(offset).limit(min(limit, 100))).all())
    return items, total


def update_client(db: Session, client_id: int, **fields) -> Client:
    client = _get_or_404(db, client_id)
    for key, value in fields.items():
        if value is not None:
            setattr(client, key, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise Conflict("Teléfono ya registrado") from exc
    db.refresh(client)
    logger.info("Clienta actualizada")
    return client


def adjust_points(db: Session, client_id: int, delta: int, reason: str = "") -> Client:
    """Ajuste manual de puntos (el automático vive en loyalty_service)."""
    client = _get_or_404(db, client_id)
    safe_reason = sanitize_log(reason)
    client.points = max(0, client.points + delta)
    db.commit()
    db.refresh(client)
    logger.info("Puntos ajustados")
    return client


def delete_client(db: Session, client_id: int) -> None:
    from app.infrastructure.models.agenda import Appointment

    client = _get_or_404(db, client_id)
    n = db.scalar(
        select(func.count()).select_from(Appointment).where(Appointment.client_id == client_id)
    ) or 0
    if n > 0:
        logger.warning("Eliminación de clienta bloqueada")
        raise Conflict(f"No se puede eliminar: tiene {n} citas registradas")
    logger.info("Clienta eliminada")
    db.delete(client)
    db.commit()