"""Envío de correos transaccionales vía Resend (best-effort, nunca rompe el flujo).

Uso:
    from app.core import email as mail
    mail.send_email(to="admin@x.com", subject="...", html="<p>...</p>")

La API key vive en .env como RESEND_API_KEY (nunca hardcodeada).
Si falta la key o Resend falla, se loguea y se retorna False.
"""
from __future__ import annotations

import base64
import html as _html
import logging
from pathlib import Path

from app.core.config import settings

logger = logging.getLogger(__name__)

BRAND = {
    "name": "Nails Studio",
    "accent": "#c9a96e",  # dorado del panel
    "dark": "#1c1917",
    "muted": "#78716c",
    "bg": "#faf7f2",
}

LOGO_CID = "nails-logo"
_LOGO_CACHE: str | None = None


def _logo_b64() -> str | None:
    """Logo embebido (CID): se lee una vez del paquete, sin depender del frontend."""
    global _LOGO_CACHE
    try:
        if _LOGO_CACHE is None:
            data = (Path(__file__).resolve().parent / "assets" / "logo.jpg").read_bytes()
            if not data or len(data) > 300_000:
                _LOGO_CACHE = ""
            else:
                _LOGO_CACHE = base64.b64encode(data).decode("ascii")
    except Exception as exc:
        logger.warning("Logo para correos no disponible: %s", exc)
        return None
    return _LOGO_CACHE or None


def _esc(value: object | None) -> str:
    if value is None:
        return "—"
    text = str(value).strip()
    return _html.escape(text) if text else "—"


def _subj(text: str, maxlen: int = 120) -> str:
    """Asunto a una línea: corta CRLF/inyección de cabeceras y trunca."""
    one = " ".join(str(text).split())
    return one[:maxlen] or "Nails Studio"


def _safe_reply_to(addr: str | None) -> str | None:
    clean = (addr or "").strip()
    if not clean or any(c in clean for c in ("\r", "\n", " ", ",", ";")) or "@" not in clean:
        return None
    return clean[:254]


def base_template(*, title: str, heading: str, intro: str, rows: list[tuple[str, str]],
                  footer_note: str = "Este es un correo automático de Nails Studio, por favor no responder directamente.") -> str:
    """Plantilla HTML única (estilo DulceEncantoCR: tarjeta centrada, filas etiqueta/valor)."""
    row_html = "\n".join(
        f"""<tr>
          <td style="padding:10px 14px;color:{BRAND['muted']};font-size:13px;width:38%;vertical-align:top;">{_esc(label)}</td>
          <td style="padding:10px 14px;color:{BRAND['dark']};font-size:14px;">{value}</td>
        </tr>"""
        for label, value in rows
    )
    return f"""<!doctype html>
<html lang="es"><body style="margin:0;background:{BRAND['bg']};font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="text-align:center;padding:18px 0;">
    <div style="font-size:22px;font-weight:bold;color:{BRAND['dark']};"><img src="cid:{LOGO_CID}" alt="Nails Studio" width="44" height="44" style="border-radius:50%;vertical-align:middle;" />&nbsp;{BRAND['name']}</div>
    <div style="font-size:12px;color:{BRAND['muted']};">{_esc(title)}</div>
  </div>
  <div style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #eee5d5;">
    <div style="background:{BRAND['dark']};color:#fff;padding:20px 24px;">
      <div style="font-size:18px;font-weight:bold;">{_esc(heading)}</div>
      <div style="font-size:13px;opacity:.85;margin-top:4px;">{_esc(intro)}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;">{row_html}</table>
  </div>
  <p style="font-size:11px;color:{BRAND['muted']};text-align:center;margin-top:14px;">{_esc(footer_note)}</p>
</div></body></html>"""


def _client() -> tuple[bool, str]:
    key = (settings.resend_api_key or "").strip()
    sender = (settings.email_from or "").strip()
    if not key:
        logger.warning("RESEND_API_KEY ausente: correo omitido (subject pendiente)")
        return False, ""
    if not sender:
        logger.warning("EMAIL_FROM ausente: correo omitido")
        return False, ""
    return True, sender


