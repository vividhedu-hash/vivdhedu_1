"""
OpenRouter grounded engine — an alternative to Gemini's Google Search grounding.

Why this exists
---------------
`gemini_grounded` is built around Gemini's `google_search` tool and raises if the
model returns no citations. OpenRouter gives us a second grounded path with
cheap models:

  - ``perplexity/sonar``  — returns native ``citations`` (url/title) per message,
                            so it satisfies the same GroundedAnswer contract.
  - ``deepseek/deepseek-chat`` — cheap, fast, but NOT grounded. Used only for
                            ``require_grounding=False`` work (e.g. the JSON path
                            builder in personal_intelligence). If grounding is
                            required we must not silently accept an ungrounded
                            answer, so we route to Sonar instead.

Everything raises ``IntegrationUnavailable`` on missing config, matching
``gemini_grounded`` so callers need no changes.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import httpx

from api.config import settings
from services.external_apis import IntegrationUnavailable
from services.gemini_grounded import SYSTEM_EDUCATION, Citation, GroundedAnswer

logger = logging.getLogger(__name__)

# Sonar is the grounded option. deepseek-chat has no search tool.
GROUNDED_MODELS = {"perplexity/sonar", "perplexity/sonar-pro", "perplexity/sonar-reasoning"}


class OpenRouterGroundedClient:
    """OpenRouter chat-completions client that normalises to GroundedAnswer."""

    def __init__(self) -> None:
        self.api_key = (settings.openrouter_api_key or "").strip()
        self.base = (settings.openrouter_base_url or "https://openrouter.ai/api/v1").rstrip("/")
        self.primary_model = (settings.openrouter_primary_model or "perplexity/sonar").strip()
        self.fallback_model = (settings.openrouter_fallback_model or "deepseek/deepseek-chat").strip()

    def _require_key(self) -> None:
        if not self.api_key:
            raise IntegrationUnavailable(
                "openrouter",
                "OPENROUTER_API_KEY is not set",
                ["OPENROUTER_API_KEY"],
            )

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def _pick_model(self, require_grounding: bool) -> str:
        if require_grounding:
            if self.primary_model in GROUNDED_MODELS:
                return self.primary_model
            # Configured primary can't ground — try the fallback if it can.
            if self.fallback_model in GROUNDED_MODELS:
                logger.warning(
                    "openrouter: primary model %s cannot ground; using %s",
                    self.primary_model,
                    self.fallback_model,
                )
                return self.fallback_model
            raise IntegrationUnavailable(
                "openrouter",
                "Grounding is required but neither OPENROUTER_PRIMARY_MODEL "
                f"({self.primary_model}) nor OPENROUTER_FALLBACK_MODEL "
                f"({self.fallback_model}) is a grounded model. Set the primary "
                "to perplexity/sonar.",
                status=502,
            )
        return self.fallback_model

    async def generate(
        self,
        prompt: str,
        *,
        system: str = SYSTEM_EDUCATION,
        timeout: float = 45.0,
        require_grounding: bool = True,
    ) -> GroundedAnswer:
        self._require_key()
        model = self._pick_model(require_grounding)

        body: Dict[str, Any] = {
            "model": model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
        }
        if model in GROUNDED_MODELS:
            # Ask Sonar to search; it returns a `citations` array on the message.
            body["tools"] = [{"type": "web_search"}]

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://indialens.in",
            "X-Title": "IndiaLens",
        }

        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                res = await client.post(f"{self.base}/chat/completions", headers=headers, json=body)
        except httpx.TimeoutException:
            raise IntegrationUnavailable("openrouter", "OpenRouter request timed out", status=504)

        if res.status_code != 200:
            raise IntegrationUnavailable(
                "openrouter",
                f"OpenRouter HTTP {res.status_code}: {res.text[:240]}",
                status=502,
            )

        answer = self._parse(res.json(), model)

        if require_grounding and not answer.grounded:
            # Same rule as Gemini: never present an ungrounded answer as live
            # web evidence. Better a 503 than a confident unsourced number.
            raise IntegrationUnavailable(
                "openrouter",
                "OpenRouter returned an ungrounded answer (no citations). "
                "Refusing to present it as live web evidence.",
                status=502,
            )
        return answer

    def _parse(self, data: Dict[str, Any], model: str) -> GroundedAnswer:
        choices = data.get("choices") or []
        if not choices:
            raise IntegrationUnavailable("openrouter", "OpenRouter returned no choices", status=502)

        message = choices[0].get("message") or {}
        text = (message.get("content") or "").strip()
        if not text:
            raise IntegrationUnavailable("openrouter", "OpenRouter returned empty text", status=502)

        # Sonar puts citations on message.citations: [{url, title, ...}]
        citations: List[Citation] = []
        for c in message.get("citations") or []:
            if isinstance(c, dict):
                url = c.get("url") or ""
                if url:
                    citations.append(
                        Citation(
                            url=url,
                            title=c.get("title") or url,
                            snippet=c.get("snippet") or c.get("text"),
                        )
                    )
            elif isinstance(c, str) and c.strip():
                citations.append(Citation(url=c, title=c))

        return GroundedAnswer(
            text=text,
            citations=self._dedupe(citations),
            search_queries=[],
            model=model,
            grounded=bool(citations),
            api="openrouter",
        )

    @staticmethod
    def _dedupe(citations: List[Citation]) -> List[Citation]:
        seen = set()
        out: List[Citation] = []
        for c in citations:
            if not c.url or c.url in seen:
                continue
            seen.add(c.url)
            out.append(c)
        return out


openrouter_grounded = OpenRouterGroundedClient()
