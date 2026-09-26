"""
Engine-agnostic grounded generation.

Callers use this instead of `gemini_grounded` directly so the engine can be
configured without touching every call site.

  ai_engine=gemini     → Gemini only; if unconfigured, raise (no silent fallback)
  ai_engine=openrouter → OpenRouter only
  ai_engine=auto       → Gemini, then OpenRouter (default)

Both backends raise IntegrationUnavailable when unconfigured or when they
cannot produce a grounded answer, so the auto path degrades on real failure
rather than on a missing key. The returned GroundedAnswer always carries the
model that actually answered, so the UI never claims Gemini produced a
DeepSeek answer.
"""
from __future__ import annotations

import logging
from typing import Any, Dict

from api.config import settings
from services.external_apis import IntegrationUnavailable
from services.gemini_grounded import SYSTEM_EDUCATION, GroundedAnswer, gemini_grounded
from services.openrouter_grounded import openrouter_grounded

logger = logging.getLogger(__name__)


def available_engines() -> Dict[str, bool]:
    return {
        "gemini": bool(settings.gemini_api_key),
        "openrouter": openrouter_grounded.is_configured(),
    }


# Engine name → the env var that must be set for it. The fail-closed error
# hands `missing_env` to the frontend so it can tell the operator exactly what
# to add; reporting engine names ("GEMINI") instead of real env var names
# ("GEMINI_API_KEY") left the operator with nothing actionable.
ENGINE_ENV_VARS: Dict[str, str] = {
    "gemini": "GEMINI_API_KEY",
    "openrouter": "OPENROUTER_API_KEY",
}


def active_engine_name() -> str:
    """What the UI should display as the configured engine."""
    avail = available_engines()
    mode = (settings.ai_engine or "auto").strip().lower()

    if mode == "gemini":
        return settings.gemini_model if avail["gemini"] else ""
    if mode == "openrouter":
        return settings.openrouter_primary_model if avail["openrouter"] else ""
    # auto
    if avail["gemini"]:
        return settings.gemini_model
    if avail["openrouter"]:
        return settings.openrouter_primary_model
    return ""


async def generate_grounded(
    prompt: str,
    *,
    system: str = SYSTEM_EDUCATION,
    timeout: float = 45.0,
    require_grounding: bool = True,
) -> GroundedAnswer:
    mode = (settings.ai_engine or "auto").strip().lower()
    order = {
        "gemini": [gemini_grounded],
        "openrouter": [openrouter_grounded],
        "auto": [gemini_grounded, openrouter_grounded],
    }.get(mode, [gemini_grounded, openrouter_grounded])

    if len(order) == 1 and mode != "auto":
        # Explicit single-engine choice: surface its error directly.
        return await order[0].generate(
            prompt, system=system, timeout=timeout, require_grounding=require_grounding
        )

    errors = []
    for engine in order:
        try:
            return await engine.generate(
                prompt, system=system, timeout=timeout, require_grounding=require_grounding
            )
        except IntegrationUnavailable as e:
            errors.append(f"{e.integration}: {e.reason}")
            logger.warning("ai_engine: %s unavailable (%s)", e.integration, e.reason)

    avail = available_engines()
    missing = [var for name, ok in avail.items() if not ok for var in [ENGINE_ENV_VARS[name]]]
    raise IntegrationUnavailable(
        "ai",
        "No configured grounded AI engine. Tried: " + " | ".join(errors),
        missing or None,
        status=503,
    )


async def generate_grounded_json(
    prompt: str,
    *,
    system: str = SYSTEM_EDUCATION,
    timeout: float = 50.0,
    require_grounding: bool = True,
) -> Dict[str, Any]:
    """Same as generate_grounded but parses a single JSON object out of the text."""
    from services.gemini_grounded import extract_json_object

    answer = await generate_grounded(
        prompt + "\n\nReturn ONLY a single JSON object. No markdown fences.",
        system=system,
        timeout=timeout,
        require_grounding=require_grounding,
    )
    try:
        payload = extract_json_object(answer.text)
    except ValueError as e:
        raise IntegrationUnavailable("ai", f"Model did not return JSON: {e}", status=502)

    payload["_grounding"] = {
        "grounded": answer.grounded,
        "citations": [c.as_dict() for c in answer.citations],
        "search_queries": answer.search_queries,
        "search_suggestions_html": answer.search_suggestions_html,
        "engine": answer.model,
        "api": answer.api,
    }
    return payload
