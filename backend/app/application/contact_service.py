"""Casos de uso de Contacto: buzón público + datos editables (singleton id=1)."""
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import NotFound
from app.infrastructure.models.contact import ContactInfo, ContactMessage, ContactSocial


def create_message(db: Session, *, name: str, email: str, phone: str | None, message: str) -> ContactMessage:
    msg = ContactMessage(
        name=name.strip(), email=email.strip().lower(),
        phone=(phone or "").strip() or None, message=message.strip(),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def list_messages(db: Session, *, offset: int = 0, limit: int = 50,
                  unread_only: bool = False) -> tuple[list[ContactMessage], int]:
    filters = [ContactMessage.is_read.is_(False)] if unread_only else []
    base = select(ContactMessage).where(*filters) if filters else select(ContactMessage)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    items = list(db.scalars(base.order_by(ContactMessage.id.desc()).offset(offset).limit(min(limit, 100))).all())
    return items, total


def mark_read(db: Session, message_id: int, is_read: bool) -> ContactMessage:
    msg = db.get(ContactMessage, message_id)
    if msg is None:
        raise NotFound("Mensaje no encontrado")
    msg.is_read = is_read
    db.commit()
    db.refresh(msg)
    return msg


def delete_message(db: Session, message_id: int) -> None:
    msg = db.get(ContactMessage, message_id)
    if msg is None:
        raise NotFound("Mensaje no encontrado")
    db.delete(msg)
    db.commit()


DEFAULTS = {
    "address": "Av. Artística 2410, Local 3\nCol. Centro, Ciudad",
    "schedule": "Lunes–Sábado: 10:00–19:00\nDomingo: 11:00–16:00",
    "whatsapp": "+52 55 1234 5678",
    "instagram": "@nailsstudio.mx",
}


def get_info(db: Session) -> ContactInfo:
    info = db.get(ContactInfo, 1)
    if info is None:
        info = ContactInfo(id=1, **DEFAULTS)  # type: ignore[arg-type]
        db.add(info)
        db.commit()
        db.refresh(info)
    return info


def update_info(db: Session, **fields) -> ContactInfo:
    info = get_info(db)
    for key, value in fields.items():
        if value is not None and hasattr(info, key):
            setattr(info, key, value)
    db.commit()
    db.refresh(info)
    return info


def list_socials(db: Session) -> list[ContactSocial]:
    return list(db.scalars(select(ContactSocial).order_by(ContactSocial.id)).all())


def create_social(db: Session, *, label: str, url: str, icon: str) -> ContactSocial:
    social = ContactSocial(label=label.strip(), url=url.strip(), icon=(icon or "web").strip().lower() or "web")
    db.add(social)
    db.commit()
    db.refresh(social)
    return social


def update_social(db: Session, social_id: int, **fields) -> ContactSocial:
    social = db.get(ContactSocial, social_id)
    if social is None:
        raise NotFound("Red social no encontrada")
    for key, value in fields.items():
        if value is not None and hasattr(social, key):
            setattr(social, key, value.strip() if isinstance(value, str) else value)
    db.commit()
    db.refresh(social)
    return social


def delete_social(db: Session, social_id: int) -> None:
    social = db.get(ContactSocial, social_id)
    if social is None:
        raise NotFound("Red social no encontrada")
    db.delete(social)
    db.commit()
