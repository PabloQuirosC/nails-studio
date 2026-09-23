"""Casos de uso de Clientas."""
import logging

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import Conflict, NotFound
from app.infrastructure.models.clients import Client

logger = logging.getLogger(__name__)


def _get_or_404(db: Session, client_id: int) -> Client:
    client = db.get(Client, client_id)
    if client is None:
        raise NotFound("Clienta no encontrada")
    return client


def lookup_by_phone(db: Session, phone: str) -> Client | None:
    """Búsqueda exacta por teléfono para la consulta pública de lealtad."""
    clean = (phone or "").strip()
    if not clean:
        return None
    return db.scalar(select(Client).where(Client.phone == clean))


def create_client(db: Session, **fields) -> Client:
    fields["phone"] = fields["phone"].strip()
    if fields.get("email"):
        fields["email"] = fields["email"].strip().lower()
    client = Client(**fields)
    db.add(client)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        logger.warning("Creación de clienta rechazada, teléfono duplicado: %s", fields["phone"])
        raise Conflict("Teléfono ya registrado") from exc
    db.refresh(client)
    logger.info("Clienta creada: %s (id=%s)", client.name, client.id)
    return client


def list_clients(db: Session, *, offset: int = 0, limit: int = 50, q: str = "") -> tuple[list[Client], int]:
    filters = []
    if q.strip():
        like = f"%{q.strip().lower()}%"
        filters.append(func.lower(Client.name).like(like) | Client.phone.like(f"%{q.strip()}%"))
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
    logger.info("Clienta actualizada: %s (id=%s)", client.name, client.id)
    return client


def adjust_points(db: Session, client_id: int, delta: int, reason: str = "") -> Client:
    """Ajuste manual de puntos (el automático vive en loyalty_service)."""
    client = _get_or_404(db, client_id)
    client.points = max(0, client.points + delta)
    db.commit()
    db.refresh(client)
    logger.info("Puntos ajustados: %s %+d (motivo=%s, total=%s)", client.name, delta, reason or "-", client.points)
    return client


def delete_client(db: Session, client_id: int) -> None:
    from app.infrastructure.models.agenda import Appointment

    client = _get_or_404(db, client_id)
    n = db.scalar(
        select(func.count()).select_from(Appointment).where(Appointment.client_id == client_id)
    ) or 0
    if n > 0:
        logger.warning("Eliminación de clienta bloqueada: %s tiene %s citas", client.name, n)
        raise Conflict(f"No se puede eliminar: tiene {n} citas registradas")
    logger.info("Clienta eliminada: %s (id=%s)", client.name, client.id)
    db.delete(client)
    db.commit()
