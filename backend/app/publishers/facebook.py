"""Publiceert een tekstpost op de gekoppelde Facebook-pagina (POST /{page-id}/feed)."""

import logging

import httpx

from app.config import Settings
from app.models import Platform, Post
from app.publishers.base import ConnectedAccount, PublishResult, Publisher
from app.services.social.meta import graph_url

logger = logging.getLogger(__name__)


class FacebookPublisher(Publisher):
    platform = Platform.FACEBOOK

    def __init__(self, settings: Settings, http: httpx.Client | None = None):
        self.base = graph_url(settings.meta_graph_version)
        self.http = http or httpx.Client(timeout=30)

    def publish(self, post: Post, account: ConnectedAccount) -> PublishResult:
        problems = self.validate(post)
        if problems:
            return PublishResult(success=False, error=problems[0])
        try:
            response = self.http.post(
                f"{self.base}/{account.external_account_id}/feed",
                data={"message": self.render(post), "access_token": account.access_token},
            )
        except httpx.HTTPError:
            return PublishResult(success=False, error="platform_unreachable", retryable=True)

        if response.status_code == 200:
            post_id = response.json()["id"]
            return PublishResult(success=True, external_id=post_id, url=f"https://www.facebook.com/{post_id}")

        logger.warning("Facebook weigerde de post (%s): %.400s", response.status_code, response.text)
        # Graph API: code 190 = ongeldig/verlopen token, 10/200-299 = ontbrekende rechten
        error_code = (response.json().get("error") or {}).get("code") if "json" in response.headers.get("content-type", "") else None
        if error_code == 190 or response.status_code == 401:
            return PublishResult(success=False, error="connection_expired")
        if error_code == 10 or (isinstance(error_code, int) and 200 <= error_code < 300) or response.status_code == 403:
            return PublishResult(success=False, error="publish_forbidden")
        if response.status_code == 429 or error_code in (4, 17, 32, 613):
            return PublishResult(success=False, error="platform_rate_limited", retryable=True)
        if response.status_code >= 500:
            return PublishResult(success=False, error="platform_unavailable", retryable=True)
        return PublishResult(success=False, error="publish_rejected")
