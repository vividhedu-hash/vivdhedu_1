"""
Portfolio Builder Router
========================
Endpoints for Extracurricular Spike Studio, Action-Impact X-Y-Z Transformer,
Predatory Journal Crosscheck (Beall's List), and Angular Spike Authenticity calculation.
"""
from typing import List, Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel


try:
    from ml.nextgen_engine import portfolio_spike_engine
    from services.gemini_grounded import gemini_grounded
except ImportError:
    from backend.ml.nextgen_engine import portfolio_spike_engine
    from backend.services.gemini_grounded import gemini_grounded

router = APIRouter(prefix="/portfolio", tags=["Global Admissions Portfolio Builder"])


class ActivityItem(BaseModel):
    title: str
    description: str
    role: str
    months_invested: int
    rarity_factor: Optional[float] = 0.75
    external_validation: Optional[float] = 0.80
    major_alignment: Optional[float] = 0.85


class ComputeSpikeRequest(BaseModel):
    student_token: Optional[str] = None
    target_major: str = "Computer Science"
    activities: List[ActivityItem]


class TransformXYZRequest(BaseModel):
    raw_bullet: str
    context_role: Optional[str] = "High School Student / Researcher"
    target_major: Optional[str] = "Computer Science"


class CheckJournalRequest(BaseModel):
    journal_name: str


@router.post("/compute-spike")
async def compute_spike_score(payload: ComputeSpikeRequest):
    """
    Computes Angular Spike Authenticity Score (Formula 11.1):
    A_spike = sum( (1/N_a) * E_a * D_a * cos(v_a, u_major) )
    """
    activities_dict = [a.model_dump() for a in payload.activities]
    result = portfolio_spike_engine.compute_spike_score(
        activities=activities_dict,
        target_major=payload.target_major
    )
    return result


@router.post("/transform-xyz")
async def transform_bullet_xyz(payload: TransformXYZRequest):
    """
    Restructures raw extracurricular bullets into high-impact Google/CommonApp X-Y-Z statements:
    'Accomplished [X] as measured by [Y] by doing [Z]'.
    """
    prompt = f"""
You are an expert Ivy League & Stanford admissions counselor. 
Restructure the following student activity bullet point using Google's strict X-Y-Z formula:
'Accomplished [X], as measured by quantitative metric [Y], by executing technical/strategic initiative [Z].'

Raw Student Draft: "{payload.raw_bullet}"
Role Context: {payload.context_role}
Target Major: {payload.target_major}

Output JSON format ONLY:
{{
  "transformed_xyz": "The rewritten high-impact sentence",
  "metric_highlighted": "The quantitative measure used",
  "action_initiative": "The key technical or leadership action taken",
  "critique": "Brief explanation of why this creates an angular spike"
}}
"""
    try:
        data = await gemini_grounded.generate_json(prompt, timeout=25.0, require_grounding=False)
        if data and "transformed_xyz" in data:
            return data
        res = await gemini_grounded.generate(prompt, timeout=25.0, require_grounding=False)
        if res and hasattr(res, "text") and res.text:
            import json
            import re
            match = re.search(r"\{.*\}", res.text, re.DOTALL)
            if match:
                return json.loads(match.group(0))
        return {
            "transformed_xyz": f"Accomplished significant technical optimization by executing {payload.raw_bullet}, achieving measurable performance uplift.",
            "metric_highlighted": "Quantitative impact",
            "action_initiative": payload.raw_bullet,
            "critique": "Enhanced clarity and measurable impact."
        }
    except Exception:
        return {
            "transformed_xyz": f"Engineered a dedicated {payload.target_major} initiative ({payload.raw_bullet}), demonstrating rigorous project completion and quantifiable domain depth.",
            "metric_highlighted": "Domain execution",
            "action_initiative": payload.raw_bullet,
            "critique": "Standardized into high-impact active voice."
        }


@router.post("/check-preprint")
async def check_preprint_journal(payload: CheckJournalRequest):
    """
    Cross-checks journal name/publisher against Beall's List of Predatory Open-Access Publishers.
    """
    result = portfolio_spike_engine.check_predatory_journal(payload.journal_name)
    return result


@router.get("/milestones")
async def get_milestone_framework(grade: int = Query(default=11, ge=9, le=12)):
    """Returns the recommended 4-year strategic admissions timeline for Grade 9–12."""
    framework = {
        9: {
            "phase": "Grade 9 — Broad Intellectual Exploration & Fundamentals",
            "priorities": [
                "Foundational algorithms & competitive programming (Codeforces / LeetCode)",
                "3 Diverse domain exploratory projects (Robotics, Biology, Economics)",
                "Establish core academic baseline (Top 5% class standing)"
            ]
        },
        10: {
            "phase": "Grade 10 — Spike Hypothesis & Regional Validation",
            "priorities": [
                "Select single angular spike focus area",
                "Compete in National Olympiads (INMO, INPhO, INOI) or IRIS Science Fair",
                "Launch first open-source tool or community technical initiative"
            ]
        },
        11: {
            "phase": "Grade 11 — Peak Research Artifact & External Validation",
            "priorities": [
                "Author primary research paper or engineering artifact",
                "Submit to verified non-predatory preprint servers (arXiv / SSRN / JEI)",
                "Secure national/international award recognition in spike area",
                "SAT / ACT examination completion (Target: 1540+ / 35+)"
            ]
        },
        12: {
            "phase": "Grade 12 — Common App Narrative Synthesis & Application Execution",
            "priorities": [
                "Author Socratic Common App Personal Statement",
                "Structure 10 Activity entries in strict X-Y-Z format",
                "Optimize Early Decision (ED) / Early Action (EA) college portfolio"
            ]
        }
    }
    return framework.get(grade, framework[11])
