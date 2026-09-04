import asyncio
import os
import sys
from decimal import Decimal

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PARENT = os.path.dirname(BACKEND)
sys.path.insert(0, BACKEND)
sys.path.insert(0, PARENT)

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(BACKEND, '.env'))
    load_dotenv(os.path.join(PARENT, '.env'))
except ImportError:
    pass

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from scripts.program_facts import upsert_program_facts

DATABASE_URL = os.environ.get('DATABASE_URL')

BENCHMARKS = {
    ('engineering-cs', '1'): (93.0, 1600000, 2800000, 6000000, 12500000, 240000),
    ('engineering-cs', '2'): (85.0, 950000, 1800000, 3800000, 8500000, 220000),
    ('engineering-cs', '3'): (72.0, 550000, 1100000, 2400000, 5500000, 180000),
    ('engineering-non-cs', '1'): (84.0, 1250000, 2200000, 4800000, 10500000, 230000),
    ('engineering-non-cs', '2'): (75.0, 700000, 1350000, 3000000, 6800000, 190000),
    ('engineering-non-cs', '3'): (60.0, 420000, 850000, 1800000, 4200000, 150000),
    ('management', '1'): (98.0, 2600000, 4200000, 8200000, 17500000, 1100000),
    ('management', '2'): (88.0, 1400000, 2500000, 5200000, 11000000, 750000),
    ('management', '3'): (70.0, 650000, 1200000, 2600000, 5800000, 400000),
    ('medicine', '1'): (98.0, 1100000, 2600000, 6500000, 14500000, 25000),
    ('medicine', '2'): (92.0, 850000, 1900000, 4800000, 11000000, 450000),
    ('medicine', '3'): (80.0, 550000, 1200000, 3000000, 7200000, 850000),
    ('law', '1'): (90.0, 1450000, 2600000, 5600000, 12000000, 280000),
    ('law', '2'): (78.0, 800000, 1500000, 3200000, 7200000, 180000),
    ('law', '3'): (60.0, 450000, 900000, 2000000, 4500000, 120000),
    ('design', '1'): (88.0, 950000, 1800000, 3800000, 8200000, 320000),
    ('design', '2'): (76.0, 620000, 1200000, 2600000, 5800000, 220000),
    ('social-sciences', '1'): (86.0, 850000, 1600000, 3400000, 7500000, 120000),
    ('social-sciences', '2'): (72.0, 550000, 1050000, 2200000, 4800000, 60000),
    ('commerce', '1'): (85.0, 900000, 1750000, 3800000, 8500000, 150000),
    ('commerce', '2'): (74.0, 520000, 1050000, 2300000, 5200000, 80000),
    ('pure-sciences', '1'): (80.0, 750000, 1500000, 3200000, 7200000, 50000),
    ('pure-sciences', '2'): (65.0, 450000, 900000, 2000000, 4500000, 40000),
}

async def populate():
    connect_args = {}
    if 'supabase' in DATABASE_URL or 'pooler' in DATABASE_URL:
        connect_args = {'statement_cache_size': 0, 'prepared_statement_cache_size': 0}

    engine = create_async_engine(DATABASE_URL, echo=False, connect_args=connect_args)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        res = await db.execute(text("""
            SELECT p.id, c.short_name, d.short_name, c.tier, d.field, d.duration_years, p.annual_tuition_inr
            FROM programs p
            JOIN colleges c ON c.id = p.college_id
            JOIN degrees d ON d.id = p.degree_id
            LEFT JOIN salary_trajectories st ON st.program_id = p.id AND st.year_number = 1 AND st.is_current = TRUE
            WHERE st.id IS NULL
        """))
        missing = res.fetchall()
        print(f'Found {len(missing)} programs needing trajectory population.')

        populated = 0
        for row in missing:
            pid = str(row[0])
            col_name = row[1]
            deg_name = row[2]
            tier = str(row[3])
            field = str(row[4])
            dur = float(row[5] or 4.0)
            existing_tuition = row[6]

            bench = BENCHMARKS.get((field, tier)) or BENCHMARKS.get((field, '2')) or (75.0, 800000, 1500000, 3200000, 7000000, 200000)
            rate, y1, y5, y10, y20, default_tuition = bench

            tuition = int(existing_tuition) if existing_tuition and existing_tuition > 1000 else default_tuition

            if 'M.Tech' in deg_name or 'MS' in deg_name:
                y1 = int(y1 * 1.15)
                y5 = int(y5 * 1.15)
                y10 = int(y10 * 1.15)
                y20 = int(y20 * 1.15)

            await upsert_program_facts(
                db,
                pid,
                duration_years=dur,
                annual_tuition=tuition,
                placement_pct=rate,
                median_salary=y1,
                y1=y1,
                y5=y5,
                y10=y10,
                y20=y20,
                source='nirf_ambitionbox_benchmark',
            )
            populated += 1

        await db.commit()
        print(f'Successfully populated trajectories and facts for {populated} programs!')

    await engine.dispose()

if __name__ == '__main__':
    asyncio.run(populate())
