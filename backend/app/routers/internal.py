"""Interne endpoints voor de hosting, zoals de scheduler. Beveiligd met CRON_SECRET, niet met een login."""

import hmac

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.database import get_db
from app.services import scheduler

router = APIRouter(prefix="/internal", tags=["internal"], include_in_schema=False)


def _check_secret(settings: Settings, x_cron_secret: str | None, authorization: str | None) -> None:
    if not settings.cron_secret:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "scheduler_not_configured")
    # Eigen cronjob: header X-Cron-Secret. Vercel Cron: "Authorization: Bearer <CRON_SECRET>".
    given = x_cron_secret or (authorization or "").removeprefix("Bearer ").strip()
    if not hmac.compare_digest(given.encode(), settings.cron_secret.encode()):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid_cron_secret")


@router.api_route("/run-scheduler", methods=["GET", "POST"])
def run_scheduler(
    x_cron_secret: str | None = Header(default=None),
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict[str, list[int]]:
    """Plaatst alle posts waarvan de geplande tijd voorbij is. Bedoeld voor een cronjob, elke minuut."""
    _check_secret(settings, x_cron_secret, authorization)
    summary = scheduler.run_due(db, settings)
    return {"published": summary.published, "retrying": summary.retrying, "failed": summary.failed}
