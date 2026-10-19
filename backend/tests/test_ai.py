"""Prompts, controles, hashtags en de foutafhandeling rond Claude (zonder echte API-aanroepen)."""

import uuid
from types import SimpleNamespace

import anthropic
import httpx
import pytest

from app.models import Brand, Platform
from app.services.ai import claude as claude_module
from app.services.ai import prompts
from app.services.ai.claude import ClaudeWriter
from app.services.ai.writer import AIError, DraftPost, DraftPosts, get_writer
from app.services.checks import post_warnings


def brand(**kwargs) -> Brand:
    defaults = dict(
        user_id=uuid.uuid4(),
        name="De Boon {koffie}",
        website_url=None,
        target_audience="Thuiswerkers",
        tone_of_voice="Warm",
        usps=["Eigen branderij"],
        colors=[],
        avoid_terms=["goedkoop", "beste van Nederland"],
        content_language="nl",
    )
    return Brand(**(defaults | kwargs))


def test_generate_prompt_contains_profile_rules_and_source():
    text = prompts.generate_prompt(brand(), Platform.X, 2, "Nieuwe seizoensblend", "Focus op de herfst")
    assert "De Boon {koffie}" in text  # accolades in merkteksten blijven heel
    assert "280" in text and "Write 2 different post(s) for X" in text
    assert "<source>\nNieuwe seizoensblend\n</source>" in text
    assert "Focus op de herfst" in text
    assert "- goedkoop" in text
    assert "Dutch" in text
    assert "{{" not in text


def test_generate_prompt_without_source_or_instructions():
    text = prompts.generate_prompt(brand(content_language="en"), Platform.LINKEDIN, 1, None, None)
    assert "<source>" not in text and "<extra_instructions>" not in text
    assert "Language of the posts: English" in text


def test_regenerate_prompt():
    text = prompts.regenerate_prompt(brand(), Platform.INSTAGRAM, "Oude hook", "Oude tekst", ["#a"], "Korter")
    assert "Oude hook" in text and "Korter" in text and "#a" in text and "{{" not in text


def test_hashtags_are_cleaned():
    post = DraftPost(hook=" Hoi ", body="Tekst", hashtags=["koffie", "#Koffie", "# latte art", "#", "#Utrecht"])
    assert post.hook == "Hoi"
    assert post.hashtags == ["#koffie", "#latteart", "#Utrecht"]


def test_warnings_for_length_hashtags_and_avoid_terms():
    b = brand()
    warnings = post_warnings("x", "Hook", "a" * 300 + " De Goedkoopste ooit", ["#1", "#2", "#3"], b)
    codes = {w["code"]: w for w in warnings}
    assert codes["too_long"]["max"] == 280
    assert codes["too_many_hashtags"]["max"] == 2
    assert codes["avoid_terms"]["terms"] == ["goedkoop"]


def test_avoid_terms_match_word_starts_and_phrases_only():
    b = brand(avoid_terms=["boon", "beste van nederland"])
    assert post_warnings("facebook", "Onze boonsoorten", "", [], b)[0]["terms"] == ["boon"]
    assert post_warnings("facebook", "Een lieve kaboon", "", [], b) == []
    assert post_warnings("facebook", "De Beste van Nederland!", "", [], b)[0]["terms"] == ["beste van nederland"]


# ---------- ClaudeWriter met een nep-SDK-client ----------


def make_writer(settings, parse):
    writer = ClaudeWriter(settings)
    writer.client = SimpleNamespace(beta=SimpleNamespace(messages=SimpleNamespace(parse=parse)))
    return writer


def response(parsed, stop_reason="end_turn"):
    return SimpleNamespace(parsed_output=parsed, stop_reason=stop_reason, usage=SimpleNamespace(input_tokens=7, output_tokens=3))


def test_writer_requires_api_key(settings):
    settings.anthropic_api_key = ""
    with pytest.raises(AIError) as exc:
        ClaudeWriter(settings)
    assert exc.value.code == "ai_not_configured"


def test_provider_setting_picks_writer(settings):
    from app.services.ai.gemini import GeminiWriter

    settings.ai_provider = "gemini"
    assert isinstance(get_writer(settings), GeminiWriter)
    settings.ai_provider = "claude"
    assert isinstance(get_writer(settings), ClaudeWriter)


def test_writer_generate_one_call_per_platform_and_sums_usage(settings):
    calls = []

    def parse(**kwargs):
        calls.append(kwargs)
        posts = [DraftPost(hook=f"h{i}", body="b", hashtags=[]) for i in range(5)]
        return response(DraftPosts(posts=posts))

    result = make_writer(settings, parse).generate(brand(), [Platform.X, Platform.LINKEDIN], 2, None, None)
    assert len(calls) == 2
    assert {len(v) for v in result.posts.values()} == {2}  # afgekapt op het gevraagde aantal
    assert (result.usage.input_tokens, result.usage.output_tokens) == (14, 6)
    first = calls[0]
    assert first["model"] == settings.claude_model
    assert first["output_format"] is DraftPosts
    assert first["fallbacks"] == "default" and claude_module.FALLBACK_BETA in first["betas"]
    assert first["output_config"] == {"effort": settings.claude_effort}


@pytest.mark.parametrize(
    "stop_reason, parsed, code",
    [("refusal", None, "ai_refused"), ("max_tokens", None, "ai_truncated"), ("end_turn", None, "ai_invalid_output")],
)
def test_writer_bad_responses(settings, stop_reason, parsed, code):
    writer = make_writer(settings, lambda **_: response(parsed, stop_reason))
    with pytest.raises(AIError) as exc:
        writer.regenerate(brand(), Platform.X, "h", "b", [], "korter")
    assert exc.value.code == code


def _status_error(cls, status):
    request = httpx.Request("POST", "https://api.anthropic.com/v1/messages")
    return cls("fout", response=httpx.Response(status, request=request), body=None)


@pytest.mark.parametrize(
    "error, code",
    [
        (lambda: _status_error(anthropic.AuthenticationError, 401), "ai_auth_failed"),
        (lambda: _status_error(anthropic.RateLimitError, 429), "ai_rate_limited"),
        (lambda: _status_error(anthropic.BadRequestError, 400), "ai_bad_request"),
        (lambda: _status_error(anthropic.NotFoundError, 404), "ai_model_not_found"),
        (lambda: _status_error(anthropic.InternalServerError, 500), "ai_unavailable"),
        (lambda: anthropic.APIConnectionError(request=httpx.Request("POST", "https://api.anthropic.com")), "ai_unavailable"),
    ],
)
def test_writer_maps_sdk_errors(settings, error, code):
    def parse(**_):
        raise error()

    with pytest.raises(AIError) as exc:
        make_writer(settings, parse).regenerate(brand(), Platform.X, "h", "b", [], "")
    assert exc.value.code == code
