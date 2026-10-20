"""Voor platforms die alleen posts met afbeelding of video accepteren (Instagram, TikTok).

Zolang PostPilot nog geen media ondersteunt, meldt deze publisher dat netjes in plaats van een API-fout.
"""

from app.models import Platform, Post
from app.publishers.base import ConnectedAccount, PublishResult, Publisher


class MediaRequiredPublisher(Publisher):
    def __init__(self, platform: Platform):
        self.platform = platform

    def publish(self, post: Post, account: ConnectedAccount) -> PublishResult:
        return PublishResult(success=False, error="media_required")
