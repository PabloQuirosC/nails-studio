"""Casos de uso de Agenda: anti-solape global (una sola artista)."""
import logging
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.logging_config import sanitize_log
from app.core.exceptions import Conflict, NotFound
from app.infrastructure.models.agenda import VALID_TRANSITIONS, Appointment
from app.infrastructure.models.clients import Client

logger = logging.getLogger(__name__)

LOYALTY_EVERY = 10  # solo referencia para el panel de progreso (sin emisión automática)


def _get_or_404(db: Session, model, obj_id: int, label: str):
    obj = db.get(model, obj_id)
    if obj is None:
        raise NotFound(f"{label} no encontrado")
    return obj


def _assert_not_past(starts_at: datetime) -> None:
    """La web envía ISO local sin offset: se compara en hora local del servidor."""
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc) if starts_at.tzinfo is not None else datetime.now()
    if starts_at <= now:
        raise ValueError("No se pueden agendar citas en fechas u horas pasadas")


def _assert_no_overlap(db: Session, starts_at: datetime, ends_at: datetime, exclude_id: int | None = None) -> None:
    if ends_at <= starts_at:
        raise Conflict("La hora de fin debe ser posterior al inicio")
    stmt = select(Appointment.id).where(
        Appointment.status.notin_(["cancelled"]),
        Appointment.starts_at < ends_at,
        Appointment.ends_at > starts_at,
    )
    if exclude_id is not None:
        stmt = stmt.where(Appointment.id != exclude_id)
    clash = db.scalar(stmt)
    if clash is not None:
        safe_starts = sanitize_log(starts_at.isoformat())
        safe_ends = sanitize_log(ends_at.isoformat())
        safe_clash = sanitize_log(str(clash))
        logger.warning("Reserva bloqueada por solape: %s–%s choca con cita id=%s", safe_starts, safe_ends, safe_clash)
        raise Conflict("Horario ocupado: ya existe una cita en esa fecha y hora")


def create_appointment(db: Session, **fields) -> Appointment:
    _get_or_404(db, Client, fields["client_id"], "Clienta")
    if fields.get("design_id") is not None:
        from app.infrastructure.models.catalog import Design
        _get_or_404(db, Design, fields["design_id"], "Diseño")
    _assert_not_past(fields["starts_at"])
    _assert_no_overlap(db, fields["starts_at"], fields["ends_at"])
    safe_client_name = sanitize_log(fields.get("client_name", ""))
    appt = Appointment(status="pending", client_id=fields["client_id"], design_id=fields.get("design_id"),
                       starts_at=fields["starts_at"], ends_at=fields["ends_at"],
                       notes=sanitize_log(fields.get("notes", "")))
    db.add(appt)
    db.commit()
    db.refresh(appt)
    logger.info("Cita creada: id=%s clienta=%s %s–%s", appt.id, safe_client_name,
                appt.starts_at, appt.ends_at)
    return appt


def create_public_booking(db: Session, *, name: str, phone: str, email: str | None,
                          design_id: int | None, starts_at: datetime,
                          ends_at: datetime, notes: str | None) -> Appointment:
    """Reserva desde la web pública: busca clienta por teléfono o la crea, luego cita pending.

    Reutiliza la validación de solape global. El estado inicial siempre es pending
    (el staff confirma desde el panel).
    """
    from datetime import datetime, timezone
    clean_phone = phone.strip()
    client = db.scalar(select(Client).where(Client.phone == clean_phone))
    if client is None:
        safe_name = sanitize_log(name.strip())
        client = Client(name=safe_name, phone=clean_phone,
                        email=(email or "").strip() or None)
        db.add(client)
        db.flush()
        logger.info("Clienta creada desde reserva pública: %s (%s)", safe_name, clean_phone)
    if design_id is not None:
        from app.infrastructure.models.catalog import Design
        _get_or_404(db, Design, design_id, "Diseño")
    _assert_not_past(starts_at)
    _assert_no_overlap(db, starts_at, ends_at)
    safe_notes = sanitize_log(notes or "")
    appt = Appointment(client_id=client.id, design_id=design_id, starts_at=starts_at,
                       ends_at=ends_at, notes=safe_notes, status="pending")
    db.add(appt)
    db.commit()
    db.refresh(appt)
    logger.info("Reserva pública: id=%s clienta=%s %s–%s", appt.id, client.id, starts_at, ends_at)
    return appt


def list_appointments(db: Session, *, offset: int = 0, limit: int = 50, day: str = "",
                      status: str = "", client_id: int | None = None) -> tuple[list[Appointment], int]:
    filters = []
    if day.strip():
        safe_day = sanitize_log(day.strip())
        filters.append(func.date(Appointment.starts_at) == safe_day)
    if status.strip():
        safe_status = sanitize_log(status.strip().lower())
        filters.append(Appointment.status == safe_status)
    if client_id is not None:
        filters.append(Appointment.client_id == client_id)
    base = select(Appointment)
    if filters:
        base = base.where(*filters)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    items = list(db.scalars(base.order_by(Appointment.starts_at).offset(offset).limit(min(limit, 100))).all())
    return items, total


def set_status(db: Session, appointment_id: int, new_status: str) -> Appointment:
    appt = _get_or_404(db, Appointment, appointment_id, "Cita")
    new_status = new_status.lower()
    if new_status == appt.status:
        return appt
    safe_new_status = sanitize_log(new_status)
    if new_status not in VALID_TRANSITIONS.get(appt.status, set()):
        logger.warning("Transición inválida: cita id=%s %s->%s", appt.id, appt.status, safe_new_status)
        raise Conflict(f"No se puede pasar de {appt.status} a {new_status}")
    appt.status = new_status
    if new_status == "completed":
        client = _get_or_404(db, Client, appt.client_id, "Clienta")
        safe_client_name = sanitize_log(client.name)
        client.visits += 1
        client.last_visit = datetime.now(timezone.utc)
        logger.info("Cita completada: id=%s, clienta %s llega a %s visitas", appt.id, safe_client_name, client.visits)
    db.commit()
    db.refresh(appt)
    return appt


def reschedule(db: Session, appointment_id: int, starts_at: datetime, ends_at: datetime) -> Appointment:
    appt = _get_or_404(db, Appointment, appointment_id, "Cita")
    if appt.status in ("completed", "cancelled"):
        raise Conflict(f"No se puede mover una cita {appt.status}")
    safe_starts = sanitize_log(starts_at.isoformat())
    safe_ends = sanitize_log(ends_at.isoformat())
    _assert_no_overlap(db, starts_at, ends_at, exclude_id=appt.id)
    appt.starts_at, appt.ends_at = starts_at, ends_at
    db.commit()
    db.refresh(appt)
    logger.info("Cita reprogramada: id=%s %s–%s", appt.id, safe_starts, safe_ends)
    return appt


def delete_appointment(db: Session, appointment_id: int) -> None:
    appt = _get_or_404(db, Appointment, appointment_id, "Cita")
    logger.info("Cita eliminada: id=%s (%s)", appt.id, appt.status)
    db.delete(appt)
    db.commit()