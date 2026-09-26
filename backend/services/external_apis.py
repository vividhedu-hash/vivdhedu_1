"""
IndiaLens Backend — External API Integration Service
Live fetches only. Missing keys and upstream failures return structured errors,
never invented job volumes, alumni counts, or university founding years.
"""
import logging
from typing import Any, Dict, List, Optional

import httpx

from api.config import settings
from api.integrations import require_configured

logger = logging.getLogger(__name__)


class IntegrationUnavailable(Exception):
    def __init__(self, integration: str, reason: str, missing_env: Optional[List[str]] = None, status: int = 503):
        self.integration = integration
        self.reason = reason
        self.missing_env = missing_env or []
        self.status = status
        super().__init__(reason)

    def as_http_detail(self) -> dict:
        return {
            "error": "integration_unavailable",
            "integration": self.integration,
            "reason": self.reason,
            "missing_env": self.missing_env,
            "_source": "live",
        }


class ExternalAPIService:
    def __init__(self):
        self.timeout = httpx.Timeout(10.0, connect=5.0)
        self.user_agent = settings.user_agent

    async def fetch_data_gov_aishe(self, limit: int = 10) -> Dict[str, Any]:
        missing = require_configured("data_gov")
        if missing:
            raise IntegrationUnavailable("data_gov", "DATA_GOV_IN_API_KEY is not set", missing)

        url = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
        params = {"api-key": settings.data_gov_in_api_key, "format": "json", "limit": limit}
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(url, params=params)
                if res.status_code == 200:
                    return {"source": "data.gov.in", "status": "live", "data": res.json()}
                raise IntegrationUnavailable(
                    "data_gov",
                    f"data.gov.in returned HTTP {res.status_code}",
                    status=502,
                )
        except IntegrationUnavailable:
            raise
        except Exception as e:
            raise IntegrationUnavailable("data_gov", str(e), status=502)

    async def fetch_job_market_metrics(self, field: str = "engineering-cs", city: str = "bengaluru") -> Dict[str, Any]:
        adzuna_missing = require_configured("adzuna")
        jsearch_missing = require_configured("jsearch")
        if adzuna_missing and jsearch_missing:
            raise IntegrationUnavailable(
                "job_market",
                "Set ADZUNA_APP_ID + ADZUNA_APP_KEY, or RAPIDAPI_JSEARCH_KEY",
                adzuna_missing + jsearch_missing,
            )

        if not adzuna_missing:
            url = "https://api.adzuna.com/v1/api/jobs/in/search/1"
            params = {
                "app_id": settings.adzuna_app_id,
                "app_key": settings.adzuna_app_key,
                "what": field.replace("-", " "),
                "where": city,
                "results_per_page": 5,
            }
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    res = await client.get(url, params=params)
                    if res.status_code == 200:
                        payload = res.json()
                        count = payload.get("count")
                        mean_sal = payload.get("mean_salary")
                        if count is None:
                            raise IntegrationUnavailable("adzuna", "Adzuna response missing count", status=502)
                        return {
                            "source": "adzuna_live",
                            "status": "live",
                            "field": field,
                            "city": city,
                            "total_active_postings": count,
                            "avg_salary_inr": round(mean_sal, 2) if mean_sal else None,
                            "demand_score": min(99, max(40, int(count / 50))),
                        }
                    raise IntegrationUnavailable("adzuna", f"Adzuna HTTP {res.status_code}", status=502)
            except IntegrationUnavailable:
                raise
            except Exception as e:
                raise IntegrationUnavailable("adzuna", str(e), status=502)

        url = "https://jsearch.p.rapidapi.com/search"
        headers = {
            "X-RapidAPI-Key": settings.rapidapi_jsearch_key,
            "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        }
        params = {"query": f"{field.replace('-', ' ')} jobs {city} India", "page": "1", "num_pages": "1"}
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(url, headers=headers, params=params)
                if res.status_code == 200:
                    payload = res.json()
                    data = payload.get("data") or []
                    return {
                        "source": "jsearch_live",
                        "status": "live",
                        "field": field,
                        "city": city,
                        "total_active_postings": len(data),
                        "avg_salary_inr": None,
                        "demand_score": min(99, max(40, len(data) * 8)),
                    }
                raise IntegrationUnavailable("jsearch", f"JSearch HTTP {res.status_code}", status=502)
        except IntegrationUnavailable:
            raise
        except Exception as e:
            raise IntegrationUnavailable("jsearch", str(e), status=502)

    async def fetch_github_ecosystem(self, query: str = "IIT Bombay") -> Dict[str, Any]:
        headers = {"User-Agent": self.user_agent, "Accept": "application/vnd.github+json"}
        if settings.github_token:
            headers["Authorization"] = f"Bearer {settings.github_token}"

        url = "https://api.github.com/search/users"
        params = {"q": f"type:org {query}"}
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(url, params=params, headers=headers)
                if res.status_code == 200:
                    payload = res.json()
                    items = payload.get("items", [])[:3]
                    total_count = payload.get("total_count", 0)
                    return {
                        "source": "github_api",
                        "status": "live",
                        "query": query,
                        "total_organizations": total_count,
                        "matched_orgs": [{"login": i.get("login"), "url": i.get("html_url")} for i in items],
                        "tech_activity_index": min(100, 50 + total_count * 5),
                    }
                raise IntegrationUnavailable("github", f"GitHub HTTP {res.status_code}", status=502)
        except IntegrationUnavailable:
            raise
        except Exception as e:
            raise IntegrationUnavailable("github", str(e), status=502)

    async def fetch_wikidata_university(self, university_name: str) -> Dict[str, Any]:
        sparql = f"""
        SELECT ?item ?itemLabel ?inception ?coord WHERE {{
          ?item wdt:P31/wdt:P279* wd:Q3918;
                rdfs:label "{university_name}"@en.
          OPTIONAL {{ ?item wdt:P571 ?inception. }}
          OPTIONAL {{ ?item wdt:P625 ?coord. }}
          SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
        }} LIMIT 1
        """
        url = "https://query.wikidata.org/sparql"
        params = {"query": sparql, "format": "json"}
        headers = {"User-Agent": self.user_agent, "Accept": "application/sparql-results+json"}
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(url, params=params, headers=headers)
                if res.status_code != 200:
                    raise IntegrationUnavailable("wikidata", f"Wikidata HTTP {res.status_code}", status=502)
                bindings = res.json().get("results", {}).get("bindings", [])
                if not bindings:
                    raise IntegrationUnavailable(
                        "wikidata",
                        f"No Wikidata match for '{university_name}'",
                        status=404,
                    )
                b = bindings[0]
                return {
                    "source": "wikidata_sparql",
                    "status": "live",
                    "university": university_name,
                    "wikidata_id": b.get("item", {}).get("value", "").split("/")[-1],
                    "established": (b.get("inception", {}).get("value") or "")[:4] or None,
                    "location_coord": b.get("coord", {}).get("value") or None,
                }
        except IntegrationUnavailable:
            raise
        except Exception as e:
            raise IntegrationUnavailable("wikidata", str(e), status=502)


external_api_service = ExternalAPIService()
