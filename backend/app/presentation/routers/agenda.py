"""Agenda: staff autenticado + reserva pública (throttle, siempre pending)."""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.application import agenda_service
from app.core import rate_limit
from app.core.email import get_admin_emails, notify_appointment_booked
from app.core.exceptions import Conflict, NotFound
from app.infrastructure.db.session import get_db
from app.presentation import schemas_studio as s
from app.presentation.deps import require_permission

router = APIRouter(prefix="/appointments", tags=["agenda"])


def _map(exc: Exception) -> HTTPException:
    if isinstance(exc, NotFound):
        return HTTPException(404, str(exc))
    if isinstance(exc, Conflict):
        return HTTPException(409, str(exc))
    if isinstance(exc, ValueError):
        return HTTPException(400, str(exc))
    raise exc  # type: ignore[misc]


@router.get("", response_model=s.AppointmentPage,
            dependencies=[Depends(require_permission("reservas.read"))])
def list_all(offset: int = 0, limit: int = 50, day: str = "", status: str = "",
             client_id: int | None = None, db: Session = Depends(get_db)):
    items, total = agenda_service.list_appointments(
        db, offset=offset, limit=limit, day=day, status=status, client_id=client_id)
    return {"items": items, "total": total}


@router.post("/public", response_model=s.AppointmentOut, status_code=201)
def create_public(body: s.PublicBookingCreate, request: Request,
                  background: BackgroundTasks, db: Session = Depends(get_db)):
    """Reserva desde la web (sin auth): crea clienta si no existe, cita en pending."""
    ip = rate_limit.client_ip(request)
    if not rate_limit.check("booking", ip):
        raise HTTPException(status_code=429, detail="Demasiados intentos, espera un minuto")
    rate_limit.hit("booking", ip)
    try:
        appt = agenda_service.create_public_booking(db, **body.model_dump())
    except Exception as exc:
        raise _map(exc) from exc
    design_name = None
    if appt.design_id is not None:
        try:
            from app.infrastructure.models.catalog import Design
            d = db.get(Design, appt.design_id)
            design_name = d.name if d else None
        except Exception:
            design_name = None
    admins = get_admin_emails(db)
    background.add_task(
        notify_appointment_booked, client_email=(body.email or "").strip() or None,
        name=body.name.strip(), phone=body.phone.strip(), design=design_name,
        starts_at=appt.starts_at.isoformat(timespec="minutes"),
        ends_at=appt.ends_at.isoformat(timespec="minutes"),
        notes=appt.notes, appt_id=appt.id, status=appt.status,
        admin_emails=admins,
    )
    return appt


@router.post("", response_model=s.AppointmentOut, status_code=201,
             dependencies=[Depends(require_permission("reservas.create"))])
def create(body: s.AppointmentCreate, background: BackgroundTasks, db: Session = Depends(get_db)):
    try:
        appt = agenda_service.create_appointment(db, **body.model_dump())
    except Exception as exc:
        raise _map(exc) from exc
    try:
        from app.infrastructure.models.catalog import Design
        from app.infrastructure.models.clients import Client
        client = db.get(Client, appt.client_id)
        design = db.get(Design, appt.design_id) if appt.design_id else None
        admins = get_admin_emails(db)
        background.add_task(
            notify_appointment_booked, client_email=(client.email if client and client.email else None),
            name=client.name if client else f"clienta #{appt.client_id}", phone=client.phone if client else "—",
            design=design.name if design else None,
            starts_at=appt.starts_at.isoformat(timespec="minutes"),
            ends_at=appt.ends_at.isoformat(timespec="minutes"),
            notes=appt.notes, appt_id=appt.id, status=appt.status,
            admin_emails=admins,
        )
    except Exception:
        pass
    return appt


@router.patch("/{appointment_id}/status", response_model=s.AppointmentOut,
              dependencies=[Depends(require_permission("reservas.update"))])
def set_status(appointment_id: int, body: s.AppointmentStatus, db: Session = Depends(get_db)):
    try:
        return agenda_service.set_status(db, appointment_id, body.status)
    except Exception as exc:
        raise _map(exc) from exc


@router.put("/{appointment_id}/reschedule", response_model=s.AppointmentOut,
            dependencies=[Depends(require_permission("reservas.update"))])
def reschedule(appointment_id: int, body: s.AppointmentReschedule, db: Session = Depends(get_db)):
    try:
        return agenda_service.reschedule(db, appointment_id, body.starts_at, body.ends_at)
    except Exception as exc:
        raise _map(exc) from exc


@router.delete("/{appointment_id}", response_model=dict,
               dependencies=[Depends(require_permission("reservas.delete"))])
def delete(appointment_id: int, db: Session = Depends(get_db)):
    try:
        agenda_service.delete_appointment(db, appointment_id)
    except Exception as exc:
        raise _map(exc) from exc
    return {"detail": "Cita eliminada"}
