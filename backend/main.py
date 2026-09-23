"""Shim para Vercel Fluid: la app vive en app.main (detección zero-config)."""
from app.main import app  # noqa: F401  (Vercel busca `app` en main.py)