def _smtp_configured() -> bool:
    return bool(
        (settings.smtp_user or "").strip()
        and (settings.smtp_password or "").strip()
        and (settings.smtp_server or "").strip()
    )


def _smtp_sender() -> str:
    return (settings.smtp_from or "").strip() or (settings.smtp_user or "").strip()


def _send_smtp(*, sender: str, dests: list[str], subject: str, html: str,
               reply_to: str | None = None) -> None:
    """SMTP (Gmail con App Password). Lanza excepción si falla."""
    import smtplib
    from email.message import EmailMessage
    from email.utils import formatdate, make_msgid

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = ", ".join(dests)
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(domain="gmail.com")
    if reply_to:
        msg["Reply-To"] = reply_to
    msg.set_content("Nails Studio: mira este correo en un cliente con soporte HTML.")
    msg.add_alternative(html, subtype="html")
    if f"cid:{LOGO_CID}" in html:
        logo = _logo_b64()
        if logo:
            import base64 as _b64

            msg.get_payload()[1].add_related(
                _b64.b64decode(logo), maintype="image", subtype="jpeg",
                cid=f"<{LOGO_CID}>", filename="logo.jpg",
            )
    server = (settings.smtp_server or "").strip()
    port = int(settings.smtp_port or 587)
    timeout = int(settings.smtp_timeout or 10)
    with smtplib.SMTP(server, port, timeout=timeout) as smtp:
        if settings.smtp_use_tls:
            smtp.starttls()
        smtp.login((settings.smtp_user or "").strip(),
                   (settings.smtp_password or "").strip().replace(" ", ""))
        smtp.send_message(msg)


def get_admin_emails(db) -> list[str]:
    """Emails de todos los usuarios ADMIN activos. Nunca lanza (retorna [])."""
    try:
        from sqlalchemy import func, select

        from app.infrastructure.db.base import UserStatus
        from app.infrastructure.models.rbac import Role, User, UserRole

        rows = db.execute(
            select(User.email)
            .join(UserRole, UserRole.user_id == User.id)
            .join(Role, Role.id == UserRole.role_id)
            .where(func.lower(Role.name) == "admin",
                   UserRole.active.is_(True),
                   User.status == UserStatus.ACTIVE)
        ).all()
        seen: list[str] = []
        for (addr,) in rows:
            clean = (addr or "").strip().lower()
            if clean and clean not in seen:
                seen.append(clean)
        return seen
    except Exception as exc:
        logger.warning("get_admin_emails falló (se usa fallback .env): %s", exc)
        return []


def _admin_dests(explicit: list[str] | None) -> list[str]:
    """Destinatarios admin: lista explícita (de BD) o fallback a ADMIN_EMAIL del .env."""
    if explicit:
        seen: list[str] = []
        for addr in explicit:
            clean = (addr or "").strip()
            if clean and clean.lower() not in [s.lower() for s in seen]:
                seen.append(clean)
        if seen:
            return seen
    fallback = (settings.admin_email or "").strip()
    return [fallback] if fallback else []


