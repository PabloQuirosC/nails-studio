"""Throttle login: Redis en producción multi-worker, memoria como fallback local.

Corrige la mejora futura #2 (parcial): `REDIS_URL` configurada → contador
compartido con TTL; sin Redis → el fallback en memoria anterior.
"""
import logging
import time
from collections import defaultdict

from app.core.config import settings

log = logging.getLogger("nails")

_MAX = 5
_WINDOW = 60

_ATTEMPTS: dict[str, list[float]] = defaultdict(list)
_redis = None
_redis_warned = False


def _client():
    global _redis, _redis_warned
    if _redis is not None:
        return _redis
    if not settings.redis_url:
        return None
    try:
        import redis  # dependencia opcional: solo se exige si REDIS_URL está puesta

        _redis = redis.Redis.from_url(settings.redis_url, socket_timeout=2)
        _redis.ping()
        return _redis
    except Exception as exc:
        if not _redis_warned:
            log.warning("Redis no disponible, usando throttle en memoria: %s", exc)
            _redis_warned = True
        return None


def login_allowed(key: str) -> bool:
    client = _client()
    if client is None:
        now = time.monotonic()
        window = [t for t in _ATTEMPTS[key] if now - t < _WINDOW]
        _ATTEMPTS[key] = window
        return len(window) < _MAX
    try:
        return int(client.get(f"login:{key}") or 0) < _MAX
    except Exception:
        return True  # fail-open ante caída de Redis: el login sigue funcionando


def login_hit(key: str) -> None:
    client = _client()
    if client is None:
        _ATTEMPTS[key].append(time.monotonic())
        return
    try:
        pipe = client.pipeline()
        pipe.incr(f"login:{key}")
        pipe.expire(f"login:{key}", _WINDOW)
        pipe.execute()
    except Exception:
        pass


def login_clear(key: str) -> None:
    if _client() is None:
        _ATTEMPTS.pop(key, None)
        return
    try:
        _client().delete(f"login:{key}")  # type: ignore[union-attr]
    except Exception:
        pass
