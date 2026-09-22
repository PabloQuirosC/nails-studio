"""Emails vía Resend: plantillas + best-effort (sin red real en tests)."""
import sys
import types


def _ensure_resend_stub(monkeypatch):
    """Si el paquete resend no está instalado en CI, stub para probar el cableado."""
    try:
        import resend  # noqa: F401
        return None
    except ImportError:
        fake = types.ModuleType("resend")
        fake.api_key = ""
        sent = {}

        class _Emails:
            @staticmethod
            def send(params):
                sent.update(params)
                return {"id": "test-id"}

        fake.Emails = _Emails
        monkeypatch.setitem(sys.modules, "resend", fake)
        return sent


def test_base_template_escapa_html():
    from app.core.email import _esc, base_template

    # _esc es la barrera XSS; base_template acepta fragmentos HTML ya seguros (ej. <a>)
    assert "<script>" not in _esc("<script>alert(1)</script>")
    html = base_template(title="t", heading="h", intro="i",
                         rows=[("Nombre", _esc("<script>alert(1)</script>"))])
    assert "<script>" not in html
    assert "Nails Studio" in html


def test_send_email_sin_key_retorna_false(monkeypatch):
    from app.core import email as mail

    monkeypatch.setattr(mail.settings, "email_provider", "resend")
    monkeypatch.setattr(mail.settings, "resend_api_key", "")
    monkeypatch.setattr(mail.settings, "email_from", "Nails Studio <onboarding@resend.dev>")
    assert mail.send_email(to="a@x.com", subject="hola", html="<p>hola</p>") is False


def test_notify_contact_usa_admin(monkeypatch):
    from app.core import email as mail

    sent_box = _ensure_resend_stub(monkeypatch)
    monkeypatch.setattr(mail.settings, "resend_api_key", "re_test")
    monkeypatch.setattr(mail.settings, "email_from", "Nails Studio <onboarding@resend.dev>")
    monkeypatch.setattr(mail.settings, "admin_email", "admin@test.com")

    calls = []
    monkeypatch.setattr(mail, "send_email",
                        lambda **kw: calls.append(kw) or True)
    ok = mail.notify_contact_admin(name="Ana", email="ana@x.com",
                                   phone="123", message="Hola", msg_id=7)
    assert ok is True
    assert calls[0]["to"] == ["admin@test.com"]
    assert "#7" in calls[0]["subject"]


def test_notify_contact_a_multiples_admins(monkeypatch):
    from app.core import email as mail

    calls = []
    monkeypatch.setattr(mail, "send_email",
                        lambda **kw: calls.append(kw) or True)
    ok = mail.notify_contact_admin(name="Ana", email="ana@x.com", phone="123",
                                   message="Hola", msg_id=8,
                                   admin_emails=["a@test.com", "B@test.com", "a@test.com"])
    assert ok is True
    assert calls[0]["to"] == ["a@test.com", "B@test.com"]


def test_get_admin_emails_solo_activos_con_rol_admin():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    from app.core.email import get_admin_emails
    from app.infrastructure.db.base import Base, UserStatus
    import app.infrastructure.models.rbac as rbac

    engine = create_engine("sqlite:///:memory:")
    # Solo tablas RBAC del flujo (designs usa ARRAY de Postgres, sin soporte sqlite).
    rbac.Role.__table__.create(engine)
    rbac.User.__table__.create(engine)
    rbac.UserRole.__table__.create(engine)
    Session = sessionmaker(bind=engine)
    db = Session()
    try:
        role_admin = rbac.Role(name="ADMIN", description="x", is_system=True)
        db.add(role_admin)
        db.flush()
        u1 = rbac.User(username="adm1", email="ADM1@test.com", full_name="A1",
                       password_hash="x", status=UserStatus.ACTIVE)
        u2 = rbac.User(username="adm2", email="adm2@test.com", full_name="A2",
                       password_hash="x", status=UserStatus.BLOCKED)
        u3 = rbac.User(username="otro", email="otro@test.com", full_name="O",
                       password_hash="x", status=UserStatus.ACTIVE)
        db.add_all([u1, u2, u3])
        db.flush()
        db.add(rbac.UserRole(user_id=u1.id, role_id=role_admin.id))
        db.add(rbac.UserRole(user_id=u2.id, role_id=role_admin.id))
        db.commit()
        mails = get_admin_emails(db)
        assert mails == ["adm1@test.com"]
    finally:
        db.close()


def test_notify_giftcard_y_review_no_lanzan(monkeypatch):
    from app.core import email as mail

    monkeypatch.setattr(mail.settings, "email_provider", "resend")
    monkeypatch.setattr(mail.settings, "resend_api_key", "")
    # Sin key debe retornar False, nunca lanzar
    assert mail.notify_giftcard_redeemed(code="NS-GC-AAA", amount=100,
                                        buyer="B", recipient=None,
                                        used_at="hoy", actor="admin") is False
    assert mail.notify_review_approved(author="Ana", rating=5,
                                       text="Lindo", post_id=1) is False


def test_send_email_por_smtp_con_mock(monkeypatch):
    import smtplib

    from app.core import email as mail

    sent = {}

    class _FakeSMTP:
        def __init__(self, *a, **k):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

        def starttls(self):
            sent["tls"] = True

        def login(self, user, password):
            sent["login"] = (user, bool(password))

        def send_message(self, msg):
            sent["to"] = msg["To"]
            sent["subject"] = msg["Subject"]
            sent["cid"] = "cid:nails-logo" in msg.get_body(("html",)).get_content()

    monkeypatch.setattr(smtplib, "SMTP", _FakeSMTP)
    monkeypatch.setattr(mail.settings, "email_provider", "smtp")
    monkeypatch.setattr(mail.settings, "smtp_user", "nails@gmail.com")
    monkeypatch.setattr(mail.settings, "smtp_password", "xxxx-app-pass")
    monkeypatch.setattr(mail.settings, "smtp_server", "smtp.gmail.com")
    monkeypatch.setattr(mail.settings, "smtp_from", "Nails Studio <nails@gmail.com>")
    html = mail.base_template(title="t", heading="h", intro="i", rows=[("A", "B")])
    assert mail.send_email(to=["a@x.com", "b@x.com"], subject="Hola", html=html) is True
    assert sent["to"] == "a@x.com, b@x.com"
    assert sent["tls"] is True
    assert sent["cid"] is True


def test_send_email_smtp_sin_config_retorna_false(monkeypatch):
    from app.core import email as mail

    monkeypatch.setattr(mail.settings, "email_provider", "smtp")
    monkeypatch.setattr(mail.settings, "smtp_user", "")
    monkeypatch.setattr(mail.settings, "smtp_password", "")
    monkeypatch.setattr(mail.settings, "smtp_server", "")
    assert mail.send_email(to="a@x.com", subject="x", html="<p>x</p>") is False
