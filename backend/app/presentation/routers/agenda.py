"""Agenda: staff autenticado + reserva pública (throttle, siempre pending)."""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.application import agenda_service
from app.core import rate_limit
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
def create_public(body: s.PublicBookingCreate, request: Request, db: Session = Depends(get_db)):
    """Reserva desde la web (sin auth): crea clienta si no existe, cita en pending."""
    ip = request.client.host if request.client else "?"
    key = f"booking|{ip}"
    if not rate_limit.login_allowed(key):
        raise HTTPException(status_code=429, detail="Demasiados intentos, espera un minuto")
    rate_limit.login_hit(key)
    try:
        return agenda_service.create_public_booking(db, **body.model_dump())
    except Exception as exc:
        raise _map(exc) from exc


@router.post("", response_model=s.AppointmentOut, status_code=201,
             dependencies=[Depends(require_permission("reservas.create"))])
def create(body: s.AppointmentCreate, db: Session = Depends(get_db)):
    try:
        return agenda_service.create_appointment(db, **body.model_dump())
    except Exception as exc:
        raise _map(exc) from exc


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
