"""Contenido: lectura pública (blog y testimonios), escritura solo staff."""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.application import content_service
from app.core import rate_limit
from app.core.email import get_admin_emails, notify_review_approved, notify_review_received
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
                      background: BackgroundTasks, db: Session = Depends(get_db)):
    """Reseña pública: entra como pendiente (published=False) anti-spam con throttle."""
    ip = rate_limit.client_ip(request)
    if not rate_limit.check("review", ip):
        raise HTTPException(status_code=429, detail="Demasiados intentos, espera un minuto")
    rate_limit.hit("review", ip)
    try:
        post = content_service.create_post(
            db, title=body.author.strip(), kind="testimonio", excerpt=body.text.strip(),
            body=None, category="Testimonio", author=body.author.strip(),
            rating=body.rating, design_name=(body.design_name or "").strip() or None,
            published=False,
        )
    except Exception as exc:
        raise _map(exc) from exc
    admins = get_admin_emails(db)
    background.add_task(notify_review_received, author=post.author or body.author.strip(),
                        rating=body.rating, text=body.text.strip(), post_id=post.id,
                        admin_emails=admins)
    return {"detail": "Reseña recibida, será publicada tras revisión.", "id": post.id}


# Categorías administrables (antes de /{ref} para no colisionar con slugs).
@router.get("/categories", response_model=list[schemas_content.CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return content_service.list_categories(db)


@router.post("/categories", response_model=schemas_content.CategoryOut, status_code=201,
             dependencies=[Depends(require_permission("blog.create"))])
def create_category(body: schemas_content.CategoryCreate, db: Session = Depends(get_db)):
    try:
        return content_service.create_category(db, name=body.name)
    except Exception as exc:
        raise _map(exc) from exc


@router.put("/categories/{category_id}", response_model=schemas_content.CategoryOut,
            dependencies=[Depends(require_permission("blog.update"))])
def update_category(category_id: int, body: schemas_content.CategoryUpdate,
                    db: Session = Depends(get_db)):
    try:
        return content_service.update_category(db, category_id, name=body.name)
    except Exception as exc:
        raise _map(exc) from exc


@router.delete("/categories/{category_id}", response_model=dict,
               dependencies=[Depends(require_permission("blog.delete"))])
def delete_category(category_id: int, db: Session = Depends(get_db)):
    try:
        content_service.delete_category(db, category_id)
    except Exception as exc:
        raise _map(exc) from exc
    return {"detail": "Categoría eliminada"}


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
def update(post_id: int, body: schemas_content.PostUpdate, background: BackgroundTasks,
           db: Session = Depends(get_db)):
    try:
        was_published = False
        was_kind = ""
        try:
            prev = content_service.get_by_ref(db, str(post_id), public_only=False)
            was_published = bool(prev.published)
            was_kind = prev.kind or ""
        except Exception:
            pass
        post = content_service.update_post(db, post_id, **body.model_dump(exclude_unset=True))
    except Exception as exc:
        raise _map(exc) from exc
    if post.kind == "testimonio" and post.published and not (was_kind == "testimonio" and was_published):
        admins = get_admin_emails(db)
        background.add_task(notify_review_approved, author=post.author or post.title,
                            rating=post.rating or 5, text=post.excerpt or "",
                            post_id=post.id, admin_emails=admins)
    return post


@router.delete("/{post_id}", response_model=dict,
               dependencies=[Depends(require_permission("blog.delete"))])
def delete(post_id: int, db: Session = Depends(get_db)):
    try:
        content_service.delete_post(db, post_id)
    except Exception as exc:
        raise _map(exc) from exc
    return {"detail": "Publicación eliminada"}
