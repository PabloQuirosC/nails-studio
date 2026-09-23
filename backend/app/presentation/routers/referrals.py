"""Referidos: contenido público del programa + edición staff."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.application import referral_service
from app.infrastructure.db.session import get_db
from app.presentation import schemas_referral
from app.presentation.deps import require_permission

router = APIRouter(prefix="/referrals", tags=["referidos"])


@router.get("/info", response_model=schemas_referral.ReferralInfoOut)
def get_info(db: Session = Depends(get_db)):
    return referral_service.get_info(db)


@router.put("/info", response_model=schemas_referral.ReferralInfoOut,
            dependencies=[Depends(require_permission("referidos.update"))])
def update_info(body: schemas_referral.ReferralInfoUpdate, db: Session = Depends(get_db)):
    data = body.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(400, "Nada que actualizar")
    if isinstance(data.get("steps"), list):
        clean = [s.strip() for s in data["steps"] if isinstance(s, str) and s.strip()]
        if not clean:
            raise HTTPException(400, "Pasos vacíos")
        data["steps"] = [s[:300] for s in clean[:8]]
    return referral_service.update_info(db, **data)
