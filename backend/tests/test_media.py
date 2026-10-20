"""Afbeeldingen en video's bij posts: API-flow (nep-generator) en de Gemini/Veo-koppeling (nep-client)."""

import uuid
from types import SimpleNamespace

import pytest

from app.models import Brand, MediaKind, Platform, Post
from app.services.ai import media as media_module
from app.services.ai.media import GeminiMedia, GeneratedFile, VideoStatus, aspect_ratio, media_prompt
from app.services.ai.writer import AIError
from tests.conftest import FakeStorage
from tests.test_brands import BRAND, PNG


class FakeMedia:
    image_model = "img-model"
    video_model = "video-model"

    def __init__(self):
        self.image_calls: list[tuple[str, str]] = []
        self.video_calls: list[tuple[str, str]] = []
        self.video_status = VideoStatus(done=False)
        self.check_error: AIError | None = None

    def generate_image(self, prompt, ratio):
        self.image_calls.append((prompt, ratio))
        return GeneratedFile(PNG, "image/png")

    def start_video(self, prompt, ratio):
        self.video_calls.append((prompt, ratio))
        return "operations/abc123"

    def check_video(self, operation_name):
        assert operation_name == "operations/abc123"
        if self.check_error:
            raise self.check_error
        return self.video_status


@pytest.fixture
def media_gen(client):
    from app.main import app
    from app.services.ai.media import get_media_generator
    from app.services.storage import get_media_storage

    fake = FakeMedia()
    store = FakeStorage()
    app.dependency_overrides[get_media_generator] = lambda: fake
    app.dependency_overrides[get_media_storage] = lambda: store
    fake.storage = store
    return fake


@pytest.fixture
def owner(auth_headers):
    return auth_headers()


@pytest.fixture
def post(client, owner, writer):
    brand = client.post("/brands", json=BRAND, headers=owner).json()
    return client.post(
        "/generate", json={"brand_id": brand["id"], "platforms": ["instagram"], "posts_per_platform": 1}, headers=owner
    ).json()["posts"][0]


def test_generate_image(client, owner, post, media_gen):
    response = client.post(f"/posts/{post['id']}/media", json={"kind": "image", "instructions": "met koffiebonen"}, headers=owner)
    assert response.status_code == 201, response.text
    media = response.json()
    assert media["status"] == "ready" and media["kind"] == "image" and media["aspect_ratio"] == "4:5"
    assert media["url"].startswith(FakeStorage.prefix) and media["mime_type"] == "image/png"
    prompt, ratio = media_gen.image_calls[0]
    assert ratio == "4:5" and "met koffiebonen" in prompt and "#3B2A1A" in prompt and post["hook"] in prompt

    detail = client.get(f"/posts/{post['id']}", headers=owner).json()
    assert [m["id"] for m in detail["media"]] == [media["id"]]
    listed = client.get("/posts", headers=owner).json()[0]
    assert listed["thumbnail_url"] == media["url"] and listed["thumbnail_kind"] == "image"
    # Telt mee voor de daglimiet
    assert client.get("/dashboard", headers=owner).json()["generations_today"] == 2


def test_video_lifecycle(client, owner, post, media_gen):
    started = client.post(f"/posts/{post['id']}/media", json={"kind": "video"}, headers=owner).json()
    assert started["status"] == "pending" and started["url"] is None and started["aspect_ratio"] == "9:16"
    assert media_gen.video_calls[0][1] == "9:16"
    url = f"/posts/{post['id']}/media/{started['id']}"

    assert client.get(url, headers=owner).json()["status"] == "pending"  # nog bezig

    media_gen.check_error = AIError("ai_unavailable", status=503)  # tijdelijke storing: blijft pending
    assert client.get(url, headers=owner).json()["status"] == "pending"
    media_gen.check_error = None

    media_gen.video_status = VideoStatus(done=True, file=GeneratedFile(b"\x00\x00\x00\x18ftypmp42", "video/mp4"))
    ready = client.get(url, headers=owner).json()
    assert ready["status"] == "ready" and ready["url"].endswith(".mp4") and ready["mime_type"] == "video/mp4"
    assert list(media_gen.storage.files.values()) == [b"\x00\x00\x00\x18ftypmp42"]


def test_video_failure(client, owner, post, media_gen):
    started = client.post(f"/posts/{post['id']}/media", json={"kind": "video"}, headers=owner).json()
    media_gen.video_status = VideoStatus(done=True, error="ai_refused")
    failed = client.get(f"/posts/{post['id']}/media/{started['id']}", headers=owner).json()
    assert failed["status"] == "failed" and failed["error"] == "ai_refused"


def test_video_daily_limit(client, owner, post, media_gen, settings):
    settings.video_daily_limit = 1
    assert client.post(f"/posts/{post['id']}/media", json={"kind": "video"}, headers=owner).status_code == 201
    second = client.post(f"/posts/{post['id']}/media", json={"kind": "video"}, headers=owner)
    assert second.status_code == 429 and second.json()["detail"] == "video_limit_reached"


def test_delete_media_removes_file(client, owner, post, media_gen):
    media = client.post(f"/posts/{post['id']}/media", json={"kind": "image"}, headers=owner).json()
    assert client.delete(f"/posts/{post['id']}/media/{media['id']}", headers=owner).status_code == 204
    assert media_gen.storage.files == {}
    assert client.get(f"/posts/{post['id']}/media/{media['id']}", headers=owner).status_code == 404


