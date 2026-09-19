"""CRUD usuarios (solo ADMIN) + asignación de roles + cambio de contraseña."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.application import auth_service, rbac_service
from app.core.exceptions import Conflict, ForbiddenOp, NotFound
from app.infrastructure.db.base import UserStatus
from app.infrastructure.db.session import get_db
from app.infrastructure.repositories import rbac_repo
from app.presentation import schemas
from app.presentation.deps import require_role

router = APIRouter(prefix="/usuarios", tags=["usuarios"], dependencies=[Depends(require_role("ADMIN"))])


def _map(exc: Exception) -> HTTPException:
    if isinstance(exc, NotFound):
        return HTTPException(404, str(exc) or "No encontrado")
    if isinstance(exc, Conflict):
        return HTTPException(409, str(exc))
    if isinstance(exc, ForbiddenOp):
        return HTTPException(400, str(exc))
    if isinstance(exc, ValueError):
        return HTTPException(400, str(exc))
    raise exc  # type: ignore[misc]


@router.post("", response_model=schemas.UserOut, status_code=201)
def create(body: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        return rbac_service.create_user(db, username=body.username, email=str(body.email),
                                        full_name=body.full_name, password=body.password)
    except Exception as exc:
        raise _map(exc) from exc


@router.get("", response_model=schemas.UserPage)
def list_all(offset: int = 0, limit: int = 50, status: UserStatus | None = None,
             q: str = "", role: str = "", db: Session = Depends(get_db)):
    items, total = rbac_service.list_users(db, offset=offset, limit=limit, status=status, q=q, role=role)
    out = [
        schemas.UserOut(
            id=u.id, username=u.username, email=u.email, full_name=u.full_name, status=u.status,
            roles=rbac_repo.role_names_for_user(db, u.id), last_login=u.last_login,
        )
        for u in items
    ]
    return {"items": out, "total": total}


@router.get("/{user_id}", response_model=schemas.UserOut)
def get_one(user_id: int, db: Session = Depends(get_db)):
    from app.infrastructure.models.rbac import User
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(404, "Usuario no encontrado")
    return user


@router.put("/{user_id}", response_model=schemas.UserOut)
def update(user_id: int, body: schemas.UserUpdate, db: Session = Depends(get_db)):
    try:
        return rbac_service.update_user(db, user_id, email=str(body.email) if body.email else None,
                                        full_name=body.full_name, status=body.status)
    except Exception as exc:
        raise _map(exc) from exc


@router.delete("/{user_id}", response_model=schemas.Message, status_code=status.HTTP_200_OK)
def delete(user_id: int, db: Session = Depends(get_db)):
    try:
        rbac_service.delete_user(db, user_id)
    except Exception as exc:
        raise _map(exc) from exc
    return {"detail": "Usuario eliminado"}


@router.put("/{user_id}/password", response_model=schemas.Message)
def change_password(user_id: int, body: schemas.PasswordUpdate, db: Session = Depends(get_db)):
    from app.infrastructure.models.rbac import User
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(404, "Usuario no encontrado")
    try:
        auth_service.change_password(db, user, body.password)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    return {"detail": "Contraseña actualizada"}


@router.post("/{user_id}/roles", response_model=schemas.Message, status_code=201)
def grant_role(user_id: int, body: schemas.RoleAssign, db: Session = Depends(get_db)):
    try:
        rbac_service.assign_role(db, user_id, body.role_id)
    except Exception as exc:
        raise _map(exc) from exc
    return {"detail": "Rol asignado"}


@router.delete("/{user_id}/roles/{role_id}", response_model=schemas.Message)
def revoke_role(user_id: int, role_id: int, db: Session = Depends(get_db)):
    try:
        rbac_service.remove_role(db, user_id, role_id)
    except Exception as exc:
        raise _map(exc) from exc
    return {"detail": "Rol retirado"}


@router.get("/{user_id}/roles", response_model=list[str])
def user_roles(user_id: int, db: Session = Depends(get_db)):
    return rbac_repo.role_names_for_user(db, user_id)
