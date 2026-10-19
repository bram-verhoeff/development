"""Pydantic-schema's voor in- en uitvoer van de API."""

import re
from datetime import datetime
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, HttpUrl, StringConstraints, field_validator

HEX_COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")


def _clean_list(values: list[str]) -> list[str]:
    """Spaties weg, lege items weg, dubbele weg (hoofdletterongevoelig, volgorde blijft)."""
    result, seen = [], set()
    for value in (v.strip() for v in values):
        if value and value.lower() not in seen:
            seen.add(value.lower())
            result.append(value)
    return result


CleanList = Annotated[list[Annotated[str, Field(max_length=300)]], Field(max_length=30), AfterValidator(_clean_list)]


class BrandIn(BaseModel):
    """Velden die je bij aanmaken en bewerken van een merk invult."""

    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
    website_url: HttpUrl | None = None
    target_audience: Annotated[str, StringConstraints(strip_whitespace=True, max_length=4000)] = ""
    tone_of_voice: Annotated[str, StringConstraints(strip_whitespace=True, max_length=4000)] = ""
    usps: CleanList = []
    colors: CleanList = []
    avoid_terms: CleanList = []
    content_language: Literal["nl", "en"] = "nl"

    @field_validator("colors")
    @classmethod
    def _hex_colors(cls, colors: list[str]) -> list[str]:
        for color in colors:
            if not HEX_COLOR.match(color):
                raise ValueError(f"Geen geldige kleur (verwacht #RRGGBB): {color}")
        return [c.upper() for c in colors]


class BrandOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    website_url: str | None
    target_audience: str
    tone_of_voice: str
    usps: list[str]
    colors: list[str]
    avoid_terms: list[str]
    content_language: str
    logo_url: str | None
    created_at: datetime
    updated_at: datetime
