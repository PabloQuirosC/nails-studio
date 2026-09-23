"""Dependencias FastAPI. Autorización siempre desde DB, nunca del JWT."""
import logging

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core import tokens
from app.core.exceptions import TokenExpired, TokenInvalid
from app.infrastructure.db.base import UserStatus
from app.infrastructure.db.session import get_db
from app.infrastructure.models.rbac import User
from app.infrastructure.repositories import rbac_repo

log = logging.getLogger(__name__)

_bearer = HTTPBearer(auto_error=False)
ACCESS_COOKIE = "ns_access"
REFRESH_COOKIE = "ns_refresh"


def _extract_access_token(request: Request, creds: HTTPAuthorizationCredentials | None) -> str | None:
    cookie = request.cookies.get(ACCESS_COOKIE)
    if cookie:
        return cookie
    if creds is not None and creds.scheme.lower() == "bearer":
        return creds.credentials
    return None


def _kill_on_tamper(db: Session | None, raw_token: str, reason: str) -> None:
    """Best-effort: ante firma manipulada se revocan todos los refresh del sub."""
    if db is None:
        return
    try:
        from app.application import auth_service

        sub = tokens.unsafe_sub(raw_token)
        if sub is not None and sub.isdigit():
            auth_service.revoke_all_for_user(db, int(sub))
            log.warning("JWT tamper (%s): sesión matada user_id=%s", reason, sub)
    except Exception:
        pass


def get_token_payload(
    request: Request,
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> dict:
    token = _extract_access_token(request, creds)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No autenticado")
    try:
        return tokens.decode_token(token, expected_type=tokens.ACCESS_TYPE)
    except TokenExpired as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expirado") from exc
    except TokenInvalid as exc:
        # Manipulación detectada -> mato sesión en backend y aviso al front.
        _kill_on_tamper(db, token, str(exc))
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión invalidada por manipulación") from exc


def get_current_user(
    payload: dict = Depends(get_token_payload), db: Session = Depends(get_db)
) -> User:
    user = db.get(User, int(payload["sub"]))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no existe")
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no activo")
    return user


def require_role(*names: str):
    """Autoriza contra DB. El JWT solo identifica (sub), jamás autoriza."""

    def _guard(payload: dict = Depends(get_token_payload), db: Session = Depends(get_db)) -> dict:
        try:
            user_id = int(payload["sub"])
        except (KeyError, ValueError, TypeError):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión invalidada por manipulación")
        have = {r.lower() for r in rbac_repo.role_names_for_user(db, user_id)}
        if not any(n.lower() in have for n in names):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Rol insuficiente")
        return payload

    return _guard


def require_permission(code: str):
    """Autoriza contra DB. El JWT solo identifica (sub), jamás autoriza."""
    want = code.lower()

    def _guard(payload: dict = Depends(get_token_payload), db: Session = Depends(get_db)) -> dict:
        try:
            user_id = int(payload["sub"])
        except (KeyError, ValueError, TypeError):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión invalidada por manipulación")
        have = {p.lower() for p in rbac_repo.permission_codes_for_user(db, user_id)}
        if want not in have:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permiso insuficiente")
        return payload

    return _guard
