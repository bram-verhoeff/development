"""Publiceert een post op X via de v2 API (POST /2/tweets)."""

import logging

import httpx

from app.models import Platform, Post
from app.publishers.base import ConnectedAccount, PublishResult, Publisher
from app.services.social.x import TWEETS_URL

logger = logging.getLogger(__name__)


class XPublisher(Publisher):
    platform = Platform.X

    def __init__(self, http: httpx.Client | None = None):
        self.http = http or httpx.Client(timeout=30)

    def publish(self, post: Post, account: ConnectedAccount) -> PublishResult:
        problems = self.validate(post)
        if problems:
            return PublishResult(success=False, error=problems[0])
        try:
            response = self.http.post(TWEETS_URL, json={"text": self.render(post)}, headers={"Authorization": f"Bearer {account.access_token}"})
        except httpx.HTTPError:
            return PublishResult(success=False, error="platform_unreachable", retryable=True)

        if response.status_code == 201:
            tweet_id = response.json()["data"]["id"]
            return PublishResult(success=True, external_id=tweet_id, url=f"https://x.com/i/web/status/{tweet_id}")

        logger.warning("X weigerde de post (%s): %.400s", response.status_code, response.text)
        if response.status_code == 401:
            return PublishResult(success=False, error="connection_expired")
        if response.status_code == 402:
            # X rekent per gebruik; zonder tegoed kan er niet gepost worden
            return PublishResult(success=False, error="platform_payment_required")
        if response.status_code == 403:
            return PublishResult(success=False, error="publish_forbidden")
        if response.status_code == 429:
            return PublishResult(success=False, error="platform_rate_limited", retryable=True)
        if response.status_code >= 500:
            return PublishResult(success=False, error="platform_unavailable", retryable=True)
        return PublishResult(success=False, error="publish_rejected")
