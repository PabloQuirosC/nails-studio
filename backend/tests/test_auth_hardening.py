"""C3+H1: bloqueado sin acceso + cambio de password revoca refresh."""
from datetime import datetime, timedelta, timezone

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.infrastructure.models.rbac as rbac
from app.application import auth_service
from app.infrastructure.db.base import UserStatus


def _db():
    engine = create_engine("sqlite:///:memory:")
    rbac.Role.__table__.create(engine)
    rbac.User.__table__.create(engine)
    rbac.UserRole.__table__.create(engine)
    rbac.RefreshToken.__table__.create(engine)
    return sessionmaker(bind=engine)()


def test_change_password_revoca_refresh_vivos():
    db = _db()
    try:
        u = rbac.User(username="ana", email="ana@t.com", full_name="Ana",
                      password_hash="x", status=UserStatus.ACTIVE)
        db.add(u)
        db.flush()
        exp = datetime.now(timezone.utc) + timedelta(days=1)
        db.add(rbac.RefreshToken(user_id=u.id, token_hash="h1", expires_at=exp))
        db.add(rbac.RefreshToken(user_id=u.id, token_hash="h2", expires_at=exp, revoked=True))
        db.commit()
        auth_service.change_password(db, u, "nueva-clave-123")
        vivos = [t for t in db.scalars(
            __import__("sqlalchemy").select(rbac.RefreshToken)
            .where(rbac.RefreshToken.user_id == u.id)).all() if not t.revoked]
        assert vivos == []
    finally:
        db.close()


def test_get_current_user_rechaza_bloqueado():
    from fastapi import HTTPException

    from app.presentation import deps

    db = _db()
    try:
        u = rbac.User(username="bloq", email="b@t.com", full_name="B",
                      password_hash="x", status=UserStatus.BLOCKED)
        db.add(u)
        db.commit()
        try:
            deps.get_current_user(payload={"sub": str(u.id)}, db=db)
            raise AssertionError("debió rechazar al bloqueado")
        except HTTPException as exc:
            assert exc.status_code == 401
    finally:
        db.close()
