"""Beelden en video's maken bij een post met Google (Gemini Image en Veo), via dezelfde Gemini-sleutel.

Beelden komen in één aanroep terug. Video's zijn een langlopende taak: `start_video` geeft een taaknaam,
en `check_video` vraagt later op of hij klaar is (zo blijft elke API-aanroep kort, ook op serverless hosting).
"""

import logging
from dataclasses import dataclass
from typing import Protocol

import httpx
from fastapi import Depends
from google.genai import errors, types

from app.config import Settings, get_settings
from app.models import Brand, MediaKind, Platform, Post
from app.services.ai import prompts
from app.services.ai.gemini import _client, map_client_error
from app.services.ai.writer import AIError

logger = logging.getLogger(__name__)

# Beeldverhouding per platform; Veo kent alleen staand (9:16) en liggend (16:9)
IMAGE_RATIO = {
    Platform.INSTAGRAM: "4:5",
    Platform.LINKEDIN: "1:1",
    Platform.TIKTOK: "9:16",
    Platform.X: "16:9",
    Platform.FACEBOOK: "1:1",
}
VIDEO_RATIO = {Platform.INSTAGRAM: "9:16", Platform.TIKTOK: "9:16"}


def aspect_ratio(kind: MediaKind, platform: Platform) -> str:
    return IMAGE_RATIO[platform] if kind == MediaKind.IMAGE else VIDEO_RATIO.get(platform, "16:9")


def media_prompt(kind: MediaKind, brand: Brand, post: Post, instructions: str | None, settings: Settings) -> str:
    platform = Platform(post.platform)
    post_text = f"{post.hook}\n{post.body}".strip()
    return prompts.render(
        prompts.load_prompt("image" if kind == MediaKind.IMAGE else "video"),
        platform=platform.value,
        brand_name=brand.name,
        audience=brand.target_audience or "a broad audience",
        tone=brand.tone_of_voice or "friendly and modern",
        colors=", ".join(brand.colors) or "a tasteful palette of your choice",
        post=post_text[:1500],
        instructions_block=f"Extra instructions from the user: {instructions}" if instructions else "",
        aspect_ratio=aspect_ratio(kind, platform),
        duration=settings.video_duration_seconds,
    )


@dataclass(frozen=True)
class GeneratedFile:
    data: bytes
    mime_type: str


@dataclass(frozen=True)
class VideoStatus:
    done: bool
    file: GeneratedFile | None = None
    error: str | None = None


class MediaGenerator(Protocol):
    image_model: str
    video_model: str

    def generate_image(self, prompt: str, ratio: str) -> GeneratedFile: ...

    def start_video(self, prompt: str, ratio: str) -> str: ...

    def check_video(self, operation_name: str) -> VideoStatus: ...


class GeminiMedia:
    def __init__(self, settings: Settings):
        if not settings.gemini_api_key:
            raise AIError("ai_not_configured", status=503)
        self.client = _client(settings.gemini_api_key)
        self.image_model = settings.gemini_image_model
        self.video_model = settings.gemini_video_model
        self.duration = settings.video_duration_seconds

    def _call(self, fn, *args, **kwargs):
        try:
            return fn(*args, **kwargs)
        except errors.ClientError as e:
            raise map_client_error(e)
        except errors.ServerError as e:
            logger.error("Google-mediafout %s: %s", e.code, e.message)
            raise AIError("ai_unavailable", status=503)
        except (httpx.HTTPError, TimeoutError, ConnectionError):
            raise AIError("ai_unavailable", status=503)

    def generate_image(self, prompt, ratio):
        response = self._call(
            self.client.models.generate_content,
            model=self.image_model,
            contents=prompt,
            config=types.GenerateContentConfig(response_modalities=["IMAGE"], image_config=types.ImageConfig(aspect_ratio=ratio)),
        )
        if response.prompt_feedback and response.prompt_feedback.block_reason:
            raise AIError("ai_refused", status=422)
        for part in response.parts or []:
            if part.inline_data and part.inline_data.data:
                return GeneratedFile(part.inline_data.data, part.inline_data.mime_type or "image/png")
        # Geen beeld terug: meestal door het veiligheidsfilter
        raise AIError("ai_refused", status=422)

    def start_video(self, prompt, ratio):
        operation = self._call(
            self.client.models.generate_videos,
            model=self.video_model,
            source=types.GenerateVideosSource(prompt=prompt),
            config=types.GenerateVideosConfig(number_of_videos=1, aspect_ratio=ratio, duration_seconds=self.duration),
        )
        return operation.name

    def check_video(self, operation_name):
        operation = self._call(self.client.operations.get, types.GenerateVideosOperation(name=operation_name))
        if not operation.done:
            return VideoStatus(done=False)
        if operation.error:
            logger.warning("Veo-taak mislukt: %s", operation.error)
            return VideoStatus(done=True, error="ai_refused" if "safety" in str(operation.error).lower() else "media_failed")
        videos = (operation.response.generated_videos if operation.response else None) or []
        if not videos:
            # Taak klaar maar geen video: gefilterd
            return VideoStatus(done=True, error="ai_refused")
        data = self._call(self.client.files.download, file=videos[0].video)
        return VideoStatus(done=True, file=GeneratedFile(data, videos[0].video.mime_type or "video/mp4"))


def get_media_generator(settings: Settings = Depends(get_settings)) -> MediaGenerator:
    """FastAPI-dependency; tests vervangen dit door een nep-generator."""
    return GeminiMedia(settings)

