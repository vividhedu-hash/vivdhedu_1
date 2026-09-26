"""
Personal intelligence + academic path graph.

Catalog rows come from Postgres when available. Web facts come only from
Gemini 3.7 Flash + Google Search grounding. We do not invent programs.
"""
from __future__ import annotations

import json
import logging
import secrets
from typing import Any, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from api.config import settings
from services.gemini_grounded import gemini_grounded

logger = logging.getLogger(__name__)

PATH_SCHEMA = """{
  "headline": "one sentence on this student as an investor in a degree",
  "archetype": "short label",
  "confidence": 0.0,
  "strengths": ["..."],
  "risks": ["..."],
  "decision_rules": ["if/then rules this student should use"],
  "open_questions": ["facts still unverified"],
  "nodes": [
    {
      "id": "n1",
      "label": "short label",
      "kind": "exam|program|skill|role|gate",
      "layer": 0,
      "note": "one line",
      "catalog_program_id": null,
      "citation_urls": []
    }
  ],
  "edges": [
    {"from": "n1", "to": "n2", "label": "condition", "weight": 0.5}
  ]
}"""


async def load_catalog_slice(
    db: Optional[AsyncSession],
    field: Optional[str],
    limit: int = 8,
) -> List[Dict[str, Any]]:
    if db is None:
        return []
    try:
        params: Dict[str, Any] = {"limit": limit}
        field_sql = ""
        if field:
            field_sql = "AND d.field = :field"
            params["field"] = field
        result = await db.execute(
            text(f"""
            SELECT p.id::text AS program_id,
                   c.id::text AS college_id,
                   c.short_name AS college, d.short_name AS degree,
                   d.field, c.tier::text AS tier, c.state,
                   r.composite_score, r.financial_roi_pct, r.risk_score,
                   r.ci_low, r.ci_high,
                   pl.median_salary_inr, pl.placement_rate_pct,
                   cd.total_cost_of_degree
            FROM programs p
            JOIN colleges c ON c.id = p.college_id
            JOIN degrees d ON d.id = p.degree_id
            LEFT JOIN roi_scores r ON r.program_id = p.id AND r.is_current = TRUE
            LEFT JOIN placement_data pl ON pl.program_id = p.id AND pl.is_current = TRUE
            LEFT JOIN cost_data cd ON cd.program_id = p.id AND cd.is_current = TRUE
            WHERE p.is_active = TRUE {field_sql}
            ORDER BY r.composite_score DESC NULLS LAST
            LIMIT :limit
            """),
            params,
        )
        return [dict(row._mapping) for row in result]
    except Exception as e:
        logger.warning("Catalog slice unavailable: %s", e)
        return []


async def load_report_profile(db: Optional[AsyncSession], token: Optional[str]) -> Dict[str, Any]:
    if not token or db is None:
        return {}
    try:
        result = await db.execute(
            text("SELECT profile_data, results_data FROM student_reports WHERE token = :token"),
            {"token": token},
        )
        row = result.fetchone()
        if not row:
            return {}
        profile = row.profile_data
        if isinstance(profile, str):
            profile = json.loads(profile)
        results = row.results_data
        if isinstance(results, str):
            results = json.loads(results)
        return {"profile": profile or {}, "results": results or {}}
    except Exception as e:
        logger.warning("Report lookup failed: %s", e)
        return {}


