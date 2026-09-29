"""Flag mensual de diseños: schemas + cadena de migración 0011.

Sin DB: la columna `tags` usa ARRAY de postgres y no crea tabla en SQLite,
así que se valida el contrato Pydantic que consumen frontend y router.
"""
import importlib.util
from pathlib import Path
from types import SimpleNamespace

from app.presentation import schemas_studio as s


def test_create_sin_flag_queda_no_mensual():
    d = s.DesignCreate(category_id=1, name="French Cristal", price=22500)
    assert d.is_monthly is False


def test_create_acepta_flag_mensual():
    d = s.DesignCreate(category_id=1, name="Ombre Terracota", price=19000, is_monthly=True)
    assert d.is_monthly is True


def test_update_acepta_is_monthly_none_por_defecto():
    assert s.DesignUpdate().is_monthly is None
    assert s.DesignUpdate(is_monthly=True).is_monthly is True
    assert s.DesignUpdate(is_monthly=False).is_monthly is False


def test_out_incluye_is_monthly():
    row = SimpleNamespace(
        id=1, category_id=2, name="Botanical Garden", price=37500, duration_min=120,
        image_url=None, description=None, technique=None, tags=[],
        occasion="Fiesta/Evento", complexity="Elaborado", active=True, is_monthly=True,
    )
    assert s.DesignOut.model_validate(row).is_monthly is True


def _load_migration(name: str):
    path = Path(__file__).resolve().parent.parent / "alembic" / "versions" / f"{name}.py"
    spec = importlib.util.spec_from_file_location(f"mig_{name}", path)
    assert spec is not None and spec.loader is not None
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_migracion_0011_encadena_0010():
    mig = _load_migration("0011_design_is_monthly")
    assert mig.revision == "0011_design_is_monthly"
    assert mig.down_revision == "0010_referral_info"
