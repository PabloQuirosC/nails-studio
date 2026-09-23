"""Regresión: UserOut.roles debe serializar nombres (no objetos UserRole).

Reproduce el 500 de PUT /usuarios/{id}: el modelo crudo expone la relación
`roles` como lista de UserRole y FastAPI falla con ResponseValidationError.
El router debe mapear con _out() (nombres vía role_names_for_user).
"""
import pytest
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.infrastructure.db.base import UserStatus
from app.infrastructure.models.rbac import Module, Role, User, UserRole
from app.presentation import schemas
from app.presentation.routers.users import _out


@pytest.fixture()
def db():
    engine = create_engine("sqlite:///:memory:")
    Module.__table__.create(engine)
    Role.__table__.create(engine)
    User.__table__.create(engine)
    UserRole.__table__.create(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()


def _seed(db):
    db.add(Module(code="USUARIOS", name="Usuarios"))
    db.add(Role(name="ADMIN", description="Acceso total", is_system=True))
    db.add(User(username="admin", password_hash="x", email="admin@x.com",
                full_name="Admin", status=UserStatus.ACTIVE))
    db.flush()
    db.add(UserRole(user_id=1, role_id=1))
    db.commit()
    return db.get(User, 1)


def test_out_mapea_roles_como_nombres(db):
    user = _seed(db)
    out = _out(db, user)
    assert out.roles == ["ADMIN"]
    assert out.full_name == "Admin"


def test_modelo_crudo_no_valida_como_userout(db):
    """Documenta el bug: el ORM crudo no satisface UserOut (roles son objetos)."""
    user = _seed(db)
    with pytest.raises(ValidationError):
        schemas.UserOut.model_validate(user)
