"""Categorías del blog: CRUD + renombrado migra posts + borrado bloqueado en uso."""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.application import content_service
from app.core.exceptions import Conflict, NotFound
from app.infrastructure.models.content import Post, PostCategory


@pytest.fixture()
def db():
    engine = create_engine("sqlite:///:memory:")
    Post.__table__.create(engine)
    PostCategory.__table__.create(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()


def _post(db, title="T", category="Tips"):
    return content_service.create_post(
        db, title=title, kind="articulo", category=category, published=True
    )


def test_crud_y_listado_ordenado(db):
    content_service.create_category(db, name="Tendencias")
    content_service.create_category(db, name="Cuidados")
    assert [c.name for c in content_service.list_categories(db)] == ["Cuidados", "Tendencias"]


def test_nombre_duplicado_bloqueado(db):
    content_service.create_category(db, name="Tips")
    with pytest.raises(Conflict):
        content_service.create_category(db, name="Tips")


def test_renombrar_migra_posts(db):
    _post(db, category="Tips")
    content_service.create_category(db, name="Tips")
    updated = content_service.update_category(db, 1, name="Consejos")
    assert updated.name == "Consejos"
    assert db.get(Post, 1).category == "Consejos"


def test_borrar_en_uso_bloqueado_y_vacia_ok(db):
    _post(db, category="Tips")
    content_service.create_category(db, name="Tips")
    with pytest.raises(Conflict):
        content_service.delete_category(db, 1)
    content_service.create_category(db, name="Libre")
    content_service.delete_category(db, 2)
    with pytest.raises(NotFound):
        content_service.delete_category(db, 999)


def test_vaciar_campos_con_none(db):
    """Regresión: vaciar imagen/resumen en el admin debe persistir (null explícito)."""
    p = content_service.create_post(
        db, title="Historia", kind="nosotros", category="Historia",
        excerpt="Resumen", image_url="https://x.test/img.jpg", published=True,
    )
    assert p.image_url is not None
    updated = content_service.update_post(db, p.id, image_url=None, excerpt=None)
    assert updated.image_url is None
    assert updated.excerpt is None
    assert updated.title == "Historia"


def test_update_parcial_no_toca_lo_omitido(db):
    """Lo no enviado (exclude_unset) no se modifica."""
    p = content_service.create_post(
        db, title="T", kind="articulo", category="Tips",
        excerpt="E", image_url="https://x.test/i.jpg", published=True,
    )
    updated = content_service.update_post(db, p.id, published=False)
    assert updated.published is False
    assert updated.image_url == "https://x.test/i.jpg"
    assert updated.excerpt == "E"
