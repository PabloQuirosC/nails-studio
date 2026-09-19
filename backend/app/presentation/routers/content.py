"""Contenido: lectura pública (blog y testimonios), escritura solo staff."""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.application import content_service
from app.core import rate_limit
from app.core.exceptions import Conflict, NotFound
from app.infrastructure.db.session import get_db
from app.presentation import schemas_content
from app.presentation.deps import require_permission

router = APIRouter(prefix="/posts", tags=["contenido"])


def _map(exc: Exception) -> HTTPException:
    if isinstance(exc, NotFound):
        return HTTPException(404, str(exc))
    if isinstance(exc, Conflict):
        return HTTPException(409, str(exc))
    if isinstance(exc, ValueError):
        return HTTPException(400, str(exc))
    raise exc  # type: ignore[misc]


@router.get("", response_model=schemas_content.PostPage)
def list_all(offset: int = 0, limit: int = 50, q: str = "", kind: str = "",
             category: str = "", db: Session = Depends(get_db)):
    try:
        items, total = content_service.list_posts(
            db, offset=offset, limit=limit, q=q, kind=kind, category=category)
    except Exception as exc:
        raise _map(exc) from exc
    return {"items": items, "total": total}


@router.get("/admin/todos", response_model=schemas_content.PostPage,
            dependencies=[Depends(require_permission("blog.read"))])
def list_all_admin(offset: int = 0, limit: int = 50, q: str = "", kind: str = "",
                   published: bool | None = None, db: Session = Depends(get_db)):
    """Panel admin: incluye pendientes de moderación. Filtra por published si se indica."""
    try:
        items, total = content_service.list_posts(
            db, offset=offset, limit=limit, q=q, kind=kind,
            public_only=False, published=published)
    except Exception as exc:
        raise _map(exc) from exc
    return {"items": items, "total": total}


@router.post("/testimonios", response_model=dict, status_code=201)
def submit_testimonio(body: schemas_content.TestimonioCreate, request: Request,
                      db: Session = Depends(get_db)):
    """Reseña pública: entra como pendiente (published=False) anti-spam con throttle."""
    ip = request.client.host if request.client else "?"
    key = f"review|{ip}"
    if not rate_limit.login_allowed(key):
        raise HTTPException(status_code=429, detail="Demasiados intentos, espera un minuto")
    rate_limit.login_hit(key)
    try:
        post = content_service.create_post(
            db, title=body.author.strip(), kind="testimonio", excerpt=body.text.strip(),
            body=None, category="Testimonio", author=body.author.strip(),
            rating=body.rating, design_name=(body.design_name or "").strip() or None,
            published=False,
        )
    except Exception as exc:
        raise _map(exc) from exc
    return {"detail": "Reseña recibida, será publicada tras revisión.", "id": post.id}


@router.get("/{ref}", response_model=schemas_content.PostOut)
def get_one(ref: str, db: Session = Depends(get_db)):
    try:
        return content_service.get_by_ref(db, ref)
    except Exception as exc:
        raise _map(exc) from exc


@router.post("", response_model=schemas_content.PostOut, status_code=201,
             dependencies=[Depends(require_permission("blog.create"))])
def create(body: schemas_content.PostCreate, db: Session = Depends(get_db)):
    try:
        return content_service.create_post(db, **body.model_dump())
    except Exception as exc:
        raise _map(exc) from exc


@router.put("/{post_id}", response_model=schemas_content.PostOut,
            dependencies=[Depends(require_permission("blog.update"))])
def update(post_id: int, body: schemas_content.PostUpdate, db: Session = Depends(get_db)):
    try:
        return content_service.update_post(db, post_id, **body.model_dump())
    except Exception as exc:
        raise _map(exc) from exc


@router.delete("/{post_id}", response_model=dict,
               dependencies=[Depends(require_permission("blog.delete"))])
def delete(post_id: int, db: Session = Depends(get_db)):
    try:
        content_service.delete_post(db, post_id)
    except Exception as exc:
        raise _map(exc) from exc
    return {"detail": "Publicación eliminada"}
