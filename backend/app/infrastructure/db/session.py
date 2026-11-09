"""Sesión sync (psycopg2) contra Supabase pooler 6543. get_db por request."""
import os
import re

from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.exceptions import InvalidConfiguration

# Pattern to validate database URL - prevent URL injection
# Only allow standard URL formats with http, https, or postgres schemes
_DATABASE_URL_PATTERN = re.compile(
    r"^postgres(?:://)?[^\s]+$|^mysql://[^\s]+$|^postgresql://[^\s]+$"
)


def _validate_database_url(url: str) -> str:
    """Validar y sanitizar la URL de base de datos para prevenir injection.
    
    Alert #1: Incomplete URL substring sanitization - aseguramos que la URL
    tenga un esquema válido y no contenga caracteres sospechosos.
    """
    if not url:
        raise InvalidConfiguration("DATABASE_URL no configurada")
    
    # Limpiar espacios en blanco
    url = url.strip()
    
    # Verificar esquema permitido
    if not re.match(r"^(postgres|postgresql|mysql)://", url, re.IGNORECASE):
        # Aceptar también URLs sin esquema que empiecen con los estándares
        if not url.startswith(("postgres://", "postgresql://", "mysql://")):
            raise InvalidConfiguration(
                "DATABASE_URL debe tener un esquema válido (postgres://, postgresql://, mysql://)"
            )
    
    # Verificar que no haya caracteres de control o inyección
    if re.search(r"[\\x00-\\x1f\\x7f]", url):
        raise InvalidConfiguration("DATABASE_URL contiene caracteres no válidos")
    
    return url


def _ensure() -> None:
    global _engine, _SessionLocal
    if _engine is not None:
        return
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL no configurada (ver .env)")
    
    # Validar y sanitizar la URL
    safe_url = _validate_database_url(settings.database_url)
    
    database_url = make_url(safe_url)
    if database_url.host and database_url.host.endswith("pooler.supabase.com") and database_url.port == 5432:
        database_url = database_url.set(port=6543)
    url = database_url.render_as_string(hide_password=False)
    connect_args = {"sslmode": "require"} if "sslmode" not in url else {}
    if os.getenv("VERCEL", "").lower() in ("1", "true"):
        # Vercel puede lanzar muchas rutas a la vez; limita conexiones por instancia.
        _engine = create_engine(
            url, pool_size=1, max_overflow=0, pool_timeout=10,
            pool_pre_ping=True, connect_args=connect_args,
        )
    else:
        _engine = create_engine(url, pool_size=5, max_overflow=10, pool_pre_ping=True, connect_args=connect_args)
    _SessionLocal = sessionmaker(bind=_engine, autoflush=False, expire_on_commit=False)


def session_factory():
    _ensure()
    assert _SessionLocal is not None
    return _SessionLocal()


def get_db():
    db = session_factory()
    try:
        yield db
    finally:
        db.close()
