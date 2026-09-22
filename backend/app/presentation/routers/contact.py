"""Contacto: info pública + buzón (envío público con throttle, gestión staff)."""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.application import contact_service
from app.core import rate_limit
from app.core.exceptions import NotFound
from app.infrastructure.db.session import get_db
from app.presentation import schemas_contact
from app.presentation.deps import require_permission

router = APIRouter(prefix="/contact", tags=["contacto"])


@router.get("/info", response_model=schemas_contact.ContactInfoOut)
def get_info(db: Session = Depends(get_db)):
    return contact_service.get_info(db)


@router.post("/messages", response_model=dict, status_code=201)
def submit_message(body: schemas_contact.ContactMessageCreate, request: Request,
                   db: Session = Depends(get_db)):
    """Buzón público: entra como no leído, anti-spam con throttle por IP."""
    ip = request.client.host if request.client else "?"
    key = f"contact|{ip}"
    if not rate_limit.login_allowed(key):
        raise HTTPException(status_code=429, detail="Demasiados intentos, espera un minuto")
    rate_limit.login_hit(key)
    msg = contact_service.create_message(db, name=body.name, email=str(body.email),
                                         phone=body.phone, message=body.message)
    return {"detail": "Mensaje recibido, te responderemos en menos de 24 horas.", "id": msg.id}


@router.get("/messages", response_model=schemas_contact.ContactMessagePage,
            dependencies=[Depends(require_permission("contacto.read"))])
def list_messages(offset: int = 0, limit: int = 50, unread_only: bool = False,
                  db: Session = Depends(get_db)):
    items, total = contact_service.list_messages(db, offset=offset, limit=limit, unread_only=unread_only)
    return {"items": items, "total": total}


@router.put("/messages/{message_id}", response_model=schemas_contact.ContactMessageOut,
            dependencies=[Depends(require_permission("contacto.update"))])
def mark_message(message_id: int, body: schemas_contact.ContactMessageRead,
                 db: Session = Depends(get_db)):
    try:
        return contact_service.mark_read(db, message_id, body.is_read)
    except NotFound as exc:
        raise HTTPException(404, str(exc)) from exc


@router.delete("/messages/{message_id}", response_model=dict,
               dependencies=[Depends(require_permission("contacto.delete"))])
def delete_message(message_id: int, db: Session = Depends(get_db)):
    try:
        contact_service.delete_message(db, message_id)
    except NotFound as exc:
        raise HTTPException(404, str(exc)) from exc
    return {"detail": "Mensaje eliminado"}


@router.put("/info", response_model=schemas_contact.ContactInfoOut,
            dependencies=[Depends(require_permission("contacto.update"))])
def update_info(body: schemas_contact.ContactInfoUpdate, db: Session = Depends(get_db)):
    data = body.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(400, "Nada que actualizar")
    return contact_service.update_info(db, **data)


@router.get("/socials", response_model=list[schemas_contact.ContactSocialOut])
def list_socials(db: Session = Depends(get_db)):
    return contact_service.list_socials(db)


@router.post("/socials", response_model=schemas_contact.ContactSocialOut, status_code=201,
             dependencies=[Depends(require_permission("contacto.update"))])
def create_social(body: schemas_contact.ContactSocialCreate, db: Session = Depends(get_db)):
    return contact_service.create_social(db, **body.model_dump())


@router.put("/socials/{social_id}", response_model=schemas_contact.ContactSocialOut,
            dependencies=[Depends(require_permission("contacto.update"))])
def update_social(social_id: int, body: schemas_contact.ContactSocialUpdate, db: Session = Depends(get_db)):
    data = body.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(400, "Nada que actualizar")
    try:
        return contact_service.update_social(db, social_id, **data)
    except NotFound as exc:
        raise HTTPException(404, str(exc)) from exc


@router.delete("/socials/{social_id}", response_model=dict,
               dependencies=[Depends(require_permission("contacto.delete"))])
def delete_social(social_id: int, db: Session = Depends(get_db)):
    try:
        contact_service.delete_social(db, social_id)
    except NotFound as exc:
        raise HTTPException(404, str(exc)) from exc
    return {"detail": "Red social eliminada"}