def send_email(*, to: str | list[str], subject: str, html: str, reply_to: str | None = None) -> bool:
    """Envía un correo. Retorna True si fue aceptado, False si se omitió/falló.

    Proveedor: EMAIL_PROVIDER=auto|smtp|resend. En auto se usa SMTP si está
    configurado (Gmail) y si no Resend.
    """
    dests = [to] if isinstance(to, str) else list(to)
    dests = [d.strip() for d in dests if d and d.strip()]
    if not dests:
        logger.warning("send_email sin destinatarios: subject=%s", subject)
        return False
    provider = (settings.email_provider or "auto").strip().lower()
    want_smtp = provider == "smtp" or (provider == "auto" and _smtp_configured())
    try:
        if want_smtp:
            if not _smtp_configured():
                logger.warning("EMAIL_PROVIDER=smtp pero falta SMTP_USER/PASSWORD/SERVER")
                return False
            sender = _smtp_sender()
            if not sender:
                logger.warning("SMTP_FROM/SMTP_USER ausente: correo omitido")
                return False
            _send_smtp(sender=sender, dests=dests, subject=subject, html=html, reply_to=reply_to)
            logger.info("Correo enviado vía SMTP: to=%s subject=%s", ",".join(dests), subject)
            return True
        ok, sender = _client()
        if not ok:
            return False
        import resend  # import local: tests sin red no requieren el paquete hasta enviar

        resend.api_key = settings.resend_api_key.strip()
        params: dict = {"from": sender, "to": dests, "subject": subject, "html": html}
        if reply_to:
            params["reply_to"] = reply_to
        logo = _logo_b64() if f"cid:{LOGO_CID}" in html else None
        if logo:
            params["attachments"] = [
                {"content": logo, "filename": "logo.jpg", "content_id": LOGO_CID}
            ]
        resend.Emails.send(params)  # type: ignore[arg-type]
        logger.info("Correo enviado vía Resend: to=%s subject=%s", ",".join(dests), subject)
        return True
    except Exception as exc:  # best-effort: el correo nunca tumba la request
        logger.warning("Envío falló (to=%s subject=%s): %s", ",".join(dests), subject, exc)
        return False


# ── Atajos por evento (todos devuelven bool, nunca lanzan) ──

def notify_contact_admin(*, name: str, email: str, phone: str | None, message: str, msg_id: int,
                         admin_emails: list[str] | None = None) -> bool:
    try:
        dests = _admin_dests(admin_emails)
        if not dests:
            return False
        html_body = base_template(
            title="Nuevo mensaje de contacto",
            heading="💌 Nuevo mensaje de contacto",
            intro=f"Mensaje #{msg_id} recibido desde la web. Respóndelo en menos de 24h.",
            rows=[
                ("Nombre", _esc(name)),
                ("Email", f"<a href='mailto:{_esc(email)}'>{_esc(email)}</a>"),
                ("Teléfono", _esc(phone)),
                ("Mensaje", _esc(message)),
            ],
        )
        return send_email(to=dests, subject=_subj(f"[Nails Studio] Contacto #{msg_id} — {name.strip()}"),
                          html=html_body, reply_to=_safe_reply_to(email))
    except Exception as exc:
        logger.warning("notify_contact_admin falló: %s", exc)
        return False


def notify_appointment_booked(*, admin_copy: bool = True, client_email: str | None,
                              name: str, phone: str, design: str | None,
                              starts_at: str, ends_at: str, notes: str | None,
                              appt_id: int, status: str = "pending",
                              admin_emails: list[str] | None = None) -> bool:
    try:
        rows = [
            ("Clienta", _esc(name)),
            ("Teléfono", _esc(phone)),
            ("Diseño", _esc(design)),
            ("Inicio", _esc(starts_at)),
            ("Fin", _esc(ends_at)),
            ("Notas", _esc(notes)),
            ("Estado", _esc(status)),
            ("Folio", _esc(appt_id)),
        ]
        html_body = base_template(
            title="Nueva cita agendada",
            heading="📅 Nueva cita agendada",
            intro=f"Cita #{appt_id} en estado {status}. Confírmala desde el panel.",
            rows=rows,
        )
        subject = _subj(f"[Nails Studio] Nueva cita #{appt_id} — {name.strip()} · {starts_at}", 140)
        sent = False
        if admin_copy:
            dests = _admin_dests(admin_emails)
            # En modo prueba Resend solo deja al dueño; el resto se intenta igual (best-effort).
            if dests:
                sent = send_email(to=dests, subject=subject,
                                  html=html_body, reply_to=_safe_reply_to(client_email)) or sent
        if client_email and client_email.strip():
            sent = send_email(to=client_email.strip(), subject=_subj(f"Nails Studio: recibimos tu cita #{appt_id}"),
                              html=html_body) or sent
        return sent
    except Exception as exc:
        logger.warning("notify_appointment_booked falló: %s", exc)
        return False


