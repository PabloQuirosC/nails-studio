"""Reserva pública: crea clienta si no existe, bloquea solapes, siempre pending.

Usa SQLite en memoria (no requiere DATABASE_URL).
"""
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.application import agenda_service
from app.core.exceptions import Conflict
from app.infrastructure.db.base import Base

import app.infrastructure.models.agenda as _agenda_models  # noqa: F401
import app.infrastructure.models.clients as _client_models  # noqa: F401


@pytest.fixture()
def db():
    engine = create_engine("sqlite:///:memory:")
    # Solo las tablas del flujo (designs usa ARRAY de Postgres, sin soporte sqlite).
    _client_models.Client.__table__.create(engine)
    _agenda_models.Appointment.__table__.create(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()


def _slot(days_ahead=1, hour=10, minutes=60):
    start = (datetime.now(timezone.utc) + timedelta(days=days_ahead)).replace(
        hour=hour, minute=0, second=0, microsecond=0)
    return start, start + timedelta(minutes=minutes)


def test_creates_client_and_pending(db):
    start, end = _slot()
    appt = agenda_service.create_public_booking(
        db, name="Ana López", phone="+52 55 0001", email="ana@x.com",
        design_id=None, starts_at=start, ends_at=end, notes="French")
    assert appt.id is not None
    assert appt.status == "pending"
    assert appt.client_id is not None


def test_reuses_client_by_phone(db):
    start, end = _slot()
    a1 = agenda_service.create_public_booking(
        db, name="Ana", phone="+52 55 0002", email=None,
        design_id=None, starts_at=start, ends_at=end, notes=None)
    start2, end2 = _slot(days_ahead=2)
    a2 = agenda_service.create_public_booking(
        db, name="Ana Otra", phone="+52 55 0002", email=None,
        design_id=None, starts_at=start2, ends_at=end2, notes=None)
    assert a1.client_id == a2.client_id


def test_overlap_blocked(db):
    start, end = _slot()
    agenda_service.create_public_booking(
        db, name="A", phone="+52 55 0003", email=None,
        design_id=None, starts_at=start, ends_at=end, notes=None)
    with pytest.raises(Conflict):
        agenda_service.create_public_booking(
            db, name="B", phone="+52 55 0004", email=None,
            design_id=None,
            starts_at=start + timedelta(minutes=30),
            ends_at=end + timedelta(minutes=30), notes=None)


def test_invalid_range_blocked(db):
    start, end = _slot()
    with pytest.raises(Conflict):
        agenda_service.create_public_booking(
            db, name="C", phone="+52 55 0005", email=None,
            design_id=None, starts_at=end, ends_at=start, notes=None)
