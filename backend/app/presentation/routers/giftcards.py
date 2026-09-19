"""Gift Cards: lectura/creación/canje/borrado con permisos finos por código."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.application import giftcard_service
from app.core.exceptions import Conflict, NotFound
from app.infrastructure.db.session import get_db
from app.infrastructure.models.giftcard import GiftCard
from app.infrastructure.models.rbac import User
from app.presentation import schemas
from app.presentation.deps import get_current_user, require_permission

router = APIRouter(prefix="/giftcards", tags=["giftcards"])


def _map(exc: Exception) -> HTTPException:
    if isinstance(exc, NotFound):
        return HTTPException(404, str(exc))
    if isinstance(exc, Conflict):
        return HTTPException(409, str(exc))
    raise exc  # type: ignore[misc]


@router.get("", response_model=schemas.GiftCardPage,
            dependencies=[Depends(require_permission("giftcards.read"))])
def list_all(offset: int = 0, limit: int = 50, q: str = "", used: bool | None = None,
             source: str | None = None, db: Session = Depends(get_db)):
    items, total = giftcard_service.list_gift_cards(db, offset=offset, limit=limit, q=q, used=used, source=source)
    return {"items": items, "total": total}


@router.post("", response_model=schemas.GiftCardOut, status_code=201,
             dependencies=[Depends(require_permission("giftcards.create"))])
def create(body: schemas.GiftCardCreate, db: Session = Depends(get_db)):
    try:
        return giftcard_service.create_gift_card(db, amount=body.amount, buyer=body.buyer,
                                                 recipient=body.recipient)
    except Exception as exc:
        raise _map(exc) from exc


@router.put("/{code}", response_model=schemas.GiftCardOut,
            dependencies=[Depends(require_permission("giftcards.update"))])
def update(code: str, body: schemas.GiftCardUsed, db: Session = Depends(get_db),
           user: User = Depends(get_current_user)):
    try:
        data = body.model_dump(exclude_none=True)
        if not data:
            raise HTTPException(400, "Nada que actualizar")
        used = data.pop("used", None)
        if data:
            giftcard_service.update_gift_card(db, code, actor=user, **data)
        if used is None:
            gc = db.scalar(select(GiftCard).where(GiftCard.code == code))
            if gc is None:
                raise HTTPException(404, "Gift card no encontrada")
            return gc
        return giftcard_service.set_used(db, code, used, actor=user)
    except Exception as exc:
        raise _map(exc) from exc


@router.get("/{code}/history", response_model=list[schemas.GiftCardAuditOut],
            dependencies=[Depends(require_permission("giftcards.read"))])
def history(code: str, db: Session = Depends(get_db)):
    try:
        return giftcard_service.history(db, code)
    except Exception as exc:
        raise _map(exc) from exc


@router.delete("/{code}", response_model=schemas.Message,
               dependencies=[Depends(require_permission("giftcards.delete"))])
def delete(code: str, db: Session = Depends(get_db)):
    try:
        giftcard_service.delete_gift_card(db, code)
    except Exception as exc:
        raise _map(exc) from exc
    return {"detail": "Gift card eliminada"}