async def build_personal_intelligence(
    *,
    db: Optional[AsyncSession],
    profile: Dict[str, Any],
    token: Optional[str],
    question: Optional[str] = None,
) -> Dict[str, Any]:
    stored = await load_report_profile(db, token)
    merged_profile = {**(stored.get("profile") or {}), **(profile or {})}
    field = merged_profile.get("target_field") or merged_profile.get("twelfth_stream")
    catalog = await load_catalog_slice(db, field)
    catalog_ids = {row["program_id"] for row in catalog}

    # Enrich catalog programs with actuarial metrics
    from ml.admissions_engine import AdmissionsPortfolioEngine
    from ml.nextgen_engine import AIJobSecurityEngine

    student_rank = float(merged_profile.get("expected_rank") or merged_profile.get("jee_rank") or 12000.0)
    exam_name = merged_profile.get("exam") or "JEE Main"
    category = merged_profile.get("category") or "General"
    home_state = merged_profile.get("home_state") or "Maharashtra"

    enriched_catalog = []
    for item in catalog:
        # Calibrated admissions odds
        bench_rank = 3500.0 if item.get("tier") == "1" else (18000.0 if item.get("tier") == "2" else 45000.0)
        z, prob = AdmissionsPortfolioEngine.calculate_admission_probability(
            expected_rank=student_rank,
            base_closing_rank=bench_rank,
            category=category,
            is_home_state=(str(item.get("state", "")).lower() == home_state.lower()),
            exam_name=exam_name,
        )
        # AI job security metrics
        jss = AIJobSecurityEngine.evaluate_job_security(
            degree_field=item.get("field", "engineering-cs"),
            college_tier=str(item.get("tier", "2")),
        )
        enriched_catalog.append({
            **item,
            "admission_odds_pct": round(prob * 100.0, 1),
            "admission_z_score": z,
            "job_security_score": jss["jss_score"],
            "layoff_probability_5y_pct": jss["layoff_probability_5y_pct"],
        })

    prompt = f"""You are the Chief Actuarial Fiduciary & Career Intelligence OS for 'The Project'.
Synthesize this student's mathematical model outputs with live web evidence to construct an authoritative personal intelligence flowchart.

User Profile & Latent Traits:
{json.dumps(merged_profile, default=str)[:4000]}

The Project Actuarial Evaluated Programs (ONLY these may appear as catalog_program_id):
{json.dumps(enriched_catalog, default=str)[:6000]}

Prior Quantitative Analysis & Monte Carlo Results (may be empty):
{json.dumps(stored.get("results") or {}, default=str)[:3000]}

Focus Question: {question or "What is the optimal strategic degree and career pathway?"}

INSTRUCTIONS FOR REASONING & SEARCH GROUNDING:
1. Ground truth mathematics: Use the provided Composite ROI scores, 90% Confidence Intervals, Job Security Scores, and Admission Odds as authoritative baselines.
2. Web Search Verification: Search the live web for 2026 application deadlines, recent JoSAA/MHT-CET/WBJEE/NEET cutoff trends, and hiring market shifts.
3. Strict Fiduciary Rules: Challenge unrealistic options where total cost exceeds budget or where admission odds are under 15%.
4. Layers: 0=now/exam, 1=degree, 2=early career, 3=optional PG / pivot.
5. Keep 6–12 nodes and 6–14 edges.

Return JSON matching this schema:
{PATH_SCHEMA}
"""
    data = await gemini_grounded.generate_json(prompt, timeout=55.0, require_grounding=False)
    grounding = data.pop("_grounding", {})
    nodes = []
    for node in data.get("nodes") or []:
        if not isinstance(node, dict) or not node.get("id") or not node.get("label"):
            continue
        pid = node.get("catalog_program_id")
        if pid and pid not in catalog_ids:
            node = {**node, "catalog_program_id": None}
        nodes.append(node)
    node_ids = {n["id"] for n in nodes}
    edges = [
        e
        for e in (data.get("edges") or [])
        if isinstance(e, dict) and e.get("from") in node_ids and e.get("to") in node_ids
    ]

    persist_token = token or secrets.token_urlsafe(16)
    intelligence = {
        "token": persist_token,
        "headline": data.get("headline"),
        "archetype": data.get("archetype"),
        "confidence": data.get("confidence"),
        "strengths": data.get("strengths") or [],
        "risks": data.get("risks") or [],
        "decision_rules": data.get("decision_rules") or [],
        "open_questions": data.get("open_questions") or [],
        "profile": merged_profile,
        "catalog_used": len(catalog),
        "path": {"nodes": nodes, "edges": edges},
        "grounding": grounding,
        "model": settings.gemini_model,
        "persisted": False,
    }

    if db is not None:
        try:
            await db.execute(
                text("""
                INSERT INTO personal_intelligence
                    (token, profile_data, intelligence, path_graph, citations, model_version, grounded)
                VALUES
                    (:token, CAST(:profile AS jsonb), CAST(:intel AS jsonb),
                     CAST(:path AS jsonb), CAST(:citations AS jsonb), :model, :grounded)
                ON CONFLICT (token) DO UPDATE SET
                    profile_data = EXCLUDED.profile_data,
                    intelligence = EXCLUDED.intelligence,
                    path_graph = EXCLUDED.path_graph,
                    citations = EXCLUDED.citations,
                    model_version = EXCLUDED.model_version,
                    grounded = EXCLUDED.grounded,
                    updated_at = NOW()
                """),
                {
                    "token": persist_token,
                    "profile": json.dumps(merged_profile, default=str),
                    "intel": json.dumps({
                        "headline": intelligence["headline"],
                        "archetype": intelligence["archetype"],
                        "confidence": intelligence["confidence"],
                        "strengths": intelligence["strengths"],
                        "risks": intelligence["risks"],
                        "decision_rules": intelligence["decision_rules"],
                        "open_questions": intelligence["open_questions"],
                    }, default=str),
                    "path": json.dumps(intelligence["path"], default=str),
                    "citations": json.dumps(grounding, default=str),
                    "model": settings.gemini_model,
                    "grounded": bool(grounding.get("grounded")),
                },
            )
            await db.commit()
            intelligence["persisted"] = True
        except Exception as e:
            logger.warning("personal_intelligence persist skipped: %s", e)
            intelligence["persist_error"] = "table_or_db_unavailable"

    return intelligence


def present_personal_intelligence(row: Dict[str, Any]) -> Dict[str, Any]:
    intel = row.get("intelligence") or {}
    path = row.get("path_graph") or {}
    grounding = row.get("citations") or {}
    profile = row.get("profile_data") or {}
    if isinstance(intel, str):
        intel = json.loads(intel)
    if isinstance(path, str):
        path = json.loads(path)
    if isinstance(grounding, str):
        grounding = json.loads(grounding)
    if isinstance(profile, str):
        profile = json.loads(profile)
    return {
        "token": row.get("token"),
        "headline": intel.get("headline"),
        "archetype": intel.get("archetype"),
        "confidence": intel.get("confidence"),
        "strengths": intel.get("strengths") or [],
        "risks": intel.get("risks") or [],
        "decision_rules": intel.get("decision_rules") or [],
        "open_questions": intel.get("open_questions") or [],
        "profile": profile,
        "path": path if isinstance(path, dict) else {"nodes": [], "edges": []},
        "grounding": grounding if isinstance(grounding, dict) else {},
        "model": row.get("model_version"),
        "persisted": True,
    }


async def get_personal_intelligence(db: AsyncSession, token: str) -> Optional[Dict[str, Any]]:
    result = await db.execute(
        text("SELECT * FROM personal_intelligence WHERE token = :token"),
        {"token": token},
    )
    row = result.fetchone()
    if not row:
        return None
    mapping = dict(row._mapping)
    for key in ("profile_data", "intelligence", "path_graph", "citations"):
        val = mapping.get(key)
        if isinstance(val, str):
            mapping[key] = json.loads(val)
    return present_personal_intelligence(mapping)
