"""Logging estructurado: JSON por línea + rotación a archivo + request-id.

Mejora futura aplicada: cuando el log crece, las líneas JSON permiten filtrar
por nivel/logger/request-id, y el RotatingFileHandler evita discos llenos.
En Vercel (filesystem read-only): solo consola.
"""
import json
import logging
import logging.handlers
import os
from contextvars import ContextVar
from datetime import datetime, timezone
from pathlib import Path

request_id_ctx: ContextVar[str] = ContextVar("request_id", default="-")

LOG_DIR = Path(__file__).resolve().parent.parent.parent / "logs"
LOG_FILE = LOG_DIR / "nails.jsonl"


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
