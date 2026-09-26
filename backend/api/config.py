"""
IndiaLens backend configuration — reads from environment variables / .env file
"""
from pathlib import Path
from pydantic import model_validator
from pydantic_settings import BaseSettings
from functools import lru_cache

BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BACKEND_DIR.parent
ENV_FILES = (str(BACKEND_DIR / ".env"), str(ROOT_DIR / ".env"), ".env")

# Shipped defaults that must never be used to sign or gate production traffic.
_PLACEHOLDER_SECRETS = {
    "change-me-in-production-use-32-char-minimum",
    "the-project-jwt-secret-key-32-chars-min",
    "admin-dev-key-change-in-production",
}


class Settings(BaseSettings):
    # Database
    #
    # No default on purpose. A hardcoded localhost URL meant the app always
    # built a real async engine, so on any machine without that Postgres
    # (CI, a fresh clone) DB-backed routes died with an opaque 500 from deep
    # inside greenlet instead of degrading to 503. Empty means "no database
    # configured" and routes fail closed.
    database_url: str = ""
    database_url_sync: str = ""

    # Redis (Airflow broker + result backend)
    redis_url: str = "redis://localhost:6379/0"

    # FastAPI & Auth
    secret_key: str = "change-me-in-production-use-32-char-minimum"
    jwt_secret: str = "the-project-jwt-secret-key-32-chars-min"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 168  # 7 days
    api_key_admin: str = "admin-dev-key-change-in-production"
    frontend_url: str = "http://localhost:3000"
    environment: str = "development"
    debug: bool = True

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:3000/api/auth/callback/google"

    # Payment Gateways (Razorpay / Stripe)
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""

    # Scraper settings
    user_agent: str = "IndiaLensBot/1.0 (research; contact@indialens.in)"
    scrape_delay_seconds: float = 1.5     # politeness delay between requests
    anomaly_threshold_pct: float = 25.0   # flag deltas > 25%
    auto_accept_threshold_pct: float = 5.0  # auto-accept deltas < 5%

    # Reddit API (PRAW)
    reddit_client_id: str = ""
    reddit_client_secret: str = ""
    reddit_user_agent: str = "IndiaLensBot/1.0"

    # World Bank API
    worldbank_api_base: str = "https://api.worldbank.org/v2"

    # PPP factor (updated quarterly from World Bank)
    ppp_factor_inr_per_usd: float = 23.1

    # Model
    current_model_version: str = "v1.0-seed"

    # External APIs
    data_gov_in_api_key: str = ""
    adzuna_app_id: str = ""
    adzuna_app_key: str = ""
    rapidapi_jsearch_key: str = ""
    github_token: str = ""
    tavily_api_key: str = ""

    # AI Services
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    hf_token: str = ""

    # OpenRouter — fallback/complementary grounded engine.
    # Gemini stays primary because gemini_grounded.generate() is built around
    # Google Search grounding and refuses ungrounded answers. Sonar returns
    # native citations, so it satisfies the same GroundedAnswer contract.
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    # Cheap, fast, grounded models. Overridable per deployment.
    openrouter_primary_model: str = "perplexity/sonar"
    openrouter_fallback_model: str = "deepseek/deepseek-chat"
    # "auto" = try Gemini, fall back to OpenRouter. "openrouter" = OpenRouter
    # first. "gemini" = Gemini only, never fall back.
    ai_engine: str = "auto"

    # Email
    resend_api_key: str = ""
    from_email: str = ""

    # Observability / cache (optional — extra env keys must not crash boot)
    sentry_dsn: str = ""
    upstash_redis_rest_url: str = ""
    upstash_redis_rest_token: str = ""

    class Config:
        env_file = ENV_FILES
        env_file_encoding = "utf-8"
        extra = "ignore"

    @model_validator(mode="after")
    def _reject_placeholder_secrets_in_production(self):
        """Fail closed at boot rather than boot with a forgeable secret.

        A weak/default JWT_SECRET in production means anyone can mint a token with
        is_premium=True, so treat it as a hard startup error, not a warning.
        """
        if self.environment.lower() not in {"production", "prod"}:
            return self

        problems: list[str] = []

        # 1) Secrets must be overridden from the shipped defaults.
        for field in ("secret_key", "jwt_secret", "api_key_admin"):
            value = getattr(self, field) or ""
            if not value or value in _PLACEHOLDER_SECRETS:
                problems.append(f"{field} is still the built-in placeholder")

        # 2) The JWT signing key must actually be strong.
        if len(self.jwt_secret or "") < 32:
            problems.append("jwt_secret must be at least 32 characters")

        if problems:
            raise ValueError(
                "Refusing to start in production with insecure config: "
                + "; ".join(problems)
                + ". Set these as real environment variables."
            )
        return self


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
