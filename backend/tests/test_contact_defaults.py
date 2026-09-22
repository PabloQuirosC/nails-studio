"""Paridad Contacto/Nosotros: defaults backend ↔ fallbacks frontend ↔ migración.

Sin base de datos: evita que la fuente única se desvíe en silencio.
"""
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
FRONT_CONTACT = REPO_ROOT / "frontend" / "src" / "pages" / "Contact" / "index.tsx"
FRONT_ABOUT = REPO_ROOT / "frontend" / "src" / "pages" / "About" / "index.tsx"
MIGRATION = REPO_ROOT / "backend" / "alembic" / "versions" / "0007_contact.py"

from app.application import contact_service, content_service


def test_kinds_include_nosotros():
    assert "nosotros" in content_service.KINDS


def test_contact_defaults_complete():
    assert set(contact_service.DEFAULTS) == {"address", "schedule", "whatsapp", "instagram"}
    assert all(v.strip() for v in contact_service.DEFAULTS.values())


def test_frontend_contact_sin_mocks():
    """Contact no muestra datos fijos: skeleton cargando, error + reintentar, datos del servidor."""
    text = FRONT_CONTACT.read_text(encoding="utf-8")
    assert "useContactInfo" in text, "Contact debe leer contact_info (fuente única)"
    assert "useContactSocials" in text, "Contact debe leer las redes agregables"
    assert "Cargando contacto" in text, "Contact debe mostrar skeleton mientras carga"
    assert "Reintentar" in text, "Contact debe ofrecer reintentar si falla"
    for fijo in ("Av. Artística 2410", "+52 55 1234 5678", "@nailsstudio.mx"):
        assert fijo not in text, f"dato fijo en Contact: {fijo!r}"


def test_frontend_about_reads_nosotros():
    text = FRONT_ABOUT.read_text(encoding="utf-8")
    assert "usePublicPosts('nosotros')" in text


def test_migration_seeds_singleton():
    text = MIGRATION.read_text(encoding="utf-8")
    assert "contact_info" in text
    assert "contact_messages" in text
    assert "Av. Artística 2410" in text
