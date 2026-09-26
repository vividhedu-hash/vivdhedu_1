"""
Unit & Integration tests for IndiaLens routers.
Live-key endpoints fail closed (503) when env is not configured.
"""
from fastapi.testclient import TestClient
from backend.api.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_api_health_reports_integrations():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("ok", "degraded")
    assert "integrations" in data
    assert "gemini" in data["integrations"]
    assert "configured" in data["integrations"]["gemini"]


def test_external_data_gov_fail_closed():
    response = client.get("/api/v1/external/data-gov?limit=5")
    assert response.status_code in (200, 502, 503)
    if response.status_code != 200:
        detail = response.json().get("detail", {})
        assert detail.get("error") == "integration_unavailable" or "error" in response.json()


def test_external_job_market_fail_closed():
    response = client.get("/api/v1/external/job-market?field=engineering-cs&city=bengaluru")
    assert response.status_code in (200, 502, 503)
    if response.status_code == 200:
        data = response.json()
        assert data.get("source") in ("adzuna_live", "jsearch_live")
        assert data.get("status") == "live"


def test_external_ecosystem_no_invented_fallback():
    response = client.get("/api/v1/external/ecosystem?university_name=IIT%20Bombay")
    assert response.status_code in (200, 502, 503)
    if response.status_code == 200:
        data = response.json()
        github = data.get("github") or {}
        assert github.get("source") != "github_fallback"


def test_ai_status_reports_engine():
    response = client.get("/api/v1/ai/status")
    assert response.status_code == 200
    data = response.json()
    assert "mode" in data
    assert "engines" in data
    # `engine` names a real model only when an engine is actually configured.
    # With no keys it must be empty rather than a fabricated model name.
    if not any(data["engines"].values()):
        assert data["engine"] == ""
        assert data["configured"] is False
    else:
        assert data["engine"]
        assert data["configured"] is True
        assert data["grounding"] == "google_search"


def test_ai_mode_fail_closed():
    response = client.post("/api/v1/ai/mode", json={"query": "NIRF 2025 CSE payback for NIT Trichy"})
    assert response.status_code in (200, 502, 503)
    if response.status_code != 200:
        detail = response.json().get("detail", {})
        # Engine-agnostic now, so the integration is "ai" — but the operator
        # must be told the exact env var to set.
        assert detail.get("integration") in ("ai", "gemini", "openrouter")
        missing = detail.get("missing_env") or []
        assert any(m.endswith("_API_KEY") for m in missing), missing
    else:
        data = response.json()
        assert data.get("grounded") is True
        assert data.get("citations")


def test_ai_advisor_fail_closed():
    payload = {
        "total_budget": 12.5,
        "target_field": "engineering-cs",
        "risk_tolerance": "medium",
        "preferred_cities": ["Bengaluru", "Pune"],
    }
    response = client.post("/api/v1/ai/advisor", json=payload)
    assert response.status_code in (200, 502, 503)
    if response.status_code != 200:
        detail = response.json().get("detail", {})
        missing = str(detail.get("missing_env", []))
        assert "_API_KEY" in missing or detail.get("integration") in ("ai", "gemini", "openrouter")


def test_ai_psychometrics_fail_closed():
    payload = {
        "reviews": [
            "Great faculty and supportive peer network.",
            "Hostel infrastructure is decent, placement support is active.",
        ]
    }
    response = client.post("/api/v1/ai/psychometrics", json=payload)
    assert response.status_code in (200, 400, 502, 503)
    if response.status_code != 200:
        detail = response.json().get("detail", {})
        assert detail.get("integration") == "huggingface" or "error" in response.json()


def test_scrape_trigger_unknown_source():
    response = client.post("/api/scrape/trigger/not-a-real-scraper")
    assert response.status_code == 400


def test_college_roi_index_from_database():
    response = client.get("/api/colleges/roi-index")
    assert response.status_code in (200, 503)
    if response.status_code == 200:
        data = response.json()
        assert "leaderboard" in data


def test_tailor_coursework_router():
    response = client.post("/api/v1/ai/tailor-coursework")
    assert response.status_code == 200
    data = response.json()
    assert "p90_highest_package_benchmark" in data
    assert "tailored_coursework_blueprint" in data