def notify_giftcard_redeemed(*, code: str, amount: int, buyer: str, recipient: str | None,
                             used_at: str, actor: str | None,
                             admin_emails: list[str] | None = None) -> bool:
    try:
        dests = _admin_dests(admin_emails)
        if not dests:
            return False
        html_body = base_template(
            title="Gift card canjeada",
            heading="🎁 Gift card canjeada",
            intro=f"La gift card {code} se marcó como canjeada.",
            rows=[
                ("Código", _esc(code)),
                ("Monto", f"₡{_esc(amount)}"),
                ("Comprador", _esc(buyer)),
                ("Destinataria", _esc(recipient)),
                ("Canjeada el", _esc(used_at)),
                ("Marcada por", _esc(actor)),
            ],
        )
        return send_email(to=dests, subject=_subj(f"[Nails Studio] Gift card canjeada {code}"), html=html_body)
    except Exception as exc:
        logger.warning("notify_giftcard_redeemed falló: %s", exc)
        return False


def notify_review_received(*, author: str, rating: int, text: str, post_id: int,
                           admin_emails: list[str] | None = None) -> bool:
    try:
        dests = _admin_dests(admin_emails)
        if not dests:
            return False
        html_body = base_template(
            title="Nueva reseña pendiente",
            heading="⭐ Nueva reseña por moderar",
            intro=f"Reseña #{post_id} pendiente de aprobación.",
            rows=[
                ("Autora", _esc(author)),
                ("Calificación", f"{'★' * max(0, min(5, rating))} ({_esc(rating)}/5)"),
                ("Texto", _esc(text)),
            ],
        )
        return send_email(to=dests, subject=_subj(f"[Nails Studio] Reseña pendiente #{post_id} — {author.strip()}"),
                          html=html_body)
    except Exception as exc:
        logger.warning("notify_review_received falló: %s", exc)
        return False


def notify_review_approved(*, author: str, rating: int, text: str, post_id: int,
                           admin_emails: list[str] | None = None) -> bool:
    try:
        dests = _admin_dests(admin_emails)
        if not dests:
            return False
        html_body = base_template(
            title="Reseña aprobada",
            heading="✅ Reseña aprobada y publicada",
            intro=f"La reseña #{post_id} ya es visible en la web.",
            rows=[
                ("Autora", _esc(author)),
                ("Calificación", _esc(f"{rating}/5")),
                ("Texto", _esc(text)),
            ],
        )
        return send_email(to=dests, subject=_subj(f"[Nails Studio] Reseña aprobada #{post_id}"), html=html_body)
    except Exception as exc:
        logger.warning("notify_review_approved falló: %s", exc)
        return False


def notify_user_created(*, username: str, email: str, full_name: str,
                        admin_emails: list[str] | None = None) -> bool:
    try:
        dest = email.strip()
        if not dest:
            return False
        login_url = (settings.frontend_origin or "").strip().rstrip("/") + "/admin"
        html_body = base_template(
            title="Cuenta creada",
            heading="👋 Tu cuenta en Nails Studio",
            intro="Un administrador creó tu acceso al panel. Inicia sesión con tu usuario.",
            rows=[
                ("Nombre", _esc(full_name)),
                ("Usuario", _esc(username)),
                ("Acceso", f"<a href='{_esc(login_url)}'>{_esc(login_url)}</a>"),
            ],
            footer_note="Si no reconnaissez esta cuenta, avisa al administrador. Nunca compartimos contraseñas por correo.",
        )
        ok_user = send_email(to=dest, subject="Nails Studio: tu cuenta fue creada", html=html_body)
        dests = [a for a in _admin_dests(admin_emails) if a.lower() != dest.lower()]
        ok_admin = True
        if dests:
            ok_admin = send_email(to=dests,
                                  subject=_subj(f"[Nails Studio] Usuario creado: {username.strip()}"),
                                  html=base_template(
                                      title="Usuario creado",
                                      heading="🧑‍💼 Usuario creado",
                                      intro="Se dio de alta un nuevo acceso al panel.",
                                      rows=[("Usuario", _esc(username)), ("Email", _esc(email)),
                                            ("Nombre", _esc(full_name))],
                                  ))
        return bool(ok_user or ok_admin)
    except Exception as exc:
        logger.warning("notify_user_created falló: %s", exc)
        return False
