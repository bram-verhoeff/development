"""Anthropic Claude als AI-dienst (alternatief voor Gemini; kies met AI_PROVIDER=claude)."""

import logging

import anthropic

from app.config import Settings
from app.services.ai.writer import AIError, Answer, BaseWriter

logger = logging.getLogger(__name__)

MAX_TOKENS = 16_000
# Weigert het model een verzoek, dan probeert de API het zelf opnieuw met een passend ander model
FALLBACK_BETA = "server-side-fallback-2026-07-01"


class ClaudeWriter(BaseWriter):
    def __init__(self, settings: Settings):
        if not settings.anthropic_api_key:
            raise AIError("ai_not_configured", status=503)
        self.model = settings.claude_model
        self.effort = settings.claude_effort
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key, timeout=180.0)

    def _ask(self, system, prompt, output_format):
        try:
            response = self.client.beta.messages.parse(
                model=self.model,
                max_tokens=MAX_TOKENS,
                system=system,
                messages=[{"role": "user", "content": prompt}],
                output_format=output_format,
                output_config={"effort": self.effort},
                betas=[FALLBACK_BETA],
                fallbacks="default",
            )
        except (anthropic.AuthenticationError, anthropic.PermissionDeniedError):
            raise AIError("ai_auth_failed", status=503)
        except anthropic.RateLimitError:
            raise AIError("ai_rate_limited", status=429)
        except anthropic.NotFoundError:
            raise AIError("ai_model_not_found", status=503)
        except anthropic.BadRequestError as e:
            logger.error("Claude weigerde het verzoek (400): %s", e.message)
            raise AIError("ai_bad_request")
        except anthropic.APIStatusError as e:
            logger.error("Claude API-fout %s: %s", e.status_code, e.message)
            raise AIError("ai_unavailable", status=503)
        except anthropic.APIConnectionError:
            raise AIError("ai_unavailable", status=503)

        if response.stop_reason == "refusal":
            raise AIError("ai_refused", status=422)
        if response.stop_reason == "max_tokens":
            raise AIError("ai_truncated")
        if response.parsed_output is None:
            raise AIError("ai_invalid_output")
        return Answer(
            output=response.parsed_output,
            input_tokens=response.usage.input_tokens or 0,
            output_tokens=response.usage.output_tokens or 0,
        )
