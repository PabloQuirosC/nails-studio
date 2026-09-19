"""Bcrypt + JWT (PyJWT). Corrige lo visto en dulce: política 8–72 explícita."""
import bcrypt
import jwt

from app.core.config import settings

_BCRYPT_MAX = 72
_DUMMY_HASH = b"$2b$12$KIXxQG8b2a2mQvLg9Q0QQu8vLg9Q0QQu8vLg9Q0QQu8vLg9Q0QQu"


def validate_password_policy(password: str) -> None:
    if not 8 <= len(password.encode("utf-8")) <= _BCRYPT_MAX:
        raise ValueError("La contraseña debe tener entre 8 y 72 caracteres")


def hash_password(password: str) -> str:
    validate_password_policy(password)
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        if not hashed.startswith("$2"):
            return False
        return bcrypt.checkpw(plain.encode("utf-8")[:_BCRYPT_MAX], hashed.encode())
    except (ValueError, TypeError):
        return False


def dummy_verify() -> None:
    """Trabajo constante cuando el usuario no existe (anti-enumeración, CWE-208)."""
    try:
        bcrypt.checkpw(b"no-existe", _DUMMY_HASH)
    except ValueError:
        pass
