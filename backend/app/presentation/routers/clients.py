"""Clientas: CRUD + puntos manuales + progreso de lealtad."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.application import agenda_service, clients_service
from app.core.exceptions import Conflict, NotFound
from app.infrastructure.db.session import get_db
from app.infrastructure.models.giftcard import GiftCard
from app.presentation import schemas_studio as s
from app.presentation.deps import require_permission

router = APIRouter(prefix="/clients", tags=["clientas"])


def _map(exc: Exception) -> HTTPException:
    if isinstance(exc, NotFound):
        return HTTPException(404, str(exc))
    if isinstance(exc, Conflict):
        return HTTPException(409, str(exc))
    if isinstance(exc, ValueError):
        return HTTPException(400, str(exc))
    raise exc  # type: ignore[misc]


@router.get("", response_model=s.ClientPage,
            dependencies=[Depends(require_permission("clientas.read"))])
def list_all(offset: int = 0, limit: int = 50, q: str = "", db: Session = Depends(get_db)):
    items, total = clients_service.list_clients(db, offset=offset, limit=limit, q=q)
    return {"items": items, "total": total}


@router.post("", response_model=s.ClientOut, status_code=201,
             dependencies=[Depends(require_permission("clientas.create"))])
def create(body: s.ClientCreate, db: Session = Depends(get_db)):
    try:
        return clients_service.create_client(db, **body.model_dump())
    except Exception as exc:
        raise _map(exc) from exc


@router.get("/{client_id}", response_model=s.ClientOut,
            dependencies=[Depends(require_permission("clientas.read"))])
def get_one(client_id: int, db: Session = Depends(get_db)):
    from app.infrastructure.models.clients import Client
    client = db.get(Client, client_id)
    if client is None:
        raise HTTPException(404, "Clienta no encontrada")
    return client


@router.put("/{client_id}", response_model=s.ClientOut,
            dependencies=[Depends(require_permission("clientas.update"))])
def update(client_id: int, body: s.ClientUpdate, db: Session = Depends(get_db)):
    try:
        return clients_service.update_client(db, client_id, **body.model_dump())
    except Exception as exc:
        raise _map(exc) from exc


@router.post("/{client_id}/points", response_model=s.ClientOut,
             dependencies=[Depends(require_permission("clientas.update"))])
def adjust_points(client_id: int, body: s.ClientPoints, db: Session = Depends(get_db)):
    try:
        return clients_service.adjust_points(db, client_id, body.delta, body.reason)
    except Exception as exc:
        raise _map(exc) from exc


@router.delete("/{client_id}", response_model=dict,
               dependencies=[Depends(require_permission("clientas.delete"))])
def delete(client_id: int, db: Session = Depends(get_db)):
    try:
        clients_service.delete_client(db, client_id)
    except Exception as exc:
        raise _map(exc) from exc
    return {"detail": "Clienta eliminada"}


@router.get("/{client_id}/rewards", response_model=s.RewardsOut,
            dependencies=[Depends(require_permission("clientas.read"))])
def rewards(client_id: int, db: Session = Depends(get_db)):
    from app.infrastructure.models.clients import Client
    client = db.get(Client, client_id)
    if client is None:
        raise HTTPException(404, "Clienta no encontrada")
    to_go = agenda_service.LOYALTY_EVERY - (client.visits % agenda_service.LOYALTY_EVERY)
    codes = list(db.scalars(
        select(GiftCard.code).where(GiftCard.client_id == client_id, GiftCard.source == "loyalty")
        .order_by(GiftCard.id.desc())
    ).all())
    return {
        "client_id": client.id,
        "visits": client.visits,
        "visits_to_reward": 0 if to_go == agenda_service.LOYALTY_EVERY and client.visits > 0 else to_go,
        "progress_pct": round((client.visits % agenda_service.LOYALTY_EVERY) / agenda_service.LOYALTY_EVERY * 100),
        "loyalty_cards": codes,
    }
