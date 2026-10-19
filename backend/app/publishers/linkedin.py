"""Publiceert een post op het LinkedIn-profiel van het gekoppelde account (Posts API)."""

import logging

import httpx

from app.config import Settings
from app.models import Platform, Post
from app.publishers.base import ConnectedAccount, PublishResult, Publisher
from app.services.social.linkedin import POSTS_URL, to_little_text

logger = logging.getLogger(__name__)


class LinkedInPublisher(Publisher):
    platform = Platform.LINKEDIN

    def __init__(self, settings: Settings, http: httpx.Client | None = None):
        self.api_version = settings.linkedin_api_version
        self.http = http or httpx.Client(timeout=30)

    def render(self, post: Post) -> str:
        return to_little_text(post.hook, post.body, post.hashtags)

    def publish(self, post: Post, account: ConnectedAccount) -> PublishResult:
        problems = self.validate(post)
        if problems:
            return PublishResult(success=False, error=problems[0])

        body = {
            "author": f"urn:li:person:{account.external_account_id}",
            "commentary": self.render(post),
            "visibility": "PUBLIC",
            "distribution": {"feedDistribution": "MAIN_FEED", "targetEntities": [], "thirdPartyDistributionChannels": []},
            "lifecycleState": "PUBLISHED",
            "isReshareDisabledByAuthor": False,
        }
        headers = {
            "Authorization": f"Bearer {account.access_token}",
            "LinkedIn-Version": self.api_version,
            "X-Restli-Protocol-Version": "2.0.0",
        }
        try:
            response = self.http.post(POSTS_URL, json=body, headers=headers)
        except httpx.HTTPError:
            return PublishResult(success=False, error="platform_unreachable", retryable=True)

        if response.status_code == 201:
            urn = response.headers.get("x-restli-id", "")
            url = f"https://www.linkedin.com/feed/update/{urn}/" if urn else None
            return PublishResult(success=True, external_id=urn or None, url=url)

        logger.warning("LinkedIn weigerde de post (%s): %.400s", response.status_code, response.text)
        if response.status_code == 401:
            return PublishResult(success=False, error="connection_expired")
        if response.status_code == 403:
            return PublishResult(success=False, error="publish_forbidden")
        if response.status_code == 426:
            # Verouderde LINKEDIN_API_VERSION
            return PublishResult(success=False, error="platform_version_outdated")
        if response.status_code == 429:
            return PublishResult(success=False, error="platform_rate_limited", retryable=True)
        if response.status_code >= 500:
            return PublishResult(success=False, error="platform_unavailable", retryable=True)
        return PublishResult(success=False, error="publish_rejected")
