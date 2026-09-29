"""Casos de uso de Catálogo: categorías y diseños."""
import logging
import re

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import Conflict, ForbiddenOp, NotFound
from app.infrastructure.models.catalog import CATEGORY_ICON_KEYS, Category, Design

logger = logging.getLogger(__name__)


def _validate_icon(icon: str) -> None:
    if icon not in CATEGORY_ICON_KEYS:
        logger.warning("Icono de categoría rechazado: %s", icon)
        raise ValueError(f"Icono inválido. Válidos: {', '.join(CATEGORY_ICON_KEYS)}")


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower().strip())
    return slug.strip("-") or "categoria"


def _get_or_404(db: Session, model, obj_id: int, label: str):
    obj = db.get(model, obj_id)
    if obj is None:
        raise NotFound(f"{label} no encontrado")
    return obj


# ── Categorías ──
def create_category(db: Session, *, name: str, icon: str = "sparkles", color: str = "#c9a96e",
                    description: str | None = None) -> Category:
    _validate_icon(icon)
    slug = _slugify(name)
    if db.scalar(select(Category).where(Category.slug == slug)):
        logger.warning("Creación de categoría rechazada por duplicado: %s", name)
        raise Conflict("Categoría ya existe")
    cat = Category(slug=slug, name=name.strip(), icon=icon, color=color, description=description)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    logger.info("Categoría creada: %s (slug=%s, id=%s)", cat.name, slug, cat.id)
    return cat


def list_categories(db: Session, *, active_only: bool = False) -> list[dict]:
    stmt = (
        select(Category, func.count(Design.id).label("design_count"))
        .outerjoin(Design, Design.category_id == Category.id)
        .group_by(Category.id)
        .order_by(Category.name)
    )
    if active_only:
        stmt = stmt.where(Category.active.is_(True))
    return [{"category": cat, "design_count": n} for cat, n in db.execute(stmt).all()]


def update_category(db: Session, category_id: int, **fields) -> Category:
    cat = _get_or_404(db, Category, category_id, "Categoría")
    if fields.get("icon") is not None:
        _validate_icon(fields["icon"])
    for key, value in fields.items():
        if value is not None:
            setattr(cat, key, value)
    db.commit()
    db.refresh(cat)
    logger.info("Categoría actualizada: %s (id=%s)", cat.name, cat.id)
    return cat


def delete_category(db: Session, category_id: int) -> None:
    cat = _get_or_404(db, Category, category_id, "Categoría")
    n = db.scalar(select(func.count()).select_from(Design).where(Design.category_id == category_id)) or 0
    if n > 0:
        logger.warning("Eliminación de categoría bloqueada: %s tiene %s diseños", cat.name, n)
        raise ForbiddenOp(f"No se puede eliminar: tiene {n} diseños asignados")
    logger.info("Categoría eliminada: %s (id=%s)", cat.name, cat.id)
    db.delete(cat)
    db.commit()


# ── Diseños ──
def _validate_design(*, price: int, duration_min: int, image_url: str | None) -> None:
    if not 1 <= price <= 100000:
        raise Conflict("Precio fuera de rango (1–100000)")
    if not 15 <= duration_min <= 300:
        raise Conflict("Duración fuera de rango (15–300 min)")
    if image_url and not image_url.startswith(("http://", "https://")):
        raise Conflict("image_url debe ser http(s)")


def create_design(db: Session, **fields) -> Design:
    _validate_design(price=fields["price"], duration_min=fields.get("duration_min", 60),
                     image_url=fields.get("image_url"))
    _get_or_404(db, Category, fields["category_id"], "Categoría")
    design = Design(**fields)
    db.add(design)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise Conflict("No se pudo crear el diseño") from exc
    db.refresh(design)
    logger.info("Diseño creado: %s (id=%s, categoría=%s, ₡%s)", design.name, design.id, design.category_id, design.price)
    return design


def list_designs(db: Session, *, offset: int = 0, limit: int = 50, q: str = "",
                 category: str = "", occasion: str = "", active_only: bool = True,
                 monthly_only: bool = False) -> tuple[list[Design], int]:
    stmt = select(Design).options(joinedload(Design.category))
    filters = []
    if active_only:
        filters.append(Design.active.is_(True))
    if monthly_only:
        filters.append(Design.is_monthly.is_(True))
    if q.strip():
        like = f"%{q.strip().lower()}%"
        filters.append(func.lower(Design.name).like(like))
    if category.strip():
        filters.append(Design.category.has(Category.slug == category.strip().lower()))
    if occasion.strip():
        filters.append(Design.occasion == occasion.strip())
    if filters:
        stmt = stmt.where(*filters)
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = list(db.scalars(stmt.order_by(Design.id).offset(offset).limit(min(limit, 100))).all())
    return items, total


def update_design(db: Session, design_id: int, **fields) -> Design:
    design = _get_or_404(db, Design, design_id, "Diseño")
    if "category_id" in fields and fields["category_id"] is not None:
        _get_or_404(db, Category, fields["category_id"], "Categoría")
    for key, value in fields.items():
        if value is not None:
            setattr(design, key, value)
    _validate_design(price=design.price, duration_min=design.duration_min, image_url=design.image_url)
    db.commit()
    db.refresh(design)
    logger.info("Diseño actualizado: %s (id=%s)", design.name, design.id)
    return design


def delete_design(db: Session, design_id: int) -> None:
    design = _get_or_404(db, Design, design_id, "Diseño")
    logger.info("Diseño eliminado: %s (id=%s)", design.name, design.id)
    db.delete(design)
    db.commit()
