"""Catálogo: lectura pública (web sin login), escritura solo staff."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.application import catalog_service
from app.core.exceptions import Conflict, ForbiddenOp, NotFound
from app.infrastructure.db.session import get_db
from app.presentation import schemas_studio as s
from app.presentation.deps import require_permission

router = APIRouter(tags=["catalogo"])


def _map(exc: Exception) -> HTTPException:
    if isinstance(exc, NotFound):
        return HTTPException(404, str(exc))
    if isinstance(exc, Conflict):
        return HTTPException(409, str(exc))
    if isinstance(exc, ForbiddenOp):
        return HTTPException(400, str(exc))
    if isinstance(exc, ValueError):
        return HTTPException(400, str(exc))
    raise exc  # type: ignore[misc]


cats = APIRouter(prefix="/categories", tags=["categories"])


@cats.get("", response_model=list[s.CategoryOut])
def list_categories(active_only: bool = False, db: Session = Depends(get_db)):
    return [
        s.CategoryOut(
            id=c.id, slug=c.slug, name=c.name, icon=c.icon, color=c.color,
            description=c.description, active=c.active, design_count=n,
        )
        for c, n in [(r["category"], r["design_count"]) for r in catalog_service.list_categories(db, active_only=active_only)]
    ]


@cats.post("", response_model=s.CategoryOut, status_code=201,
           dependencies=[Depends(require_permission("catalogo.create"))])
def create_category(body: s.CategoryCreate, db: Session = Depends(get_db)):
    try:
        return catalog_service.create_category(db, **body.model_dump())
    except Exception as exc:
        raise _map(exc) from exc


@cats.put("/{category_id}", response_model=s.CategoryOut,
          dependencies=[Depends(require_permission("catalogo.update"))])
def update_category(category_id: int, body: s.CategoryUpdate, db: Session = Depends(get_db)):
    try:
        return catalog_service.update_category(db, category_id, **body.model_dump())
    except Exception as exc:
        raise _map(exc) from exc


@cats.delete("/{category_id}", response_model=dict,
             dependencies=[Depends(require_permission("catalogo.delete"))])
def delete_category(category_id: int, db: Session = Depends(get_db)):
    try:
        catalog_service.delete_category(db, category_id)
    except Exception as exc:
        raise _map(exc) from exc
    return {"detail": "Categoría eliminada"}


designs = APIRouter(prefix="/designs", tags=["designs"])


@designs.get("", response_model=s.DesignPage)
def list_designs(offset: int = 0, limit: int = 50, q: str = "", category: str = "",
                 occasion: str = "", active_only: bool = True, db: Session = Depends(get_db)):
    items, total = catalog_service.list_designs(
        db, offset=offset, limit=limit, q=q, category=category, occasion=occasion, active_only=active_only)
    return {"items": items, "total": total}


@designs.get("/{design_id}", response_model=s.DesignOut)
def get_design(design_id: int, db: Session = Depends(get_db)):
    from app.infrastructure.models.catalog import Design
    design = db.get(Design, design_id)
    if design is None:
        raise HTTPException(404, "Diseño no encontrado")
    return design


@designs.post("", response_model=s.DesignOut, status_code=201,
              dependencies=[Depends(require_permission("catalogo.create"))])
def create_design(body: s.DesignCreate, db: Session = Depends(get_db)):
    try:
        return catalog_service.create_design(db, **body.model_dump())
    except Exception as exc:
        raise _map(exc) from exc


@designs.put("/{design_id}", response_model=s.DesignOut,
             dependencies=[Depends(require_permission("catalogo.update"))])
def update_design(design_id: int, body: s.DesignUpdate, db: Session = Depends(get_db)):
    try:
        return catalog_service.update_design(db, design_id, **body.model_dump())
    except Exception as exc:
        raise _map(exc) from exc


@designs.delete("/{design_id}", response_model=dict,
                dependencies=[Depends(require_permission("catalogo.delete"))])
def delete_design(design_id: int, db: Session = Depends(get_db)):
    try:
        catalog_service.delete_design(db, design_id)
    except Exception as exc:
        raise _map(exc) from exc
    return {"detail": "Diseño eliminado"}


router.include_router(cats)
router.include_router(designs)
