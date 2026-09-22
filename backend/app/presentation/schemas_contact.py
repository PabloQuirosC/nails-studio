"""Schemas de Contacto (buzón + datos del estudio)."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ContactMessageCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=40)
    message: str = Field(min_length=10, max_length=2000)


class ContactMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str
    phone: str | None = None
    message: str
    is_read: bool
    created_at: datetime


class ContactMessagePage(BaseModel):
    items: list[ContactMessageOut]
    total: int


class ContactMessageRead(BaseModel):
    is_read: bool


class ContactInfoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    address: str
    schedule: str
    whatsapp: str
    instagram: str
    updated_at: datetime


class ContactInfoUpdate(BaseModel):
    address: str | None = Field(default=None, max_length=300)
    schedule: str | None = Field(default=None, max_length=300)
    whatsapp: str | None = Field(default=None, max_length=40)
    instagram: str | None = Field(default=None, max_length=100)


class ContactSocialCreate(BaseModel):
    label: str = Field(min_length=2, max_length=60)
    url: str = Field(min_length=8, max_length=500)
    icon: str = Field(default="web", max_length=30)


class ContactSocialUpdate(BaseModel):
    label: str | None = Field(default=None, min_length=2, max_length=60)
    url: str | None = Field(default=None, min_length=8, max_length=500)
    icon: str | None = Field(default=None, max_length=30)


class ContactSocialOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    label: str
    url: str
    icon: str
    created_at: datetime
