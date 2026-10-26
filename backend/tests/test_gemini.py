"""GeminiWriter met een nagebootste google-genai-client: verzoekvorm, outputcontrole en foutcodes."""

import json
import uuid
from types import SimpleNamespace

import httpx
import pytest
from google.genai import errors

from app.models import Brand, Platform
from app.services.ai.gemini import GeminiWriter
from app.services.ai.writer import AIError, DraftPosts


def brand() -> Brand:
    return Brand(user_id=uuid.uuid4(), name="De Boon", target_audience="", tone_of_voice="", usps=[], avoid_terms=[], content_language="nl")


def response(text, finish="STOP", block_reason=None, prompt_tokens=11, out_tokens=7, thoughts=5):
    return SimpleNamespace(
        text=text,
        prompt_feedback=SimpleNamespace(block_reason=block_reason) if block_reason else None,
        candidates=[SimpleNamespace(finish_reason=SimpleNamespace(name=finish))],
        usage_metadata=SimpleNamespace(prompt_token_count=prompt_tokens, candidates_token_count=out_tokens, thoughts_token_count=thoughts),
    )


def make_writer(settings, generate_content):
    writer = GeminiWriter(settings)
    writer.client = SimpleNamespace(models=SimpleNamespace(generate_content=generate_content))
    return writer


def posts_json(n):
    return json.dumps({"posts": [{"hook": f"Hook {i}", "body": "Tekst", "hashtags": ["koffie", "#Koffie"]} for i in range(n)]})


def test_requires_api_key(settings):
    settings.gemini_api_key = ""
    with pytest.raises(AIError) as exc:
        GeminiWriter(settings)
    assert exc.value.code == "ai_not_configured"


def test_generate_sends_schema_and_counts_usage(settings):
    calls = []

    def generate_content(**kwargs):
        calls.append(kwargs)
        return response(posts_json(4))

    result = make_writer(settings, generate_content).generate(brand(), [Platform.X, Platform.LINKEDIN], 2, None, None)

    assert len(calls) == 2  # één per platform
    config = calls[0]["config"]
    assert calls[0]["model"] == settings.gemini_model
    assert config.response_mime_type == "application/json"
    assert config.response_json_schema == DraftPosts.model_json_schema()
    assert "copywriter" in config.system_instruction
    assert {len(v) for v in result.posts.values()} == {2}
    assert result.posts[Platform.X][0].hashtags == ["#koffie"]  # opgeschoond
    # Denk-tokens tellen mee als output
    assert (result.usage.input_tokens, result.usage.output_tokens) == (22, 24)
    assert result.usage.model == settings.gemini_model


@pytest.mark.parametrize(
    "resp, code",
    [
        (response("", block_reason="SAFETY"), "ai_refused"),
        (response(posts_json(1), finish="SAFETY"), "ai_refused"),
        (response('{"posts": [', finish="MAX_TOKENS"), "ai_truncated"),
        (response(""), "ai_invalid_output"),
        (response('{"posts": [{"hook": "zonder tekst"}]}'), "ai_invalid_output"),
        (response("geen json"), "ai_invalid_output"),
    ],
)
def test_bad_responses(settings, resp, code):
    writer = make_writer(settings, lambda **_: resp)
    with pytest.raises(AIError) as exc:
        writer.generate(brand(), [Platform.X], 1, None, None)
    assert exc.value.code == code


def _api_error(cls, code, status, message):
    return cls(code, {"error": {"code": code, "status": status, "message": message}})


@pytest.mark.parametrize(
    "error, code",
    [
        (lambda: _api_error(errors.ClientError, 400, "INVALID_ARGUMENT", "API key not valid. Please pass a valid API key."), "ai_auth_failed"),
        (lambda: _api_error(errors.ClientError, 403, "PERMISSION_DENIED", "Permission denied"), "ai_auth_failed"),
        (lambda: _api_error(errors.ClientError, 429, "RESOURCE_EXHAUSTED", "Quota exceeded"), "ai_rate_limited"),
        (
            lambda: _api_error(errors.ClientError, 429, "RESOURCE_EXHAUSTED", "Quota exceeded for metric: generate_content_free_tier_requests, limit: 0, model: x"),
            "ai_billing_required",
        ),
        (lambda: _api_error(errors.ClientError, 404, "NOT_FOUND", "models/x is not found"), "ai_model_not_found"),
        (lambda: _api_error(errors.ClientError, 400, "INVALID_ARGUMENT", "Request contains an invalid argument."), "ai_bad_request"),
        (lambda: _api_error(errors.ServerError, 503, "UNAVAILABLE", "The model is overloaded."), "ai_unavailable"),
        (lambda: httpx.ConnectError("geen verbinding"), "ai_unavailable"),
    ],
)
def test_sdk_errors_become_codes(settings, error, code):
    def generate_content(**_):
        raise error()

    with pytest.raises(AIError) as exc:
        make_writer(settings, generate_content).regenerate(brand(), Platform.X, "h", "b", [], "korter")
    assert exc.value.code == code


def test_falls_back_to_lighter_model_when_busy(settings):
    calls = []

    def generate_content(model, **_):
        calls.append(model)
        if model == "gemini-flash-latest":
            raise _api_error(errors.ServerError, 503, "UNAVAILABLE", "This model is currently experiencing high demand.")
        return response(json.dumps({"hook": "Nieuw", "body": "Kort", "hashtags": []}))

    result = make_writer(settings, generate_content).regenerate(brand(), Platform.X, "h", "b", [], "korter")
    assert calls == ["gemini-flash-latest", "gemini-flash-lite-latest"]
    assert result.post.hook == "Nieuw" and result.usage.model == "gemini-flash-lite-latest"


def test_no_fallback_for_client_errors_or_when_disabled(settings):
    calls = []

    def generate_content(model, **_):
        calls.append(model)
        raise _api_error(errors.ClientError, 400, "INVALID_ARGUMENT", "bad")

    with pytest.raises(AIError):
        make_writer(settings, generate_content).regenerate(brand(), Platform.X, "h", "b", [], "korter")
    assert calls == ["gemini-flash-latest"]  # een fout in het verzoek wordt met een ander model niet beter

    settings.gemini_fallback_model = ""
    calls.clear()

    def busy(model, **_):
        calls.append(model)
        raise _api_error(errors.ServerError, 503, "UNAVAILABLE", "busy")

    with pytest.raises(AIError) as exc:
        make_writer(settings, busy).regenerate(brand(), Platform.X, "h", "b", [], "korter")
    assert exc.value.code == "ai_unavailable" and calls == ["gemini-flash-latest"]


def test_regenerate_returns_single_post(settings):
    def generate_content(**kwargs):
        assert "korter" in kwargs["contents"]
        return response(json.dumps({"hook": "Nieuw", "body": "Kort", "hashtags": []}))

    result = make_writer(settings, generate_content).regenerate(brand(), Platform.X, "Oud", "Lang", [], "korter")
    assert result.post.hook == "Nieuw" and result.usage.input_tokens == 11
