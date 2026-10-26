"""Google Gemini als AI-dienst (google-genai SDK), met JSON-output volgens een Pydantic-schema."""

import logging
from functools import lru_cache

import httpx
from google import genai
from google.genai import errors, types
from pydantic import ValidationError

from app.config import Settings
from app.services.ai.writer import AIError, Answer, BaseWriter

logger = logging.getLogger(__name__)

# Ruim, omdat bij Gemini ook de "denk"-tokens onder deze limiet vallen
MAX_OUTPUT_TOKENS = 32_768
BLOCKED = {"SAFETY", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII", "RECITATION"}


@lru_cache(maxsize=4)
def _client(api_key: str) -> genai.Client:
    # Een client opstarten kost bijna een seconde; daarom één per sleutel hergebruiken
    return genai.Client(api_key=api_key, http_options=types.HttpOptions(timeout=180_000))  # timeout in ms


class GeminiWriter(BaseWriter):
    def __init__(self, settings: Settings):
        if not settings.gemini_api_key:
            raise AIError("ai_not_configured", status=503)
        self.model = settings.gemini_model
        # Bij drukte of storing (503/504) nog één keer met dit model; leeg = niet
        fallback = settings.gemini_fallback_model
        self.models = [self.model] + ([fallback] if fallback and fallback != self.model else [])
        self.client = _client(settings.gemini_api_key)

    def _ask(self, system, prompt, output_format):
        config = types.GenerateContentConfig(
            system_instruction=system,
            response_mime_type="application/json",
            response_json_schema=output_format.model_json_schema(),
            max_output_tokens=MAX_OUTPUT_TOKENS,
        )
        response, model = None, self.model
        for model in self.models:
            try:
                response = self.client.models.generate_content(model=model, contents=prompt, config=config)
                break
            except errors.ClientError as e:
                raise map_client_error(e)
            except errors.ServerError as e:
                logger.error("Gemini-serverfout bij %s (%s): %s", model, e.code, e.message)
            except (httpx.HTTPError, TimeoutError, ConnectionError) as e:
                logger.error("Gemini niet bereikbaar bij %s: %s", model, type(e).__name__)
        if response is None:
            raise AIError("ai_unavailable", status=503)

        if response.prompt_feedback and response.prompt_feedback.block_reason:
            raise AIError("ai_refused", status=422)
        candidate = (response.candidates or [None])[0]
        finish = candidate.finish_reason.name if candidate and candidate.finish_reason else None
        if finish in BLOCKED:
            raise AIError("ai_refused", status=422)
        if finish == "MAX_TOKENS":
            raise AIError("ai_truncated")
        if not response.text:
            raise AIError("ai_invalid_output")

        try:
            output = output_format.model_validate_json(response.text)
        except ValidationError:
            logger.warning("Gemini gaf JSON die niet aan het schema voldoet: %.300s", response.text)
            raise AIError("ai_invalid_output")

        usage = response.usage_metadata
        return Answer(
            output=output,
            input_tokens=(usage.prompt_token_count or 0) if usage else 0,
            # Denk-tokens worden ook betaald, dus tellen we mee
            output_tokens=((usage.candidates_token_count or 0) + (usage.thoughts_token_count or 0)) if usage else 0,
            model=model,
        )


def map_client_error(e: errors.ClientError) -> AIError:
    message = (e.message or "").lower()
    if e.code in (401, 403) or "api key" in message or e.status == "PERMISSION_DENIED":
        return AIError("ai_auth_failed", status=503)
    if e.code == 429:
        # "free_tier ... limit: 0": dit model zit niet in het gratis plan (bijv. beelden en video's)
        if "free_tier" in message and "limit: 0" in message:
            return AIError("ai_billing_required", status=402)
        return AIError("ai_rate_limited", status=429)
    if e.code == 404:
        logger.error("Gemini-model niet gevonden: %s", e.message)
        return AIError("ai_model_not_found", status=503)
    logger.error("Gemini weigerde het verzoek (%s): %s", e.code, e.message)
    return AIError("ai_bad_request")
