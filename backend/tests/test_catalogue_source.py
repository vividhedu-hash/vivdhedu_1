"""The programme catalogue has one production path: FastAPI."""

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
LIVE = REPO_ROOT / "indialens" / "src" / "lib" / "live-colleges.ts"
BACKEND_TS = REPO_ROOT / "indialens" / "src" / "lib" / "backend.ts"
STATS = REPO_ROOT / "indialens" / "src" / "app" / "api" / "colleges" / "stats" / "route.ts"
COLLEGES_PY = REPO_ROOT / "backend" / "api" / "routers" / "colleges.py"


def test_live_colleges_calls_fastapi_before_postgrest():
    src = LIVE.read_text(encoding="utf-8")
    api_idx = src.find("fetchListFromFastApi")
    rest_idx = src.find("fetchListFromPostgrest")
    assert api_idx != -1 and rest_idx != -1
    assert api_idx < rest_idx
    # Production default: PostgREST is not consulted unless the flag is on.
    assert "allowCataloguePostgrest()" in src
    assert "v_programs_full" in src  # break-glass helper still exists
    # The list function must not treat an empty FastAPI payload as failure.
    assert "an empty array is a real" in src.lower() or "Empty results stay empty" in src


def test_catalogue_postgrest_is_opt_in():
    src = BACKEND_TS.read_text(encoding="utf-8")
    assert "ALLOW_CATALOGUE_POSTGREST" in src
    assert 'process.env.ALLOW_CATALOGUE_POSTGREST === "1"' in src


def test_stats_route_does_not_hit_postgrest():
    src = STATS.read_text(encoding="utf-8")
    assert "fetchSupabaseRest" not in src
    assert 'fetchBackend("/api/colleges/stats"' in src


def test_backend_exposes_colleges_stats():
    src = COLLEGES_PY.read_text(encoding="utf-8")
    assert '@router.get("/colleges/stats")' in src
    # Must be declared before the {program_id} catch-all.
    assert src.find("/colleges/stats") < src.find("/colleges/{program_id}")
