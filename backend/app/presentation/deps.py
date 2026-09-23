"""Dependencias FastAPI. Corrige dulce: UNA sola extracción de usuario (sin duplicados)."""
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core import tokens
from app.core.exceptions import TokenInvalid
from app.infrastructure.db.base import UserStatus
from app.infrastructure.db.session import get_db
from app.infrastructure.models.rbac import User

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


def get_token_payload(
    request: Request, creds: HTTPAuthorizationCredentials | None = Depends(_bearer)
) -> dict:
    token = _extract_access_token(request, creds)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No autenticado")
    try:
        return tokens.decode_token(token, expected_type=tokens.ACCESS_TYPE)
    except TokenInvalid as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc


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
    def _guard(payload: dict = Depends(get_token_payload)) -> dict:
        have = {r.lower() for r in payload.get("roles", [])}
        if not any(n.lower() in have for n in names):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Rol insuficiente")
        return payload
    return _guard


def require_permission(code: str):
    want = code.lower()

    def _guard(payload: dict = Depends(get_token_payload)) -> dict:
        have = {p.lower() for p in payload.get("permissions", [])}
        if want not in have:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permiso insuficiente")
        return payload
    return _guard
