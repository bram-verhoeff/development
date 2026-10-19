"""Welke publisher hoort bij welk platform."""

from app.config import Settings
from app.models import Platform
from app.publishers.base import Publisher

_publishers: dict[Platform, Publisher] = {}


class PublisherNotAvailable(Exception):
    pass


def register(publisher: Publisher) -> None:
    _publishers[publisher.platform] = publisher


def get_publisher(platform: Platform | str) -> Publisher:
    try:
        return _publishers[Platform(platform)]
    except (KeyError, ValueError):
        raise PublisherNotAvailable(f"Nog geen publisher voor platform: {platform}")


def available_platforms() -> list[Platform]:
    return list(_publishers)


def register_defaults(settings: Settings) -> None:
    """Registreert de echte publishers. Nieuwe platforms komen hier bij."""
    from app.publishers.linkedin import LinkedInPublisher

    register(LinkedInPublisher(settings))
