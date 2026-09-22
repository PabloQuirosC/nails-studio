"""Nails Studio API — RBAC con access corto + refresh rotativo (corrige dulce)."""
import logging
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.exceptions import Conflict, ForbiddenOp, NotFound
from app.core.logging_config import request_id_ctx, setup_logging
from app.presentation.routers import auth as auth_router
from app.presentation.routers import activity as activity_router
from app.presentation.routers import agenda as agenda_router
from app.presentation.routers import catalog as catalog_router
from app.presentation.routers import clients as clients_router
from app.presentation.routers import contact as contact_router
from app.presentation.routers import content as content_router
from app.presentation.routers import giftcards as giftcards_router
from app.presentation.routers import roles as roles_router
from app.presentation.routers import users as users_router
from fastapi.responses import JSONResponse

setup_logging()
log = logging.getLogger("nails")

app = FastAPI(title=settings.app_name, docs_url=None if settings.is_prod else "/docs")


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    """Correlación: cada request (sobre todo escritura) viaja con su request-id."""
    import re
    raw = request.headers.get("X-Request-ID") or uuid.uuid4().hex[:12]
    rid = raw if re.fullmatch(r"[A-Za-z0-9-]{1,64}", raw) else uuid.uuid4().hex[:12]
    request_id_ctx.set(rid)
    response = await call_next(request)
    response.headers["X-Request-ID"] = rid
    return response

_CSRF_EXEMPT = ("/api/v1/auth/login", "/api/v1/auth/refresh", "/healthz", "/docs", "/openapi.json")


@app.middleware("http")
async def csrf_middleware(request: Request, call_next):
    """Anti-CSRF: las mutaciones /api/* exigen cabecera no-forjable por form simple.

    Un <form> cross-site no puede añadir cabeceras custom sin preflight;
    el frontend la envía siempre (X-Requested-With: fetch). Login/refresh
    quedan exentos (aún no hay sesión que secuestrar + tienen throttle).
    """
    if (request.method in ("POST", "PUT", "PATCH", "DELETE")
            and request.url.path.startswith("/api/")
            and not request.url.path.startswith(_CSRF_EXEMPT)):
        if request.headers.get("X-Requested-With", "").lower() not in ("fetch", "xmlhttprequest"):
            return JSONResponse(status_code=403, content={"detail": "Falta cabecera X-Requested-With (posible CSRF)"})
    return await call_next(request)


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    """Cabeceras de endurecimiento (clickjacking, MIME-sniffing, referrer)."""
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    if settings.is_prod:
        response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With", "X-Request-ID"],
)


@app.exception_handler(NotFound)
async def _404(_req, exc: NotFound):
    return JSONResponse(status_code=404, content={"detail": str(exc) or "No encontrado"})


@app.exception_handler(Conflict)
async def _409(_req, exc: Conflict):
    return JSONResponse(status_code=409, content={"detail": str(exc)})


@app.exception_handler(ForbiddenOp)
async def _400(_req, exc: ForbiddenOp):
    return JSONResponse(status_code=400, content={"detail": str(exc)})


@app.get("/healthz")
def healthz():
    return {"ok": True, "app": settings.app_name}


app.include_router(auth_router.router, prefix="/api/v1")
app.include_router(users_router.router, prefix="/api/v1")
app.include_router(roles_router.router, prefix="/api/v1")
app.include_router(giftcards_router.router, prefix="/api/v1")
app.include_router(catalog_router.router, prefix="/api/v1")
app.include_router(agenda_router.router, prefix="/api/v1")
app.include_router(clients_router.router, prefix="/api/v1")
app.include_router(content_router.router, prefix="/api/v1")
app.include_router(contact_router.router, prefix="/api/v1")
app.include_router(activity_router.router, prefix="/api/v1")
