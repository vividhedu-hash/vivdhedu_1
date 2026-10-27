"""
OpenRouter grounded engine — powers VividhEdu AI Mode with frontier open models.

Supports:
  - thinkingmachines/inkling:free (41B active / 975B MoE — deep agentic reasoning)
  - nvidia/nemotron-3-ultra-550b-a55b:free (55B active / 550B MoE — strict factual & placement verification)
  - Automatic fallback between models if one is busy/rate-limited
  - Full live web search grounding via Tavily / Exa / DuckDuckGo
"""
from __future__ import annotations

import logging
import re
from typing import Any, Dict, List, Optional

import httpx

from api.config import settings
from services.external_apis import IntegrationUnavailable
from services.gemini_grounded import SYSTEM_EDUCATION, Citation, GroundedAnswer

logger = logging.getLogger(__name__)

# Keywords indicating need for strict factual numerical verification (Nemotron sweet spot)
FACTUAL_KEYWORDS = {
    "ctc", "salary", "lpa", "package", "fees", "fee", "cutoff", "cutoffs",
    "placement", "placements", "rank", "ranks", "nirf", "roi", "median", "average"
}


class OpenRouterGroundedClient:
    """OpenRouter chat-completions client that normalises to GroundedAnswer."""

    def __init__(self) -> None:
        self._refresh()

    def _refresh(self) -> None:
        self.api_key = (settings.openrouter_api_key or "").strip()
        self.base = (settings.openrouter_base_url or "https://openrouter.ai/api/v1").rstrip("/")
        self.primary_model = (
            getattr(settings, "openrouter_primary_model", "") or "thinkingmachines/inkling:free"
        ).strip()
        self.fallback_model = (
            getattr(settings, "openrouter_fallback_model", "") or "nvidia/nemotron-3-ultra-550b-a55b:free"
        ).strip()

    def _require_key(self) -> None:
        self._refresh()
        if not self.api_key:
            raise IntegrationUnavailable(
                "openrouter",
                "OPENROUTER_API_KEY is not set",
                ["OPENROUTER_API_KEY"],
            )

    def is_configured(self) -> bool:
        self._refresh()
        return bool(self.api_key)

    def _choose_model_order(self, prompt: str) -> List[str]:
        """Intelligently order models based on query type."""
        self._refresh()
        lowered = (prompt or "").lower()
        words = set(re.findall(r"\b\w+\b", lowered))
        is_factual = bool(words & FACTUAL_KEYWORDS)

        # If question is heavy on factual cutoffs/salaries, Nemotron 3 Ultra leads
        if is_factual and "nemotron" in self.fallback_model.lower():
            ordered = [self.fallback_model, self.primary_model]
        else:
            ordered = [self.primary_model, self.fallback_model]

        # Deduplicate while preserving order
        seen = set()
        return [m for m in ordered if m and not (m in seen or seen.add(m))]

    async def generate(
        self,
        prompt: str,
        *,
        system: str = SYSTEM_EDUCATION,
        timeout: float = 60.0,
        require_grounding: bool = True,
    ) -> GroundedAnswer:
        self._require_key()
        from services.fallback_web_search import apply_to_answer, ground_prompt

        # Step 1: Fetch live web search snippets via Tavily / Exa / DuckDuckGo
        prompt, search_bundle = await ground_prompt(prompt)

        # Step 2: Determine model candidates (Inkling & Nemotron Ultra)
        candidate_models = self._choose_model_order(prompt)
        last_error: Optional[Exception] = None

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://cursor.com",
            "User-Agent": "Cursor/0.45.0",
            "X-Title": "VividhEdu",
        }

        for model in candidate_models:
            body: Dict[str, Any] = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.2,
                "max_tokens": 4096,
            }

            try:
                logger.info("Calling OpenRouter with model: %s", model)
                async with httpx.AsyncClient(timeout=timeout) as client:
                    res = await client.post(f"{self.base}/chat/completions", headers=headers, json=body)

                if res.status_code == 200:
                    payload = res.json()
                    parsed = self._parse(payload, model)
                    # Apply search citations to guarantee 100% grounded evidence
                    answer = apply_to_answer(parsed, search_bundle)
                    if require_grounding and not answer.grounded:
                        logger.warning("Model %s returned no citations; trying next candidate", model)
                        continue
                    return answer

                logger.warning(
                    "OpenRouter model %s returned HTTP %s: %s",
                    model,
                    res.status_code,
                    res.text[:180],
                )
                last_error = IntegrationUnavailable(
                    "openrouter",
                    f"Model {model} returned HTTP {res.status_code}: {res.text[:180]}",
                    status=502,
                )
            except httpx.TimeoutException:
                logger.warning("OpenRouter model %s timed out after %ss", model, timeout)
                last_error = IntegrationUnavailable(
                    "openrouter",
                    f"Model {model} request timed out",
                    status=504,
                )
            except Exception as e:
                logger.warning("OpenRouter model %s failed: %s", model, str(e))
                last_error = e

        if last_error:
            if isinstance(last_error, IntegrationUnavailable):
                raise last_error
            raise IntegrationUnavailable("openrouter", str(last_error), status=502)

        raise IntegrationUnavailable(
            "openrouter",
            "All OpenRouter model candidates failed to return an answer.",
            status=502,
        )

    def _parse(self, data: Dict[str, Any], model: str) -> GroundedAnswer:
        choices = data.get("choices") or []
        if not choices:
            raise IntegrationUnavailable("openrouter", "OpenRouter returned no choices", status=502)

        message = choices[0].get("message") or {}
        text = (message.get("content") or "").strip()
        if "</think>" in text:
            parts = text.split("</think>")
            ans = parts[-1].strip()
            if len(ans) > 40:
                text = ans
        if not text:
            raise IntegrationUnavailable("openrouter", "OpenRouter returned empty text", status=502)

        raw_citations = []
        if isinstance(message.get("citations"), list):
            raw_citations.extend(message["citations"])
        if isinstance(data.get("citations"), list):
            raw_citations.extend(data["citations"])

        citations: List[Citation] = []
        for c in raw_citations:
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
