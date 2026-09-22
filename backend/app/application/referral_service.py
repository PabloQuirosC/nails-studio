"""Contenido del programa de referidos (singleton id=1, editable por admin)."""
from sqlalchemy.orm import Session

from app.infrastructure.models.referral import ReferralInfo

DEFAULTS = {
    "title": "Programa de referidos",
    "subtitle": "Invita a tus amigas y acumula recompensas de lealtad.",
    "steps": [
        "Comparte el estudio con tus amigas e invítalas a agendar",
        "Cada 10 visitas acumulas una gift card de lealtad",
        "Consulta aquí tu saldo con el teléfono de tu registro",
    ],
}


def get_info(db: Session) -> ReferralInfo:
    info = db.get(ReferralInfo, 1)
    if info is None:
        info = ReferralInfo(id=1, **DEFAULTS)  # type: ignore[arg-type]
        db.add(info)
        db.commit()
        db.refresh(info)
    return info


def update_info(db: Session, **fields) -> ReferralInfo:
    info = get_info(db)
    for key, value in fields.items():
        if value is not None and hasattr(info, key):
            setattr(info, key, value)
    db.commit()
    db.refresh(info)
    return info
