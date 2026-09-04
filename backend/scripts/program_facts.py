"""Insert placement / cost / salary rows that match db/schema.sql."""
from sqlalchemy import text


async def upsert_program_facts(db, program_id: str, *, duration_years: float, annual_tuition: int,
                               placement_pct: float, median_salary: int, y1: int, y5: int, y10: int, y20: int,
                               source: str = "nirf_2024_public"):
    total_cost = int(annual_tuition * duration_years)
    hostel = int(annual_tuition * 0.35 * duration_years)
    await db.execute(text("UPDATE placement_data SET is_current = FALSE WHERE program_id = :pid AND is_current = TRUE"), {"pid": program_id})
    await db.execute(text("""
        INSERT INTO placement_data
            (program_id, academic_year, placement_rate_pct, median_salary_inr, average_salary_inr, source, is_current)
        VALUES (:pid, '2023-24', :rate, :median, :avg, :source, TRUE)
    """), {
        "pid": program_id,
        "rate": placement_pct,
        "median": median_salary,
        "avg": int(median_salary * 1.08),
        "source": source,
    })

    await db.execute(text("UPDATE cost_data SET is_current = FALSE WHERE program_id = :pid AND is_current = TRUE"), {"pid": program_id})
    await db.execute(text("""
        INSERT INTO cost_data
            (program_id, total_tuition_inr, hostel_living_inr, exam_prep_costs_inr,
             opportunity_cost_inr, total_cost_of_degree, source_year, is_current)
        VALUES (:pid, :tuition, :hostel, 50000, :opp, :total, 2024, TRUE)
    """), {
        "pid": program_id,
        "tuition": total_cost,
        "hostel": hostel,
        "opp": int(300_000 * duration_years),
        "total": total_cost + hostel,
    })

    await db.execute(text("""
        UPDATE programs SET annual_tuition_inr = :tuition WHERE id = :pid
    """), {"pid": program_id, "tuition": annual_tuition})

    for year, p50 in ((1, y1), (5, y5), (10, y10), (20, y20)):
        await db.execute(text("""
            UPDATE salary_trajectories SET is_current = FALSE
            WHERE program_id = :pid AND year_number = :yr AND is_current = TRUE
        """), {"pid": program_id, "yr": year})
        await db.execute(text("""
            INSERT INTO salary_trajectories
                (program_id, model_version, year_number, p10_inr, p25_inr, p50_inr, p75_inr, p90_inr,
                 data_source, is_current)
            VALUES
                (:pid, 'v1.0-seed', :yr, :p10, :p25, :p50, :p75, :p90, :source, TRUE)
        """), {
            "pid": program_id,
            "yr": year,
            "p10": int(p50 * 0.72),
            "p25": int(p50 * 0.82),
            "p50": p50,
            "p75": int(p50 * 1.22),
            "p90": int(p50 * 1.45),
            "source": source,
        })
