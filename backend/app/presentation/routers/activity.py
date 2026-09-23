"""Feed global de actividad reciente (solo ADMIN: expone intentos de login)."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.application import activity_service
from app.infrastructure.db.session import get_db
from app.presentation import schemas
from app.presentation.deps import require_role

router = APIRouter(prefix="/actividad", tags=["actividad"])


@router.get("/reciente", response_model=list[schemas.ActivityItemOut],
            dependencies=[Depends(require_role("ADMIN"))])
def recent(limit: int = 20, db: Session = Depends(get_db)):
    return activity_service.recent(db, limit=limit)
