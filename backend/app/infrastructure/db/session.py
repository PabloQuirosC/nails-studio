"""Sesión sync (psycopg2) contra Supabase pooler 6543. get_db por request."""
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

_engine = None
_SessionLocal = None


def _ensure() -> None:
    global _engine, _SessionLocal
    if _engine is not None:
        return
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL no configurada (ver .env)")
    url = settings.database_url
    connect_args = {"sslmode": "require"} if "sslmode" not in url else {}
    if os.getenv("VERCEL", "").lower() in ("1", "true"):
        # Vercel puede lanzar muchas rutas a la vez; limita conexiones por instancia.
        _engine = create_engine(
            url, pool_size=1, max_overflow=2, pool_timeout=10,
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
