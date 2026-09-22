"""Schemas del programa de referidos (contenido editable)."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReferralInfoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    title: str
    subtitle: str
    steps: list[str]
    updated_at: datetime


class ReferralInfoUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=120)
    subtitle: str | None = Field(default=None, max_length=300)
    steps: list[str] | None = Field(default=None, min_length=1, max_length=8)
