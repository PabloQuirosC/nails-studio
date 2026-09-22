"""Casos de uso de Contenido (blog + testimonios + nosotros). Lectura pública solo publicados."""
import logging
import re

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import Conflict, NotFound
from app.infrastructure.models.content import Post, PostCategory

logger = logging.getLogger(__name__)

KINDS = ("articulo", "testimonio", "nosotros")


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
        raise Conflict("kind inválido (articulo|testimonio|nosotros)")
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
        raise Conflict("kind inválido (articulo|testimonio|nosotros)")
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
        raise Conflict("kind inválido (articulo|testimonio|nosotros)")
    # Se aplica todo lo recibido, incluido None (= vaciar el campo).
    # El router usa exclude_unset: lo no enviado no llega aquí.
    for key, value in fields.items():
        if hasattr(post, key):
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


def _category_slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower().strip())
    return slug.strip("-") or "categoria"


def list_categories(db: Session) -> list[PostCategory]:
    return list(db.scalars(select(PostCategory).order_by(PostCategory.name)).all())


def create_category(db: Session, *, name: str) -> PostCategory:
    clean = name.strip()
    if len(clean) < 2:
        raise Conflict("El nombre necesita mínimo 2 caracteres")
    if db.scalar(select(PostCategory).where(PostCategory.name == clean)):
        raise Conflict("Ya existe una categoría con ese nombre")
    base = _category_slugify(clean)
    slug, i = base, 2
    while db.scalar(select(PostCategory).where(PostCategory.slug == slug)):
        slug, i = f"{base}-{i}", i + 1
    cat = PostCategory(name=clean, slug=slug)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    logger.info("Categoría de blog creada: %s", clean)
    return cat


def update_category(db: Session, category_id: int, *, name: str) -> PostCategory:
    cat = db.get(PostCategory, category_id)
    if cat is None:
        raise NotFound("Categoría no encontrada")
    clean = name.strip()
    if len(clean) < 2:
        raise Conflict("El nombre necesita mínimo 2 caracteres")
    other = db.scalar(select(PostCategory).where(PostCategory.name == clean))
    if other is not None and other.id != category_id:
        raise Conflict("Ya existe una categoría con ese nombre")
    old_name = cat.name
    cat.name = clean
    # Los posts se asocian por nombre: renombrar migra la asociación.
    db.execute(
        Post.__table__.update().where(Post.category == old_name).values(category=clean)
    )
    db.commit()
    db.refresh(cat)
    logger.info("Categoría de blog actualizada: %s -> %s", old_name, clean)
    return cat


def delete_category(db: Session, category_id: int) -> None:
    cat = db.get(PostCategory, category_id)
    if cat is None:
        raise NotFound("Categoría no encontrada")
    in_use = db.scalar(
        select(func.count()).select_from(Post).where(Post.category == cat.name)
    ) or 0
    if in_use:
        raise Conflict(
            f"No se puede eliminar: {in_use} artículo(s) la usan. Reasígnalos primero."
        )
    db.delete(cat)
    db.commit()
    logger.info("Categoría de blog eliminada: %s", cat.name)