def test_media_is_private(client, owner, post, media_gen, auth_headers):
    media = client.post(f"/posts/{post['id']}/media", json={"kind": "image"}, headers=owner).json()
    other = auth_headers(email="tweede@voorbeeld.nl")
    assert client.post(f"/posts/{post['id']}/media", json={"kind": "image"}, headers=other).status_code == 404
    assert client.get(f"/posts/{post['id']}/media/{media['id']}", headers=other).status_code == 404
    assert client.delete(f"/posts/{post['id']}/media/{media['id']}", headers=other).status_code == 404


def test_invalid_kind(client, owner, post, media_gen):
    assert client.post(f"/posts/{post['id']}/media", json={"kind": "gif"}, headers=owner).status_code == 422


# ---------- verhoudingen en prompts ----------


def test_aspect_ratios():
    assert aspect_ratio(MediaKind.IMAGE, Platform.INSTAGRAM) == "4:5"
    assert aspect_ratio(MediaKind.IMAGE, Platform.X) == "16:9"
    assert aspect_ratio(MediaKind.VIDEO, Platform.TIKTOK) == "9:16"
    assert aspect_ratio(MediaKind.VIDEO, Platform.LINKEDIN) == "16:9"  # Veo kent alleen 9:16 en 16:9


def test_media_prompt_has_no_text_rule_and_brand(settings):
    brand = Brand(user_id=uuid.uuid4(), name="De Boon", target_audience="Studenten", tone_of_voice="Warm", colors=["#3B2A1A"], usps=[], avoid_terms=[])
    post = Post(platform="linkedin", hook="Nieuwe vestiging", body="Vrijdag open")
    image = media_prompt(MediaKind.IMAGE, brand, post, None, settings)
    assert "Do NOT render any text" in image and "#3B2A1A" in image and "Nieuwe vestiging" in image and "{{" not in image
    video = media_prompt(MediaKind.VIDEO, brand, post, "slow motion", settings)
    assert f"{settings.video_duration_seconds}-second" in video and "slow motion" in video and "{{" not in video


# ---------- GeminiMedia met een nep-Google-client ----------


def gemini_media(settings, **models) -> GeminiMedia:
    gm = GeminiMedia(settings)
    gm.client = SimpleNamespace(**models)
    return gm


def test_gemini_image_returns_inline_data(settings):
    seen = {}

    def generate_content(**kwargs):
        seen.update(kwargs)
        part = SimpleNamespace(inline_data=SimpleNamespace(data=b"PNGDATA", mime_type="image/png"))
        return SimpleNamespace(prompt_feedback=None, parts=[SimpleNamespace(inline_data=None), part])

    gm = gemini_media(settings, models=SimpleNamespace(generate_content=generate_content))
    result = gm.generate_image("een kat", "4:5")
    assert result == GeneratedFile(b"PNGDATA", "image/png")
    assert seen["model"] == settings.gemini_image_model
    assert seen["config"].response_modalities == ["IMAGE"] and seen["config"].image_config.aspect_ratio == "4:5"


def test_gemini_image_without_image_is_refused(settings):
    gm = gemini_media(settings, models=SimpleNamespace(generate_content=lambda **_: SimpleNamespace(prompt_feedback=None, parts=[])))
    with pytest.raises(AIError) as exc:
        gm.generate_image("x", "1:1")
    assert exc.value.code == "ai_refused"


def test_gemini_video_start_and_check(settings):
    seen = {}

    def generate_videos(**kwargs):
        seen.update(kwargs)
        return SimpleNamespace(name="operations/xyz")

    video = SimpleNamespace(mime_type="video/mp4")
    done = SimpleNamespace(done=True, error=None, response=SimpleNamespace(generated_videos=[SimpleNamespace(video=video)]))
    gm = gemini_media(
        settings,
        models=SimpleNamespace(generate_videos=generate_videos),
        operations=SimpleNamespace(get=lambda op: done if op.name == "operations/xyz" else None),
        files=SimpleNamespace(download=lambda file: b"MP4" if file is video else None),
    )
    assert gm.start_video("golven", "9:16") == "operations/xyz"
    assert seen["model"] == settings.gemini_video_model
    assert seen["config"].aspect_ratio == "9:16" and seen["config"].duration_seconds == settings.video_duration_seconds
    status = gm.check_video("operations/xyz")
    assert status.done and status.file == GeneratedFile(b"MP4", "video/mp4")


def test_gemini_video_pending_and_filtered(settings):
    pending = SimpleNamespace(done=False)
    gm = gemini_media(settings, operations=SimpleNamespace(get=lambda op: pending))
    assert gm.check_video("operations/x") == VideoStatus(done=False)

    filtered = SimpleNamespace(done=True, error=None, response=SimpleNamespace(generated_videos=[]))
    gm = gemini_media(settings, operations=SimpleNamespace(get=lambda op: filtered))
    assert gm.check_video("operations/x").error == "ai_refused"


def test_media_requires_key(settings):
    settings.gemini_api_key = ""
    with pytest.raises(AIError):
        media_module.GeminiMedia(settings)
