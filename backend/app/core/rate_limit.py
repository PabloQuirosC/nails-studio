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

# Topes por endpoint público (aislados por prefijo de clave).
LIMITS: dict[str, tuple[int, int]] = {
    "login": (5, 60),
    "contact": (5, 60),
    "booking": (8, 60),
    "review": (5, 60),
    "lookup": (10, 60),
}

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


def login_allowed(key: str, limit: int = _MAX, window: int = _WINDOW) -> bool:
    client = _client()
    if client is None:
        now = time.monotonic()
        bucket = [t for t in _ATTEMPTS[key] if now - t < window]
        _ATTEMPTS[key] = bucket
        return len(bucket) < limit
    try:
        return int(client.get(f"login:{key}") or 0) < limit
    except Exception as exc:
        log.error("Throttle Redis caído: fail-closed en login (%s)", exc)
        return False


def login_hit(key: str, window: int = _WINDOW) -> None:
    client = _client()
    if client is None:
        _ATTEMPTS[key].append(time.monotonic())
        return
    try:
        pipe = client.pipeline()
        pipe.incr(f"login:{key}")
        pipe.expire(f"login:{key}", window)
        pipe.execute()
    except Exception:
        pass


def check(bucket: str, key: str) -> bool:
    """¿Permite un intento en el bucket (contact|booking|review|login)?"""
    limit, window = LIMITS.get(bucket, (_MAX, _WINDOW))
    return login_allowed(f"{bucket}|{key}", limit=limit, window=window)


def hit(bucket: str, key: str) -> None:
    _, window = LIMITS.get(bucket, (_MAX, _WINDOW))
    login_hit(f"{bucket}|{key}", window=window)


def client_ip(request) -> str:
    """IP real tras proxy local: solo confía en X-Forwarded-For si el socket es privado/loopback."""
    sock = request.client.host if request.client else "?"
    xff = (request.headers.get("x-forwarded-for") or "").split(",")[0].strip()
    if xff and (sock.startswith(("127.", "10.", "192.168.")) or sock == "::1" or sock.startswith("172.")):
        return xff[:64]
    return sock


def login_clear(key: str) -> None:
    if _client() is None:
        _ATTEMPTS.pop(key, None)
        return
    try:
        _client().delete(f"login:{key}")  # type: ignore[union-attr]
    except Exception:
        pass
