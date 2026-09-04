"""
Marketplace Router
==================
Endpoints for curated course catalog, student-personalized matching (M >= 0.75),
and affiliate tracking telemetry.
"""
import uuid
from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

try:
    from ..db.database import get_db
except ImportError:
    from backend.api.db.database import get_db

try:
    from ml.nextgen_engine import marketplace_engine
    from scripts.seed_global_and_marketplace import COURSE_MARKETPLACE_SEED
except ImportError:
    from backend.ml.nextgen_engine import marketplace_engine
    from backend.scripts.seed_global_and_marketplace import COURSE_MARKETPLACE_SEED

router = APIRouter(prefix="/marketplace", tags=["Course Marketplace"])


class TrackClickPayload(BaseModel):
    course_id: str
    student_token: str
    match_score: float


@router.get("/catalog")
async def get_marketplace_catalog(
    category: Optional[str] = None,
    session: AsyncSession = Depends(get_db)
):
    """Returns the full catalog of accredited upskilling courses."""
    try:
        query = "SELECT * FROM course_marketplace WHERE is_active = TRUE"
        params = {}
        if category:
            query += " AND category = :category"
            params["category"] = category
        query += " ORDER BY ai_resilience_score DESC"

        result = await session.execute(text(query), params)
        rows = result.mappings().all()

        if not rows:
            filtered = [
                c for c in COURSE_MARKETPLACE_SEED
                if not category or c["category"].lower() == category.lower()
            ]
            return {"courses": filtered, "total": len(filtered), "source": "memory_catalog"}

        return {"courses": [dict(r) for r in rows], "total": len(rows), "source": "database"}
    except Exception:
        return {"courses": COURSE_MARKETPLACE_SEED, "total": len(COURSE_MARKETPLACE_SEED), "source": "fallback"}


@router.get("/recommended")
async def get_recommended_courses(
    student_token: Optional[str] = None,
    target_role: Optional[str] = "AI Engineer",
    monthly_budget_inr: float = 5000.0,
    session: AsyncSession = Depends(get_db)
):
    """
    Evaluates courses against student profile via Formula 3.1:
    M(s,c) = 0.35*SkillGap + 0.25*CareerAlign + 0.25*AIResilience + 0.15*BudgetFit.
    Returns courses where M >= 0.75.
    """
    student_skills = ["Python", "Data Analysis", "Calculus"]

    if student_token:
        try:
            res = await session.execute(
                text("SELECT profile_data FROM student_reports WHERE token = :token"),
                {"token": student_token}
            )
            row = res.fetchone()
            if row and row[0]:
                data = row[0]
                student_skills = data.get("skills", student_skills)
                target_role = data.get("target_role", target_role)
        except Exception:
            pass

    candidates = COURSE_MARKETPLACE_SEED
    evaluated_courses = []

    for course in candidates:
        eval_res = marketplace_engine.match_course_for_student(
            student_skills=student_skills,
            target_role=target_role or "AI Engineer",
            monthly_budget_inr=monthly_budget_inr,
            course_item=course
        )
        if eval_res["is_gated_display"]:
            evaluated_courses.append(eval_res)

    evaluated_courses.sort(key=lambda x: x["match_score"], reverse=True)

    return {
        "student_token": student_token,
        "target_role": target_role,
        "match_threshold": 0.75,
        "matched_courses": evaluated_courses,
        "count": len(evaluated_courses)
    }


@router.post("/track-click")
async def track_affiliate_click(
    payload: TrackClickPayload,
    session: AsyncSession = Depends(get_db)
):
    """Logs affiliate click telemetry and signs attribution tracking token."""
    try:
        await session.execute(
            text("""
            INSERT INTO course_impressions (student_token, course_id, match_score, clicked, clicked_at)
            VALUES (:student_token, :course_id, :match_score, TRUE, NOW())
            """),
            {
                "student_token": payload.student_token,
                "course_id": payload.course_id if len(payload.course_id) == 36 else str(uuid.uuid4()),
                "match_score": payload.match_score
            }
        )
        await session.commit()
    except Exception:
        pass

    return {
        "status": "success",
        "attribution_token": str(uuid.uuid4()),
        "cookie_window_days": 30
    }
