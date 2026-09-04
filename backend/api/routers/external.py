"""
/api/v1/external — live open-data APIs. Fail closed when keys or upstreams are missing.
"""
from fastapi import APIRouter, HTTPException, Query

from backend.services.external_apis import IntegrationUnavailable, external_api_service
from backend.services.tavily_auto_service import tavily_auto_service

router = APIRouter(prefix="/external", tags=["External APIs"])


def _raise(exc: IntegrationUnavailable):
    raise HTTPException(status_code=exc.status, detail=exc.as_http_detail())


@router.get("/data-gov")
async def get_data_gov_trends(limit: int = Query(10, ge=1, le=100)):
    try:
        return await external_api_service.fetch_data_gov_aishe(limit=limit)
    except IntegrationUnavailable as e:
        _raise(e)


@router.get("/job-market")
async def get_job_market_demand(
    field: str = Query("engineering-cs"),
    city: str = Query("bengaluru"),
):
    try:
        result = await external_api_service.fetch_job_market_metrics(field=field, city=city)
        if result.get("status") == "live":
            try:
                await tavily_auto_service.auto_trigger_for_college(
                    f"India {city}",
                    field,
                    f"India {field} salary {city} freshers placement average CTC",
                )
            except Exception:
                pass
        return result
    except IntegrationUnavailable as e:
        _raise(e)


@router.get("/ecosystem")
async def get_university_ecosystem(
    university_name: str = Query("IIT Bombay"),
):
    github_error = None
    wikidata_error = None
    github_data = None
    wikidata_data = None
    try:
        github_data = await external_api_service.fetch_github_ecosystem(query=university_name)
    except IntegrationUnavailable as e:
        github_error = e.as_http_detail()
    try:
        wikidata_data = await external_api_service.fetch_wikidata_university(university_name=university_name)
    except IntegrationUnavailable as e:
        wikidata_error = e.as_http_detail()

    if github_data is None and wikidata_data is None:
        raise HTTPException(status_code=502, detail={
            "error": "integration_unavailable",
            "integration": "ecosystem",
            "github": github_error,
            "wikidata": wikidata_error,
        })

    return {
        "university": university_name,
        "github": github_data or github_error,
        "wikidata": wikidata_data or wikidata_error,
        "_source": "live",
    }
