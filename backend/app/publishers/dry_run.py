"""Publisher die niets echt plaatst: voor tests en om de scheduler te proberen zonder platformkoppeling."""

import uuid

from app.models import Platform, Post
from app.publishers.base import ConnectedAccount, PublishResult, Publisher


class DryRunPublisher(Publisher):
    def __init__(self, platform: Platform):
        self.platform = platform
        self.published: list[tuple[int, str]] = []  # (post_id, tekst)

    def publish(self, post: Post, account: ConnectedAccount) -> PublishResult:
        problems = self.validate(post)
        if problems:
            return PublishResult(success=False, error=problems[0])
        self.published.append((post.id, self.render(post)))
        return PublishResult(success=True, external_id=f"dry-{uuid.uuid4().hex[:8]}")
