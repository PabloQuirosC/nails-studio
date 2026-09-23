"""Schemas Pydantic v2 (validación en borde; corrige estado:str libre de dulce)."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.infrastructure.db.base import PermissionType, UserStatus


class LoginIn(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=1, max_length=72)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class MeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    email: str
    full_name: str
    status: UserStatus
    roles: list[str] = []
    permissions: list[str] = []


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=200)
    password: str = Field(min_length=8, max_length=72)


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = Field(default=None, min_length=1, max_length=200)
    status: UserStatus | None = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    email: str
    full_name: str
    status: UserStatus
    roles: list[str] = []
    last_login: datetime | None = None


class PasswordUpdate(BaseModel):
    password: str = Field(min_length=8, max_length=72)


class RoleAssign(BaseModel):
    role_id: int


class RoleCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=500)


class RoleUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    active: bool | None = None


class RoleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: str | None = None
    active: bool
    is_system: bool


class PermissionAssign(BaseModel):
    permission_id: int


class PermissionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    module_id: int
    name: str
    code: str
    type: PermissionType
    active: bool


class ModuleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    code: str
    name: str
    active: bool


class Message(BaseModel):
    detail: str


class LoginAuditOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int | None = None
    username: str
    success: bool
    ip: str | None = None
    created_at: object


class LoginAuditPage(BaseModel):
    items: list[LoginAuditOut]
    total: int


class UserPage(BaseModel):
    items: list[UserOut]
    total: int


class GiftCardCreate(BaseModel):
    amount: int = Field(gt=0, le=100000)
    buyer: str = Field(min_length=1, max_length=200)
    recipient: str | None = Field(default=None, max_length=200)


class GiftCardUsed(BaseModel):
    """Update parcial: canje y/o datos (monto, comprador, destinataria)."""
    used: bool | None = None
    amount: int | None = Field(default=None, gt=0, le=100000)
    buyer: str | None = Field(default=None, min_length=1, max_length=200)
    recipient: str | None = Field(default=None, max_length=200)


class GiftCardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    code: str
    amount: int
    buyer: str
    recipient: str | None = None
    used: bool
    source: str = "manual"
    client_id: int | None = None


class GiftCardAuditOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    code: str
    actor_username: str | None = None
    field: str
    old_value: str | None = None
    new_value: str | None = None
    created_at: datetime


class ActivityItemOut(BaseModel):
    kind: str
    text: str
    actor: str | None = None
    created_at: datetime | None = None


class GiftCardPage(BaseModel):
    items: list[GiftCardOut]
    total: int
