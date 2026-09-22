"""Seed idempotente RBAC Nails Studio (admin vía variables de entorno, nunca CLI)."""
import logging

from sqlalchemy import func, select

from app.core.security import hash_password
from app.infrastructure.db.base import PermissionType
from app.infrastructure.db.session import session_factory
from app.infrastructure.models.rbac import Module, Permission, Role, RolePermission, User, UserRole
from app.core.config import settings

logger = logging.getLogger(__name__)

MODULES: list[tuple[str, str]] = [
    ("USUARIOS", "Usuarios"),
    ("ROLES", "Roles"),
    ("PERMISOS", "Permisos"),
    ("MODULOS", "Módulos"),
    ("CATALOGO", "Catálogo"),
    ("RESERVAS", "Reservas"),
    ("CLIENTAS", "Clientas"),
    ("GIFTCARDS", "Gift Cards"),
    ("REFERIDOS", "Referidos"),
    ("BLOG", "Blog y testimonios"),
    ("CONTACTO", "Contacto y mensajes"),
]

TYPES = [PermissionType.READ, PermissionType.CREATE, PermissionType.UPDATE, PermissionType.DELETE]


def _module(db, code: str, name: str) -> Module:
    mod = db.scalar(select(Module).where(Module.code == code))
    if mod is None:
        mod = Module(code=code, name=name, description=f"Módulo {name}")
        db.add(mod)
        db.flush()
    return mod


def _permission(db, mod: Module, kind: PermissionType) -> Permission:
    code = f"{mod.code.lower()}.{kind.value.lower()}"
    perm = db.scalar(select(Permission).where(Permission.code == code))
    if perm is None:
        perm = Permission(module_id=mod.id, name=f"{mod.name} · {kind.value.title()}",
                          code=code, type=kind)
        db.add(perm)
        db.flush()
    return perm


def main() -> None:
    db = session_factory()
    try:
        mods = [_module(db, code, name) for code, name in MODULES]
        perms = [p for m in mods for p in [_permission(db, m, t) for t in TYPES]]
        # Case-insensitive: no duplica si el rol existe como 'Admin'/'admin'.
        admin = db.scalar(select(Role).where(func.lower(Role.name) == "admin"))
        if admin is None:
            admin = Role(name="ADMIN", description="Acceso total", is_system=True)
            db.add(admin)
            db.flush()
        for perm in perms:
            if db.get(RolePermission, (admin.id, perm.id)) is None:
                db.add(RolePermission(role_id=admin.id, permission_id=perm.id))
        email = settings.admin_email.lower()
        user = db.scalar(select(User).where(User.email == email))
        if user is None:
            if not settings.admin_password or len(settings.admin_password) < 12:
                raise SystemExit("ADMIN_PASSWORD debe tener >= 12 caracteres en .env")
            user = User(username=settings.admin_username, email=email,
                        full_name="Administradora Nails Studio",
                        password_hash=hash_password(settings.admin_password))
            db.add(user)
            db.flush()
            db.add(UserRole(user_id=user.id, role_id=admin.id))
        db.commit()
        logger.info("Seed completado: %s módulos, %s permisos, admin=%s", len(mods), len(perms), email)
        print(f"Seed OK: {len(mods)} módulos, {len(perms)} permisos, admin={email}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
