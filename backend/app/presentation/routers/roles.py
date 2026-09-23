"""CRUD roles/permisos/módulos (solo ADMIN). Delete bloquea roles del sistema."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.application import rbac_service
from app.core.exceptions import Conflict, ForbiddenOp, NotFound
from app.infrastructure.db.session import get_db
from app.infrastructure.models.rbac import Module, Permission, Role, RolePermission
from app.presentation import schemas
from app.presentation.deps import require_role

router = APIRouter(dependencies=[Depends(require_role("ADMIN"))])


def _map(exc: Exception) -> HTTPException:
    if isinstance(exc, NotFound):
        return HTTPException(404, str(exc) or "No encontrado")
    if isinstance(exc, Conflict):
        return HTTPException(409, str(exc))
    if isinstance(exc, ForbiddenOp):
        return HTTPException(400, str(exc))
    raise exc  # type: ignore[misc]


roles = APIRouter(prefix="/roles", tags=["roles"])


@roles.post("", response_model=schemas.RoleOut, status_code=201)
def create_role(body: schemas.RoleCreate, db: Session = Depends(get_db)):
    try:
        return rbac_service.create_role(db, name=body.name, description=body.description)
    except Exception as exc:
        raise _map(exc) from exc


@roles.get("", response_model=list[schemas.RoleOut])
def list_roles(db: Session = Depends(get_db)):
    return list(db.scalars(select(Role).order_by(Role.id)).all())


@roles.put("/{role_id}", response_model=schemas.RoleOut)
def update_role(role_id: int, body: schemas.RoleUpdate, db: Session = Depends(get_db)):
    try:
        return rbac_service.update_role(db, role_id, name=body.name,
                                        description=body.description, active=body.active)
    except Exception as exc:
        raise _map(exc) from exc


@roles.delete("/{role_id}", response_model=schemas.Message)
def delete_role(role_id: int, db: Session = Depends(get_db)):
    try:
        rbac_service.delete_role(db, role_id)
    except Exception as exc:
        raise _map(exc) from exc
    return {"detail": "Rol eliminado"}


@roles.post("/{role_id}/permisos", response_model=schemas.Message, status_code=201)
def grant(role_id: int, body: schemas.PermissionAssign, db: Session = Depends(get_db)):
    try:
        rbac_service.grant_permission(db, role_id, body.permission_id)
    except Exception as exc:
        raise _map(exc) from exc
    return {"detail": "Permiso asignado"}


@roles.delete("/{role_id}/permisos/{permission_id}", response_model=schemas.Message)
def revoke(role_id: int, permission_id: int, db: Session = Depends(get_db)):
    try:
        rbac_service.revoke_permission(db, role_id, permission_id)
    except Exception as exc:
        raise _map(exc) from exc
    return {"detail": "Permiso retirado"}


@roles.get("/{role_id}/permisos", response_model=list[schemas.PermissionOut])
def role_permissions(role_id: int, db: Session = Depends(get_db)):
    return list(
        db.scalars(
            select(Permission)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .where(RolePermission.role_id == role_id)
            .order_by(Permission.code)
        ).all()
    )


extra = APIRouter(tags=["rbac"])


@extra.get("/permisos", response_model=list[schemas.PermissionOut])
def list_permissions(db: Session = Depends(get_db)):
    return list(db.scalars(select(Permission).order_by(Permission.code)).all())


@extra.get("/modulos", response_model=list[schemas.ModuleOut])
def list_modules(db: Session = Depends(get_db)):
    return list(db.scalars(select(Module).order_by(Module.code)).all())


router.include_router(roles)
router.include_router(extra)
