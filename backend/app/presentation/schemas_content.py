"""Schemas de Contenido (blog + testimonios)."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PostCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    kind: str = Field(default="articulo", max_length=20)
    excerpt: str | None = None
    body: str | None = None
    category: str = Field(default="General", max_length=60)
    image_url: str | None = Field(default=None, max_length=500)
    read_minutes: int = Field(default=4, ge=1, le=120)
    author: str | None = Field(default=None, max_length=200)
    rating: int | None = Field(default=None, ge=1, le=5)
    design_name: str | None = Field(default=None, max_length=150)
    published: bool = True


class TestimonioCreate(BaseModel):
    """Reseña pública: entra como pendiente de moderación."""
    author: str = Field(min_length=2, max_length=200)
    text: str = Field(min_length=10, max_length=2000)
    rating: int = Field(ge=1, le=5)
    design_name: str | None = Field(default=None, max_length=150)


class PostUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    kind: str | None = Field(default=None, max_length=20)
    excerpt: str | None = None
    body: str | None = None
    category: str | None = Field(default=None, max_length=60)
    image_url: str | None = Field(default=None, max_length=500)
    read_minutes: int | None = Field(default=None, ge=1, le=120)
    author: str | None = Field(default=None, max_length=200)
    rating: int | None = Field(default=None, ge=1, le=5)
    design_name: str | None = Field(default=None, max_length=150)
    published: bool | None = None


class PostOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    slug: str
    kind: str
    title: str
    excerpt: str | None = None
    body: str | None = None
    category: str
    image_url: str | None = None
    read_minutes: int
    author: str | None = None
    rating: int | None = None
    design_name: str | None = None
    published: bool
    created_at: datetime


class PostPage(BaseModel):
    items: list[PostOut]
    total: int


class CategoryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=60)


class CategoryUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=60)


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    slug: str
    created_at: datetime
