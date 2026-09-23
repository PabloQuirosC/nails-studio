"""H2: nunca quedarse sin administradores + sin auto-borrado."""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.infrastructure.models.rbac as rbac
from app.application import rbac_service
from app.core.exceptions import ForbiddenOp
from app.infrastructure.db.base import UserStatus


def _db_con_admin_unico():
    engine = create_engine("sqlite:///:memory:")
    rbac.Role.__table__.create(engine)
    rbac.User.__table__.create(engine)
    rbac.UserRole.__table__.create(engine)
    Session = sessionmaker(bind=engine)
    db = Session()
    role = rbac.Role(name="ADMIN", description="x", is_system=True)
    db.add(role)
    db.flush()
    user = rbac.User(username="solo", email="s@t.com", full_name="S",
                     password_hash="x", status=UserStatus.ACTIVE)
    db.add(user)
    db.flush()
    db.add(rbac.UserRole(user_id=user.id, role_id=role.id))
    db.commit()
    return db, user, role


def test_no_borrar_ultimo_admin():
    db, user, _ = _db_con_admin_unico()
    try:
        with pytest.raises(ForbiddenOp):
            rbac_service.delete_user(db, user.id)
    finally:
        db.close()


def test_no_quitar_ultimo_rol_admin():
    db, user, role = _db_con_admin_unico()
    try:
        with pytest.raises(ForbiddenOp):
            rbac_service.remove_role(db, user.id, role.id)
    finally:
        db.close()
