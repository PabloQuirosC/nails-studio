"""Paridad del set cerrado de iconos (frontend ↔ backend ↔ migración).

Si agregas un icono al picker (CATEGORY_ICONS) sin añadirlo a
CATEGORY_ICON_KEYS + migración, este test falla en CI antes del deploy.
No requiere base de datos.
"""
import re
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
FRONT_FILE = REPO_ROOT / "frontend" / "src" / "shared" / "category-icons.tsx"
MIGRATION_FILE = REPO_ROOT / "backend" / "alembic" / "versions" / "0003_icon_check.py"

from app.application.catalog_service import _validate_icon
from app.infrastructure.models.catalog import CATEGORY_ICON_KEYS


def _front_keys() -> set[str]:
    text = FRONT_FILE.read_text(encoding="utf-8")
    block = re.search(r"CATEGORY_ICONS = \{(.*?)\} as const", text, re.DOTALL)
    assert block, "no se encontró el bloque CATEGORY_ICONS"
    return set(re.findall(r"^\s{2}(\w+):", block.group(1), re.MULTILINE))


def _migration_keys() -> set[str]:
    text = MIGRATION_FILE.read_text(encoding="utf-8")
    expr = re.search(r"EXPR = \((.*?)\)", text, re.DOTALL)
    assert expr, "no se encontró EXPR en la migración 0003"
    return set(re.findall(r"'(\w+)'", expr.group(1)))


def test_front_matches_backend():
    assert FRONT_FILE.exists(), f"no existe {FRONT_FILE}"
    assert _front_keys() == set(CATEGORY_ICON_KEYS), (
        f"drift: frontend={sorted(_front_keys())} backend={sorted(CATEGORY_ICON_KEYS)}"
    )


def test_migration_matches_backend():
    assert _migration_keys() == set(CATEGORY_ICON_KEYS), (
        f"drift: migración={sorted(_migration_keys())} backend={sorted(CATEGORY_ICON_KEYS)}"
    )


def test_validator_accepts_all_keys():
    for key in CATEGORY_ICON_KEYS:
        _validate_icon(key)  # no debe lanzar


def test_validator_rejects_garbage():
    with pytest.raises(ValueError, match="Icono inválido"):
        _validate_icon("fire-emoji")
