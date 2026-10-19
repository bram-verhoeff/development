"""Routes rond de ingelogde gebruiker en de allowlist."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr

from app.auth import CurrentUser, get_current_user, is_email_allowed
from app.config import Settings, get_settings

router = APIRouter(tags=["auth"])


class MeOut(BaseModel):
    id: str
    email: str


class EmailCheckIn(BaseModel):
    email: EmailStr


class EmailCheckOut(BaseModel):
    allowed: bool


@router.get("/me", response_model=MeOut)
def me(user: CurrentUser = Depends(get_current_user)) -> MeOut:
    return MeOut(id=str(user.id), email=user.email)


@router.post("/auth/allowed", response_model=EmailCheckOut)
def email_allowed(payload: EmailCheckIn, settings: Settings = Depends(get_settings)) -> EmailCheckOut:
    """Wordt vóór registratie aangeroepen, zodat alleen genodigden een account aanmaken."""
    return EmailCheckOut(allowed=is_email_allowed(payload.email, settings))
