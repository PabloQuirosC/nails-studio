"""Configuración central. Fail-closed en producción (sin secretos por defecto)."""
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "nails-studio"
    env: str = "local"

    database_url: str = ""
    direct_url: str = ""

    secret_key: str = ""
    jwt_alg: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    redis_url: str = ""

    frontend_origin: str = "http://127.0.0.1:5173"
    allowed_origins: str = "http://127.0.0.1:5173"

    smtp_user: str = ""
    smtp_password: str = ""
    smtp_server: str = ""
    smtp_port: int = 587
    smtp_from: str = ""
    smtp_use_tls: bool = True
    smtp_timeout: int = 10

    admin_username: str = "admin"
    admin_email: str = "admin@nailsstudio.com"
    admin_password: str = ""

    @model_validator(mode="after")
    def _fail_closed(self) -> "Settings":
        if self.env.lower() in {"production", "prod"}:
            if not self.secret_key or len(self.secret_key) < 32:
                raise ValueError("SECRET_KEY debe tener >= 32 caracteres en producción")
            if not self.database_url:
                raise ValueError("DATABASE_URL es obligatoria en producción")
            if "*" in self.cors_origins:
                raise ValueError("CORS con '*' es incompatible con credenciales en producción")
        return self

    @property
    def cors_origins(self) -> list[str]:
        raw = f"{self.frontend_origin},{self.allowed_origins}"
        seen: list[str] = []
        for part in raw.split(","):
            origin = part.strip().rstrip("/")
            if origin and origin not in seen:
                seen.append(origin)
        return seen

    @property
    def is_prod(self) -> bool:
        return self.env.lower() in {"production", "prod"}


settings = Settings()
