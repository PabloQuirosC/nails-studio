"""Casos de uso de autenticación (Application). Corrige dulce: refresh rotativo + logout real."""
import hashlib
import logging
from datetime import timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import tokens
from app.core.exceptions import InactiveUser, InvalidCredentials, TokenInvalid
from app.core.security import dummy_verify, hash_password, verify_password
from app.infrastructure.db.base import UserStatus
from app.infrastructure.models.rbac import RefreshToken, User
from app.infrastructure.repositories import rbac_repo

logger = logging.getLogger(__name__)


def _touch_login(db: Session, user: User) -> None:
    from datetime import datetime
    user.last_login = datetime.now(timezone.utc)
    db.add(user)
    db.commit()


def authenticate(db: Session, username: str, password: str) -> User:
    user = rbac_repo.find_user_by_username(db, username) or rbac_repo.find_user_by_email(db, username)
    if user is None:
        dummy_verify()
        logger.warning("Intento de login con usuario inexistente: %s", username)
        raise InvalidCredentials("Credenciales inválidas")
    if not verify_password(password, user.password_hash):
        logger.warning("Contraseña incorrecta para el usuario: %s (id=%s)", user.username, user.id)
        raise InvalidCredentials("Credenciales inválidas")
    if user.status != UserStatus.ACTIVE:
        logger.warning("Login bloqueado, usuario no activo: %s (id=%s, estado=%s)", user.username, user.id, user.status.value)
        raise InactiveUser("Usuario no activo")
    logger.info("Usuario autenticado correctamente: %s (id=%s)", user.username, user.id)
    return user


def login(db: Session, username: str, password: str) -> dict:
    user = authenticate(db, username, password)
    roles = rbac_repo.role_names_for_user(db, user.id)
    permissions = rbac_repo.permission_codes_for_user(db, user.id)
    access, expires_in = tokens.create_access_token(
        sub=str(user.id), username=user.username, roles=roles, permissions=permissions
    )
    refresh_jwt, digest, exp = tokens.create_refresh_token(sub=str(user.id))
    db.add(RefreshToken(user_id=user.id, token_hash=digest, expires_at=exp))
    db.commit()
    _touch_login(db, user)
    logger.info("Sesión iniciada: %s (id=%s, roles=%s)", user.username, user.id, roles)
    return {"access_token": access, "expires_in": expires_in, "refresh_token": refresh_jwt, "user_id": user.id}


def refresh(db: Session, refresh_jwt: str) -> dict:
    payload = tokens.decode_token(refresh_jwt, expected_type=tokens.REFRESH_TYPE)
    digest = hashlib.sha256(refresh_jwt.encode()).hexdigest()
    stored = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == digest))
    from datetime import datetime
    if stored is None or stored.revoked or stored.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise TokenInvalid("Refresh inválido o expirado")
    # Rotación: revoca el usado y emite par nuevo
    stored.revoked = True
    user = db.get(User, int(payload["sub"]))
    if user is None or user.status != UserStatus.ACTIVE:
        db.commit()
        raise TokenInvalid("Usuario no disponible")
    roles = rbac_repo.role_names_for_user(db, user.id)
    permissions = rbac_repo.permission_codes_for_user(db, user.id)
    access, expires_in = tokens.create_access_token(
        sub=str(user.id), username=user.username, roles=roles, permissions=permissions
    )
    new_jwt, new_digest, exp = tokens.create_refresh_token(sub=str(user.id))
    db.add(RefreshToken(user_id=user.id, token_hash=new_digest, expires_at=exp))
    db.commit()
    logger.info("Refresh token rotado para el usuario: %s (id=%s)", user.username, user.id)
    return {"access_token": access, "expires_in": expires_in, "refresh_token": new_jwt}


def logout(db: Session, refresh_jwt: str | None) -> None:
    if not refresh_jwt:
        logger.info("Logout sin refresh token (solo limpieza de cookies)")
        return
    digest = hashlib.sha256(refresh_jwt.encode()).hexdigest()
    stored = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == digest))
    if stored is not None:
        stored.revoked = True
        db.commit()
        logger.info("Sesión cerrada, refresh revocado: user_id=%s", stored.user_id)
    else:
        logger.info("Logout con refresh desconocido (posible reuso o expirado)")


def change_password(db: Session, user: User, new_password: str) -> None:
    user.password_hash = hash_password(new_password)
    db.add(user)
    db.commit()
    logger.info("Contraseña actualizada para el usuario: %s (id=%s)", user.username, user.id)
