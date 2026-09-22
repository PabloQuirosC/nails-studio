"""Contenido de referidos: defaults + edición (sqlite en memoria)."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.infrastructure.models.referral as _ref
from app.application import referral_service


def _db():
    engine = create_engine("sqlite:///:memory:")
    _ref.ReferralInfo.__table__.create(engine)
    return sessionmaker(bind=engine)()


def test_defaults_se_crean_solos():
    db = _db()
    try:
        info = referral_service.get_info(db)
        assert info.id == 1
        assert len(info.steps) == 3
    finally:
        db.close()


def test_update_solo_campos_enviados():
    db = _db()
    try:
        info = referral_service.update_info(db, title="Nuevo título")
        assert info.title == "Nuevo título"
        assert len(info.steps) == 3
    finally:
        db.close()
