"""Lookup público de lealtad: por teléfono exacto, sin PII sensible."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.infrastructure.models.clients as _clients
import app.infrastructure.models.giftcard as _gc
from app.application import clients_service


def _db():
    engine = create_engine("sqlite:///:memory:")
    _clients.Client.__table__.create(engine)
    _gc.GiftCard.__table__.create(engine)
    return sessionmaker(bind=engine)()


def test_lookup_by_phone_exacta():
    db = _db()
    try:
        db.add(_clients.Client(name="Ana López", phone="+52 55 0001", visits=3, points=60))
        db.commit()
        found = clients_service.lookup_by_phone(db, "  +52 55 0001 ")
        assert found is not None and found.name == "Ana López"
        assert clients_service.lookup_by_phone(db, "+52 55 000") is None
        assert clients_service.lookup_by_phone(db, "") is None
    finally:
        db.close()
