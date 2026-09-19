# Nails Studio · Backend (RBAC)

FastAPI + SQLAlchemy 2.x + PostgreSQL (Supabase pooler) + JWT access corto + refresh rotativo.
Guía: login/usuarios/roles/permisos portados de `dulce_encantocr`, con lo malo corregido y sin tocar ese proyecto.

## Estructura (Hexagonal)

```
app/
  main.py                    # Presentation: app, CORS, handlers, routers
  core/                      # config (fail-closed), security (bcrypt 8–72), tokens, rate_limit, exceptions
  domain/ports.py            # contratos
  application/               # auth_service (login/refresh/logout), rbac_service (users/roles)
  infrastructure/
    db/ (base, session)      # Base, engine pooler + sslmode, get_db
    models/rbac.py           # modules, permissions, roles, role_permissions, users, user_roles, refresh_tokens
    repositories/rbac_repo.py# permission_codes_for_user (1 query, sin N+1)
    seed.py                  # seed idempotente (admin vía .env, nunca CLI)
  presentation/
    deps.py                  # get_current_user ÚNICO (cookie httpOnly → Bearer), require_role/permission
    schemas.py               # Pydantic v2
    routers/ (auth, users, roles)
```

## Corregido respecto a dulce_encantocr

| # | Dulce (solo lectura) | Nails (corrección) |
|---|---|---|
| 1 | Sin refresh: logout solo borra cookie, Bearer sigue válido | `refresh_tokens` con hash SHA-256 + rotación + revocación en logout |
| 2 | `get_current_user` duplicado | Una sola función en `deps.py` |
| 3 | `UsuarioUpdate.estado: str` libre | `UserStatus` Enum validado por Pydantic |
| 4 | Truncado bcrypt silencioso (>72B) | Política explícita 8–72, `ValueError` si excede |
| 5 | Seed `--password` (queda en historial shell) | Admin vía `ADMIN_*` del `.env` |
| 6 | Access 60 min con permisos embebidos | Access 15 min + refresh 7 días |

## Puesta en marcha

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # rellenar (SECRET_KEY ≥ 32, DATABASE_URL pooler 6543)
python -m app.infrastructure.seed   # crea módulos, permisos, rol ADMIN y admin
uvicorn app.main:app --reload --port 8000
```

Endpoints: `POST /api/v1/auth/login|refresh|logout`, `GET /api/v1/auth/me`,
`GET /api/v1/auth/audits` (ADMIN), `CRUD /api/v1/usuarios` (paginado `{items,total}`
+ filtros `?q=&status=&role=`), `CRUD /api/v1/roles`, `GET /api/v1/permisos|modulos`,
`CRUD /api/v1/giftcards` (código único en servidor, canje `PUT /{code}`).

## Mejoras futuras aplicadas (2026-09-18)

1. **Alembic**: `alembic.ini` + `alembic/env.py` (URL del `.env`) + `versions/0001_init.py`
   con las 9 tablas. Uso: `alembic upgrade head` (requiere `DATABASE_URL` con red).
2. **Paginación en servidor**: `GET /usuarios` y `GET /giftcards` devuelven
   `{items, total}`; usuarios además filtra por `role` (nombre, case-insensitive).
   `UserOut` incluye `roles[]` (página de 6 → sin N+1).
3. **Throttle Redis**: `REDIS_URL` puesta → contador compartido con TTL 60 s;
   sin Redis → fallback en memoria con warning en log (fail-open si Redis cae).
4. **Auditoría**: tabla `login_audits` (usuario, éxito, IP, user-agent) escrita en
   cada `POST /login` en modo best-effort; lectura en `GET /auth/audits`.
5. **Frontend conectado**: `src/features/admin/rbac-api.ts` (TanStack Query +
   mutaciones con invalidación `['admin', …]`, fallback a mocks si no hay red) y
   botones con `<Can code="…">` (`usuarios.create/update/delete`,
   `giftcards.create/update/delete`). Claves de permiso = códigos del backend.
