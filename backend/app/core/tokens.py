"""Emisión y verificación de JWT (access corto + refresh).

Seguridad: la autorización NUNCA sale del JWT. Los claims roles/permissions
son solo hint de UI; los guards consultan DB. Aquí se distingue firma
inválida (posible manipulación) de expiración para matar sesión.
"""
from datetime import datetime, timedelta, timezone

import jwt

from app.core.config import settings
from app.core.exceptions import TokenExpired, TokenInvalid

ACCESS_TYPE = "access"
REFRESH_TYPE = "refresh"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(*, sub: str, username: str, roles: list[str], permissions: list[str]) -> tuple[str, int]:
    expires_min = settings.access_token_expire_minutes
    exp = _now() + timedelta(minutes=expires_min)
    payload = {
        "sub": sub, "username": username,
        "roles": sorted(roles), "permissions": sorted(permissions),
        "type": ACCESS_TYPE, "exp": exp,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_alg), expires_min * 60


def create_refresh_token(*, sub: str) -> tuple[str, str, datetime]:
    """Devuelve (jwt, hash_sha256_para_guardar, expira_en). El JWT nunca se guarda plano."""
    import hashlib
    import secrets

    raw = secrets.token_urlsafe(48)
    digest = hashlib.sha256(raw.encode()).hexdigest()
    exp = _now() + timedelta(days=settings.refresh_token_expire_days)
    payload = {"sub": sub, "type": REFRESH_TYPE, "exp": exp}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_alg), digest, exp


def decode_token(token: str, *, expected_type: str) -> dict:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_alg])
    except jwt.ExpiredSignatureError as exc:
        raise TokenExpired("Token expirado") from exc
    except jwt.InvalidSignatureError as exc:
        raise TokenInvalid("Firma inválida: posible manipulación") from exc
    except jwt.DecodeError as exc:
        raise TokenInvalid("Token manipulado o corrupto") from exc
    except jwt.PyJWTError as exc:
        raise TokenInvalid("Token inválido o expirado") from exc
    if payload.get("type") != expected_type:
        raise TokenInvalid("Tipo de token incorrecto")
    return payload


def unsafe_sub(token: str) -> str | None:
    """Extrae `sub` sin verificar firma (solo para matar sesión + auditar).

    Nunca se usa para autorizar. Si el token ni siquiera decodifica base64,
    retorna None.
    """
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
    except Exception:
        return None
    sub = payload.get("sub")
    return str(sub) if sub is not None else None
