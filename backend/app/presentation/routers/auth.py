"""POST /login · POST /refresh · POST /logout · GET /me (cookie httpOnly + Bearer fallback)."""
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.application import auth_service
from app.core import rate_limit
from app.core.config import settings
from app.core.exceptions import InactiveUser, InvalidCredentials, NoPermissions, TokenInvalid
from app.infrastructure.db.session import get_db
from app.infrastructure.models.rbac import LoginAudit, User
from app.infrastructure.repositories import rbac_repo
from app.presentation import schemas
from app.presentation.deps import ACCESS_COOKIE, REFRESH_COOKIE, get_current_user, require_role

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


class _RefreshIn(BaseModel):
    refresh_token: str | None = None


def _cookie_params(max_age: int) -> dict:
    params = {
        "httponly": True,
        "secure": settings.is_prod,
        "samesite": "none" if settings.is_prod else "lax",
        "path": "/",
        "max_age": max_age,
    }
    if settings.is_prod:
        # Compartir cookie entre subdominios de Vercel (ej: nails-studio-gray.vercel.app ↔ nails-studio-89kk.vercel.app)
        params["domain"] = ".vercel.app"
    return params


def _audit(db, *, username: str, user_id: int | None, success: bool, request: Request) -> None:
    """Best-effort: la auditoría nunca rompe el login."""
    try:
        db.add(LoginAudit(
            username=username[:100], user_id=user_id, success=success,
            ip=request.client.host if request.client else None,
            user_agent=(request.headers.get("user-agent") or "")[:300] or None,
        ))
        db.commit()
    except Exception:
        db.rollback()


@router.post("/login", response_model=schemas.TokenOut)
def login(body: schemas.LoginIn, request: Request, response: Response, db: Session = Depends(get_db)):
    ip = rate_limit.client_ip(request)
    key = f"{ip}|{body.username.lower()}"
    if not rate_limit.check("login", key):
        logger.warning("Login bloqueado por throttle: %s", key)
        raise HTTPException(status_code=429, detail="Demasiados intentos, espera un minuto")
    rate_limit.hit("login", key)
    try:
        result = auth_service.login(db, body.username, body.password)
    except NoPermissions as exc:
        logger.warning("Login sin permisos: %s desde %s", body.username, request.client.host if request.client else "?")
        _audit(db, username=body.username, user_id=None, success=False, request=request)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    except (InvalidCredentials, InactiveUser):
        logger.warning("Login fallido: %s desde %s", body.username, request.client.host if request.client else "?")
        _audit(db, username=body.username, user_id=None, success=False, request=request)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    rate_limit.login_clear(f"login|{key}")
    _audit(db, username=body.username, user_id=int(result["user_id"]), success=True, request=request)
    response.set_cookie(ACCESS_COOKIE, result["access_token"], **_cookie_params(result["expires_in"]))
    response.set_cookie(REFRESH_COOKIE, result["refresh_token"],
                        **_cookie_params(settings.refresh_token_expire_days * 86400))
    return {"access_token": result["access_token"], "expires_in": result["expires_in"]}


@router.post("/refresh", response_model=schemas.TokenOut)
def refresh(body: _RefreshIn, request: Request, response: Response, db: Session = Depends(get_db)):
    raw = body.refresh_token or request.cookies.get(REFRESH_COOKIE)
    if not raw:
        raise HTTPException(status_code=401, detail="Sin refresh token")
    try:
        result = auth_service.refresh(db, raw)
    except TokenInvalid as exc:
        # No se re-emite cookie: el front debe matar sesión local ante este 401.
        for name in (ACCESS_COOKIE, REFRESH_COOKIE):
            response.delete_cookie(name, **_delete_cookie_params())
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    response.set_cookie(ACCESS_COOKIE, result["access_token"], **_cookie_params(result["expires_in"]))
    response.set_cookie(REFRESH_COOKIE, result["refresh_token"],
                        **_cookie_params(settings.refresh_token_expire_days * 86400))
    return {"access_token": result["access_token"], "expires_in": result["expires_in"]}


def _delete_cookie_params() -> dict:
    params = {"path": "/"}
    if settings.is_prod:
        params["domain"] = ".vercel.app"
    return params


@router.post("/logout", response_model=schemas.Message)
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    auth_service.logout(db, request.cookies.get(REFRESH_COOKIE))
    for name in (ACCESS_COOKIE, REFRESH_COOKIE):
        response.delete_cookie(name, **_delete_cookie_params())
    return {"detail": "Sesión cerrada"}


@router.get("/me", response_model=schemas.MeOut)
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return schemas.MeOut(
        id=user.id, username=user.username, email=user.email,
        full_name=user.full_name, status=user.status,
        roles=rbac_repo.role_names_for_user(db, user.id),
        permissions=rbac_repo.permission_codes_for_user(db, user.id),
    )


@router.get("/audits", response_model=schemas.LoginAuditPage, dependencies=[Depends(require_role("ADMIN"))])
def list_audits(offset: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    from sqlalchemy import func, select
    total = db.scalar(select(func.count()).select_from(LoginAudit)) or 0
    items = list(
        db.scalars(select(LoginAudit).order_by(LoginAudit.id.desc()).offset(offset).limit(min(limit, 100))).all()
    )
    return {"items": items, "total": total}
