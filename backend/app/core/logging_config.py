"""Logging estructurado: JSON por línea + rotación a archivo + request-id.

Mejoras futuras aplicadas: cuando el log crece, las líneas JSON permiten filtrar
por nivel/logger/request-id, y el RotatingFileHandler evita discos llenos.
En Vercel (filesystem read-only): solo consola.
También incluye funciones de sanitización para prevenir inyección en logs (CWE-117).
"""
import json
import logging
import logging.handlers
import os
import re
from contextvars import ContextVar
from datetime import datetime, timezone
from pathlib import Path

request_id_ctx: ContextVar[str] = ContextVar("request_id", default="-")

LOG_DIR = Path(__file__).resolve().parent.parent.parent / "logs"
LOG_FILE = LOG_DIR / "nails.jsonl"


def sanitize_log(value: str) -> str:
    """Sanitizar datos para prevenir inyección en logs (CWE-117).

    Escapa secuencias de formato de log y elimina caracteres de control.
    Esto previene ataques donde datos user-provided en logs podrían
    alterar la salida del log o inyectar entradas falsas.

    - Reemplaza % por %% (logging usa %% para % literal)
    - Elimina caracteres de control ASCII (0x00-0x1f, 0x7f)
    - Mantiene la legibilidad para propósitos de depuración
    """
    if not isinstance(value, str):
        value = str(value)
    # Reemplazar % por %% (el sistema de logging usa %% para un % literal)
    escaped = value.replace("%", "%%")
    # Eliminar o reemplazar caracteres de control que podrían romper el log
    cleaned = re.sub(r"[\x00-\x1f\x7f]", "", escaped)
    return cleaned


class RequestIdFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_ctx.get()
        return True


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        return json.dumps(
            {
                "ts": datetime.now(timezone.utc).isoformat(),
                "level": record.levelname,
                "logger": record.name,
                "request_id": getattr(record, "request_id", "-"),
                "msg": record.getMessage(),
            },
            ensure_ascii=False,
        )


_configured = False


def setup_logging(level: int = logging.INFO) -> None:
    """Idempotente (seguro con el reloader de uvicorn)."""
    global _configured
    if _configured:
        return
    en_vercel = os.getenv("VERCEL", "").lower() in ("1", "true")
    if not en_vercel:
        LOG_DIR.mkdir(parents=True, exist_ok=True)
    root = logging.getLogger()
    root.setLevel(level)
    root.handlers.clear()
    fmt = JsonFormatter()
    console = logging.StreamHandler()
    console.setFormatter(fmt)
    console.addFilter(RequestIdFilter())
    root.addHandler(console)
    if not en_vercel:
        disk = logging.handlers.RotatingFileHandler(
            LOG_FILE, maxBytes=1_000_000, backupCount=5, encoding="utf-8"
        )
        disk.setFormatter(fmt)
        disk.addFilter(RequestIdFilter())
        root.addHandler(disk)
    # Ruido de terceros a WARNING para no inundar el JSONL.
    for noisy in ("uvicorn.access", "httpx", "httpcore"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
    _configured = True