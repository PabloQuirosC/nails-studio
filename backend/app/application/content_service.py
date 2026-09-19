"""Casos de uso de Contenido (blog + testimonios). Lectura pública solo publicados."""
import logging
import re

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import Conflict, NotFound
from app.infrastructure.models.content import Post

logger = logging.getLogger(__name__)

KINDS = ("articulo", "testimonio")


def _slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower().strip())
    return slug.strip("-") or "post"


def _get_or_404(db: Session, post_id: int) -> Post:
    post = db.get(Post, post_id)
    if post is None:
        raise NotFound("Publicación no encontrada")
    return post


def get_by_ref(db: Session, ref: str, *, public_only: bool = True) -> Post:
    """Acepta id numérico o slug (la web usa /blog/:id y el admin slugs)."""
    post = None
    if ref.isdigit():
        post = db.get(Post, int(ref))
    if post is None:
        post = db.scalar(select(Post).where(Post.slug == ref))
    if post is None or (public_only and not post.published):
        raise NotFound("Publicación no encontrada")
    return post


def list_posts(db: Session, *, offset: int = 0, limit: int = 50, q: str = "",
               kind: str = "", category: str = "", public_only: bool = True,
               published: bool | None = None) -> tuple[list[Post], int]:
    if kind and kind not in KINDS:
        raise Conflict("kind inválido (articulo|testimonio)")
    filters = []
    if public_only:
        filters.append(Post.published.is_(True))
    elif published is not None:
        filters.append(Post.published.is_(published))
    if kind:
        filters.append(Post.kind == kind)
    if category.strip():
        filters.append(Post.category == category.strip())
    if q.strip():
        like = f"%{q.strip().lower()}%"
        filters.append(func.lower(Post.title).like(like))
    base = select(Post).where(*filters) if filters else select(Post)
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    items = list(db.scalars(base.order_by(Post.id.desc()).offset(offset).limit(min(limit, 100))).all())
    return items, total


def create_post(db: Session, **fields) -> Post:
    if fields.get("kind", "articulo") not in KINDS:
        raise Conflict("kind inválido (articulo|testimonio)")
    base = _slugify(fields["title"])
    slug, i = base, 2
    while db.scalar(select(Post).where(Post.slug == slug)):
        slug, i = f"{base}-{i}", i + 1
    post = Post(slug=slug, **fields)
    db.add(post)
    db.commit()
    db.refresh(post)
    logger.info("Post creado: %s (slug=%s, kind=%s)", post.title, slug, post.kind)
    return post


def update_post(db: Session, post_id: int, **fields) -> Post:
    post = _get_or_404(db, post_id)
    if fields.get("kind") is not None and fields["kind"] not in KINDS:
        raise Conflict("kind inválido (articulo|testimonio)")
    for key, value in fields.items():
        if value is not None:
            setattr(post, key, value)
    db.commit()
    db.refresh(post)
    logger.info("Post actualizado: %s (id=%s)", post.title, post.id)
    return post


def delete_post(db: Session, post_id: int) -> None:
    post = _get_or_404(db, post_id)
    logger.info("Post eliminado: %s (id=%s)", post.title, post.id)
    db.delete(post)
    db.commit()
