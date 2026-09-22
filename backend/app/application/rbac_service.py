"""Casos de uso de usuarios y roles (Application)."""
import logging

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import Conflict, ForbiddenOp, NotFound
from app.core.security import hash_password
from app.infrastructure.db.base import UserStatus
from app.infrastructure.models.rbac import Permission, Role, RolePermission, User, UserRole

logger = logging.getLogger(__name__)


def _get_or_404(db: Session, model, obj_id: int, label: str):
    obj = db.get(model, obj_id)
    if obj is None:
        raise NotFound(f"{label} no encontrado")
    return obj


def _active_admin_ids(db: Session) -> set[int]:
    """IDs de usuarios ACTIVE con rol admin activo (case-insensitive)."""
    rows = db.execute(
        select(User.id)
        .join(UserRole, UserRole.user_id == User.id)
        .join(Role, Role.id == UserRole.role_id)
        .where(func.lower(Role.name) == "admin",
               UserRole.active.is_(True),
               Role.active.is_(True),
               User.status == UserStatus.ACTIVE)
    ).all()
    return {r[0] for r in rows}


def _ensure_not_last_admin(db: Session, user_id: int) -> None:
    admins = _active_admin_ids(db)
    if user_id in admins and len(admins) <= 1:
        logger.warning("Bloqueado: intento de dejar el sistema sin administradores (user_id=%s)", user_id)
        raise ForbiddenOp("No se puede dejar el sistema sin administradores")


# ── Users ──
def create_user(db: Session, *, username: str, email: str, full_name: str, password: str) -> User:
    user = User(username=username.strip(), email=email.strip().lower(),
                full_name=full_name.strip(), password_hash=hash_password(password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        logger.warning("Creación de usuario rechazada por duplicado: %s / %s", username, email)
        raise Conflict("Usuario o correo ya existe") from exc
    db.refresh(user)
    logger.info("Usuario creado: %s (id=%s, email=%s)", user.username, user.id, user.email)
    return user


def list_users(
    db: Session, *, offset: int = 0, limit: int = 50,
    status: UserStatus | None = None, q: str = "", role: str = "",
) -> tuple[list[User], int]:
    """Paginación en servidor (mejora futura #1): devuelve (items, total)."""
    from app.infrastructure.models.rbac import Role, UserRole

    filters = []
    if status is not None:
        filters.append(User.status == status)
    if q.strip():
        like = f"%{q.strip().lower()}%"
        filters.append(func.lower(User.username).like(like) | func.lower(User.email).like(like))
    if role.strip():
        filters.append(
            User.id.in_(
                select(UserRole.user_id).join(Role, Role.id == UserRole.role_id)
                .where(func.lower(Role.name) == role.strip().lower(), UserRole.active.is_(True))
            )
        )
    base = select(User)
    if filters:
        base = base.where(*filters)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    items = list(db.scalars(base.order_by(User.id).offset(offset).limit(min(limit, 100))).all())
    return items, total


def update_user(db: Session, user_id: int, **fields) -> User:
    user = _get_or_404(db, User, user_id, "Usuario")
    for key, value in fields.items():
        if value is not None:
            setattr(user, key, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        logger.warning("Actualización de usuario rechazada (id=%s): correo duplicado", user_id)
        raise Conflict("Correo ya en uso") from exc
    db.refresh(user)
    logger.info("Usuario actualizado: %s (id=%s)", user.username, user.id)
    return user


def delete_user(db: Session, user_id: int) -> None:
    user = _get_or_404(db, User, user_id, "Usuario")
    _ensure_not_last_admin(db, user_id)
    logger.info("Usuario eliminado: %s (id=%s)", user.username, user.id)
    db.delete(user)
    db.commit()


def assign_role(db: Session, user_id: int, role_id: int) -> None:
    user = _get_or_404(db, User, user_id, "Usuario")
    role = _get_or_404(db, Role, role_id, "Rol")
    if db.get(UserRole, (user_id, role_id)) is None:
        db.add(UserRole(user_id=user_id, role_id=role_id))
        db.commit()
        logger.info("Rol asignado: %s -> %s (user_id=%s, role_id=%s)", role.name, user.username, user_id, role_id)
    else:
        logger.info("Rol ya asignado (sin cambios): %s -> %s", role.name, user.username)


def remove_role(db: Session, user_id: int, role_id: int) -> None:
    link = db.get(UserRole, (user_id, role_id))
    if link is None:
        raise NotFound("Asignación no encontrada")
    role = _get_or_404(db, Role, role_id, "Rol")
    if role.name.strip().lower() == "admin":
        _ensure_not_last_admin(db, user_id)
    db.delete(link)
    db.commit()
    logger.info("Rol retirado: user_id=%s, role_id=%s", user_id, role_id)


# ── Roles ──
def create_role(db: Session, *, name: str, description: str | None) -> Role:
    if db.scalar(select(Role).where(func.lower(Role.name) == name.strip().lower())):
        logger.warning("Creación de rol rechazada por duplicado: %s", name)
        raise Conflict("Rol ya existe")
    role = Role(name=name.strip(), description=description)
    db.add(role)
    db.commit()
    db.refresh(role)
    logger.info("Rol creado: %s (id=%s)", role.name, role.id)
    return role


def update_role(db: Session, role_id: int, **fields) -> Role:
    role = _get_or_404(db, Role, role_id, "Rol")
    for key, value in fields.items():
        if value is not None:
            setattr(role, key, value)
    db.commit()
    db.refresh(role)
    logger.info("Rol actualizado: %s (id=%s)", role.name, role.id)
    return role


def delete_role(db: Session, role_id: int) -> None:
    role = _get_or_404(db, Role, role_id, "Rol")
    if role.is_system:
        logger.warning("Eliminación de rol del sistema bloqueada: %s (id=%s)", role.name, role.id)
        raise ForbiddenOp("No se puede eliminar un rol del sistema")
    logger.info("Rol eliminado: %s (id=%s)", role.name, role.id)
    db.delete(role)
    db.commit()


def grant_permission(db: Session, role_id: int, permission_id: int) -> None:
    role = _get_or_404(db, Role, role_id, "Rol")
    perm = _get_or_404(db, Permission, permission_id, "Permiso")
    if db.get(RolePermission, (role_id, permission_id)) is None:
        db.add(RolePermission(role_id=role_id, permission_id=permission_id))
        db.commit()
        logger.info("Permiso asignado: %s -> %s (role_id=%s)", perm.code, role.name, role_id)
    else:
        logger.info("Permiso ya asignado (sin cambios): %s -> %s", perm.code, role.name)


def revoke_permission(db: Session, role_id: int, permission_id: int) -> None:
    link = db.get(RolePermission, (role_id, permission_id))
    if link is None:
        raise NotFound("Asignación no encontrada")
    db.delete(link)
    db.commit()
    logger.info("Permiso retirado: role_id=%s, permission_id=%s", role_id, permission_id)
