"""
Recompute roi_scores from salary_trajectories + cost/placement in Postgres.

Run after seed or scrapes:
    python -m scripts.compute_roi
"""
import asyncio
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PARENT = os.path.dirname(BACKEND)
sys.path.insert(0, BACKEND)
sys.path.insert(0, PARENT)

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

try:
    from ml.roi_computer import compute_roi
except ImportError:
    from backend.ml.roi_computer import compute_roi

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(BACKEND, ".env"))
    load_dotenv(os.path.join(PARENT, ".env"))
except ImportError:
    pass

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://indialens:indialens_dev@localhost:5432/indialens",
)


async def recompute():
    connect_args = {}
    if "supabase" in DATABASE_URL or "pooler" in DATABASE_URL:
        connect_args = {"statement_cache_size": 0, "prepared_statement_cache_size": 0}
    engine = create_async_engine(DATABASE_URL, echo=False, connect_args=connect_args)
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with Session() as db:
        result = await db.execute(text("""
            SELECT
                p.id AS program_id,
                c.tier, c.college_type, c.state, c.nirf_rank,
                d.field AS degree_field, d.duration_years,
                cd.total_cost_of_degree AS total_cost_of_degree_inr,
                pl.placement_rate_pct,
                ri.ai_automation_prob, ri.salary_volatility, ri.industry_cyclicality,
                ri.credential_inflation, ri.geographic_concentration, ri.work_life_quality
            FROM programs p
            JOIN colleges c ON c.id = p.college_id
            JOIN degrees d ON d.id = p.degree_id
            LEFT JOIN cost_data cd ON cd.program_id = p.id AND cd.is_current = TRUE
            LEFT JOIN placement_data pl ON pl.program_id = p.id AND pl.is_current = TRUE
            LEFT JOIN risk_indicators ri ON ri.program_id = p.id AND ri.is_current = TRUE
            WHERE p.is_active = TRUE
        """))
        programs = [dict(r._mapping) for r in result]
        written = 0
        skipped = 0

        for prog in programs:
            pid = str(prog["program_id"])
            traj_rows = await db.execute(text("""
                SELECT year_number, p25_inr, p50_inr, p75_inr
                FROM salary_trajectories
                WHERE program_id = :pid AND is_current = TRUE
            """), {"pid": pid})
            traj = {}
            for row in traj_rows:
                traj[f"y{row.year_number}"] = {
                    "p25": row.p25_inr,
                    "p50": row.p50_inr,
                    "p75": row.p75_inr,
                }
            if "y1" not in traj:
                skipped += 1
                continue

            placement = float(prog.get("placement_rate_pct") or 0)
            if placement > 1:
                placement = placement / 100.0
            prog["placement_rate_pct"] = placement
            scores = compute_roi(prog, traj)

            # Never persist a score built from invented inputs. When real fee or
            # placement data is absent, compute_roi returns data_complete=False
            # with None figures; writing those (or the old 0.0/0.35/0.70 defaults
            # below) is how 19 unmeasured colleges ended up showing confident
            # ROI numbers. Leave them unscored until a scraper supplies data.
            if not scores.get("data_complete"):
                skipped += 1
                continue

            sub = scores.get("sub_scores") or {}
            comp = scores["composite_score"]
            await db.execute(text("""
                UPDATE roi_scores SET is_current = FALSE
                WHERE program_id = :pid AND is_current = TRUE
            """), {"pid": pid})
            await db.execute(text("""
                INSERT INTO roi_scores
                    (program_id, model_version, composite_score, financial_roi_pct,
                     risk_score, optionality_score, mobility_score, satisfaction_score,
                     network_score, ci_low, ci_high, confidence_level, is_current)
                VALUES
                    (:pid, 'v1.0-live', :comp, :fin, :risk, :opt, :mob, :sat, :net,
                     :ci_l, :ci_h, :conf, TRUE)
            """), {
                "pid": pid,
                "comp": comp,
                "fin": scores["financial_roi_pct"],
                "risk": scores["risk_score"],
                "opt": sub.get("optionality", 0.70),
                "mob": sub.get("mobility", 0.70),
                "sat": sub.get("satisfaction", 0.75),
                "net": sub.get("network", 0.80),
                "ci_l": scores.get("ci_low"),
                "ci_h": scores.get("ci_high"),
                "conf": scores.get("confidence_level", "High"),
            })
            written += 1

        await db.commit()
        print(f"ROI recomputed for {written} programs ({skipped} skipped — insufficient real data)")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(recompute())
