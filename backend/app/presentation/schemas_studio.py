"""Schemas Pydantic v2 del estudio (catálogo, agenda, clientas)."""
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


# ── Categorías ──
class CategoryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    icon: str = Field(default="sparkles", max_length=16)
    color: str = Field(default="#c9a96e", max_length=16)
    description: str | None = None


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    icon: str | None = Field(default=None, max_length=16)
    color: str | None = Field(default=None, max_length=16)
    description: str | None = None
    active: bool | None = None


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    slug: str
    name: str
    icon: str
    color: str
    description: str | None = None
    active: bool
    design_count: int = 0


# ── Diseños ──
class DesignCreate(BaseModel):
    category_id: int
    name: str = Field(min_length=2, max_length=150)
    price: int = Field(ge=1, le=100000)
    duration_min: int = Field(default=60, ge=15, le=300)
    image_url: str | None = Field(default=None, max_length=500)
    description: str | None = None
    technique: str | None = Field(default=None, max_length=300)
    tags: list[str] = Field(default_factory=list, max_length=12)
    occasion: str | None = Field(default=None, max_length=60)
    complexity: str | None = Field(default=None, max_length=60)


class DesignUpdate(BaseModel):
    category_id: int | None = None
    name: str | None = Field(default=None, min_length=2, max_length=150)
    price: int | None = Field(default=None, ge=1, le=100000)
    duration_min: int | None = Field(default=None, ge=15, le=300)
    image_url: str | None = Field(default=None, max_length=500)
    description: str | None = None
    technique: str | None = Field(default=None, max_length=300)
    tags: list[str] | None = Field(default=None, max_length=12)
    occasion: str | None = Field(default=None, max_length=60)
    complexity: str | None = Field(default=None, max_length=60)
    active: bool | None = None


class DesignOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    category_id: int
    name: str
    price: int
    duration_min: int
    image_url: str | None = None
    description: str | None = None
    technique: str | None = None
    tags: list[str] = []
    occasion: str | None = None
    complexity: str | None = None
    active: bool


class DesignPage(BaseModel):
    items: list[DesignOut]
    total: int


# ── Citas ──
class AppointmentCreate(BaseModel):
    client_id: int
    design_id: int | None = None
    artist_name: str = Field(default="Fernanda", max_length=200)
    starts_at: datetime
    ends_at: datetime
    notes: str | None = None


class AppointmentStatus(BaseModel):
    status: str = Field(min_length=1, max_length=20)


class AppointmentReschedule(BaseModel):
    starts_at: datetime
    ends_at: datetime


class AppointmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    client_id: int
    design_id: int | None = None
    artist_name: str
    starts_at: datetime
    ends_at: datetime
    status: str
    notes: str | None = None


class AppointmentPage(BaseModel):
    items: list[AppointmentOut]
    total: int


# ── Clientas ──
class ClientCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    phone: str = Field(min_length=5, max_length=40)
    email: str | None = Field(default=None, max_length=255)
    birthdate: date | None = None
    notes: str | None = None


class ClientUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    phone: str | None = Field(default=None, min_length=5, max_length=40)
    email: str | None = Field(default=None, max_length=255)
    birthdate: date | None = None
    notes: str | None = None
    active: bool | None = None


class ClientPoints(BaseModel):
    delta: int = Field(ge=-1000, le=1000)
    reason: str = Field(default="", max_length=200)


class ClientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    phone: str
    email: str | None = None
    birthdate: date | None = None
    notes: str | None = None
    points: int
    visits: int
    last_visit: datetime | None = None
    active: bool


class ClientPage(BaseModel):
    items: list[ClientOut]
    total: int


class RewardsOut(BaseModel):
    client_id: int
    visits: int
    visits_to_reward: int
    progress_pct: int
    loyalty_cards: list[str] = []
