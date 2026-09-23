"""Consultas RBAC (evita N+1: una sola query para códigos de permiso)."""
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.infrastructure.db.base import UserStatus
from app.infrastructure.models.rbac import Permission, Role, RolePermission, User, UserRole


def find_user_by_username(db: Session, username: str) -> User | None:
    return db.scalar(select(User).where(func.lower(User.username) == username.lower()))


def find_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(func.lower(User.email) == email.lower()))


def permission_codes_for_user(db: Session, user_id: int) -> list[str]:
    rows = db.execute(
        select(Permission.code)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .join(Role, Role.id == RolePermission.role_id)
        .join(UserRole, UserRole.role_id == Role.id)
        .where(
            UserRole.user_id == user_id, UserRole.active.is_(True),
            Role.active.is_(True), RolePermission.active.is_(True),
            Permission.active.is_(True),
        )
    ).all()
    return sorted({r[0].lower() for r in rows})


def role_names_for_user(db: Session, user_id: int) -> list[str]:
    rows = db.execute(
        select(Role.name)
        .join(UserRole, UserRole.role_id == Role.id)
        .where(UserRole.user_id == user_id, UserRole.active.is_(True), Role.active.is_(True))
    ).all()
    return sorted({r[0] for r in rows})


def active_user_count(db: Session) -> int:
    return db.scalar(select(func.count()).select_from(User).where(User.status == UserStatus.ACTIVE)) or 0
