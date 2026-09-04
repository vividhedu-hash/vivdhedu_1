"""
Integration registry — reports which live APIs are configured.
Never invents payloads; callers fail closed when a required key is missing.
"""
from typing import Any, Dict, List, Optional

from .config import settings


INTEGRATIONS: Dict[str, Dict[str, Any]] = {
    "database": {
        "required_env": ["DATABASE_URL"],
        "optional": False,
        "docs": "Postgres / Supabase connection string",
    },
    "gemini": {
        "required_env": ["GEMINI_API_KEY"],
        "optional": True,
        "docs": "https://aistudio.google.com — Gemini 3.7 Flash + Google Search grounding",
    },
    "huggingface": {
        "required_env": ["HF_TOKEN"],
        "optional": True,
        "docs": "https://huggingface.co/settings/tokens — review sentiment",
    },
    "tavily": {
        "required_env": ["TAVILY_API_KEY"],
        "optional": True,
        "docs": "https://app.tavily.com — live web search for placements",
    },
    "adzuna": {
        "required_env": ["ADZUNA_APP_ID", "ADZUNA_APP_KEY"],
        "optional": True,
        "docs": "https://developer.adzuna.com — India job-market volumes",
    },
    "jsearch": {
        "required_env": ["RAPIDAPI_JSEARCH_KEY"],
        "optional": True,
        "docs": "https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch",
    },
    "data_gov": {
        "required_env": ["DATA_GOV_IN_API_KEY"],
        "optional": True,
        "docs": "https://data.gov.in — AISHE / NIRF open data",
    },
    "github": {
        "required_env": ["GITHUB_TOKEN"],
        "optional": True,
        "docs": "https://github.com/settings/tokens — alumni org density (public API works unauthenticated, rate-limited)",
    },
    "reddit": {
        "required_env": ["REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET"],
        "optional": True,
        "docs": "https://www.reddit.com/prefs/apps",
    },
    "resend": {
        "required_env": ["RESEND_API_KEY"],
        "optional": True,
        "docs": "https://resend.com — report emails",
    },
}


def _env_value(name: str) -> str:
    mapping = {
        "DATABASE_URL": settings.database_url,
        "GEMINI_API_KEY": settings.gemini_api_key,
        "HF_TOKEN": settings.hf_token,
        "TAVILY_API_KEY": settings.tavily_api_key,
        "ADZUNA_APP_ID": settings.adzuna_app_id,
        "ADZUNA_APP_KEY": settings.adzuna_app_key,
        "RAPIDAPI_JSEARCH_KEY": settings.rapidapi_jsearch_key,
        "DATA_GOV_IN_API_KEY": settings.data_gov_in_api_key,
        "GITHUB_TOKEN": settings.github_token,
        "REDDIT_CLIENT_ID": settings.reddit_client_id,
        "REDDIT_CLIENT_SECRET": settings.reddit_client_secret,
        "RESEND_API_KEY": getattr(settings, "resend_api_key", "") or "",
    }
    return (mapping.get(name) or "").strip()


def missing_env(names: List[str]) -> List[str]:
    return [n for n in names if not _env_value(n)]


def is_configured(integration: str) -> bool:
    spec = INTEGRATIONS[integration]
    return not missing_env(spec["required_env"])


def integration_status() -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for name, spec in INTEGRATIONS.items():
        missing = missing_env(spec["required_env"])
        out[name] = {
            "configured": len(missing) == 0,
            "missing_env": missing,
            "optional": spec["optional"],
            "docs": spec["docs"],
        }
        if name == "gemini":
            out[name]["model"] = settings.gemini_model
    return out


def require_configured(integration: str) -> Optional[List[str]]:
    """Return missing env names, or None if ready."""
    missing = missing_env(INTEGRATIONS[integration]["required_env"])
    return missing or None
