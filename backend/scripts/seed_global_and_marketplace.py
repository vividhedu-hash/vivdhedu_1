"""
Seed Script: Global Programs and Course Marketplace
===================================================
Seeds verified international university degree programs and accredited upskilling courses.
"""
import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://indialens:indialens_dev@localhost:5432/indialens",
)

GLOBAL_PROGRAMS_SEED = [
    {
        "university_name": "Purdue University",
        "country": "United States",
        "city": "West Lafayette, IN",
        "degree_name": "Master of Science",
        "major": "Computer Science",
        "global_tier": "Value Kings",
        "is_stem_designated": True,
        "annual_tuition_usd": 29800.0,
        "living_cost_annual_usd": 14500.0,
        "scholarship_probability": 0.28,
        "assistantship_probability": 0.35,
        "median_salary_usd_y1": 118000.0,
        "median_salary_usd_y5": 165000.0,
        "visa_type": "F-1 OPT (3-Year STEM)",
        "visa_survival_prob": 0.578,
        "effective_tax_rate": 0.245,
        "monthly_rent_median_usd": 950.0,
        "website_url": "https://www.purdue.edu/gradschool",
    },
    {
        "university_name": "Georgia Institute of Technology",
        "country": "United States",
        "city": "Atlanta, GA",
        "degree_name": "Master of Science",
        "major": "Computer Science / Machine Learning",
        "global_tier": "Value Kings",
        "is_stem_designated": True,
        "annual_tuition_usd": 31500.0,
        "living_cost_annual_usd": 16800.0,
        "scholarship_probability": 0.22,
        "assistantship_probability": 0.40,
        "median_salary_usd_y1": 128000.0,
        "median_salary_usd_y5": 182000.0,
        "visa_type": "F-1 OPT (3-Year STEM)",
        "visa_survival_prob": 0.578,
        "effective_tax_rate": 0.260,
        "monthly_rent_median_usd": 1250.0,
        "website_url": "https://www.gatech.edu",
    },
    {
        "university_name": "Technical University of Munich (TUM)",
        "country": "Germany",
        "city": "Munich",
        "degree_name": "Master of Science",
        "major": "Informatics / Software Engineering",
        "global_tier": "Zero-Tuition Arbitrage",
        "is_stem_designated": True,
        "annual_tuition_usd": 0.0,
        "living_cost_annual_usd": 15600.0,
        "scholarship_probability": 0.30,
        "assistantship_probability": 0.45,
        "median_salary_usd_y1": 72000.0,
        "median_salary_usd_y5": 98000.0,
        "visa_type": "EU Blue Card",
        "visa_survival_prob": 0.940,
        "effective_tax_rate": 0.340,
        "monthly_rent_median_usd": 1100.0,
        "website_url": "https://www.tum.de",
    },
    {
        "university_name": "RWTH Aachen University",
        "country": "Germany",
        "city": "Aachen",
        "degree_name": "Master of Science",
        "major": "Automotive & Mechanical Systems",
        "global_tier": "Zero-Tuition Arbitrage",
        "is_stem_designated": True,
        "annual_tuition_usd": 0.0,
        "living_cost_annual_usd": 12000.0,
        "scholarship_probability": 0.25,
        "assistantship_probability": 0.50,
        "median_salary_usd_y1": 68000.0,
        "median_salary_usd_y5": 92000.0,
        "visa_type": "EU Blue Card",
        "visa_survival_prob": 0.940,
        "effective_tax_rate": 0.320,
        "monthly_rent_median_usd": 680.0,
        "website_url": "https://www.rwth-aachen.de",
    },
    {
        "university_name": "Carnegie Mellon University (CMU)",
        "country": "United States",
        "city": "Pittsburgh, PA",
        "degree_name": "Master of Science",
        "major": "Language Technologies / AI",
        "global_tier": "Convex Ceiling Elite",
        "is_stem_designated": True,
        "annual_tuition_usd": 58500.0,
        "living_cost_annual_usd": 18000.0,
        "scholarship_probability": 0.15,
        "assistantship_probability": 0.30,
        "median_salary_usd_y1": 155000.0,
        "median_salary_usd_y5": 235000.0,
        "visa_type": "F-1 OPT (3-Year STEM)",
        "visa_survival_prob": 0.578,
        "effective_tax_rate": 0.285,
        "monthly_rent_median_usd": 1200.0,
        "website_url": "https://www.cmu.edu",
    },
    {
        "university_name": "National University of Singapore (NUS)",
        "country": "Singapore",
        "city": "Singapore",
        "degree_name": "Master of Computing",
        "major": "Computer Science & AI",
        "global_tier": "Convex Ceiling Elite",
        "is_stem_designated": True,
        "annual_tuition_usd": 38000.0,
        "living_cost_annual_usd": 19200.0,
        "scholarship_probability": 0.20,
        "assistantship_probability": 0.25,
        "median_salary_usd_y1": 84000.0,
        "median_salary_usd_y5": 130000.0,
        "visa_type": "Employment Pass (EP)",
        "visa_survival_prob": 0.820,
        "effective_tax_rate": 0.150,
        "monthly_rent_median_usd": 1600.0,
        "website_url": "https://www.nus.edu.sg",
    },
    {
        "university_name": "University of Illinois Urbana-Champaign (UIUC)",
        "country": "United States",
        "city": "Urbana, IL",
        "degree_name": "Master of Science",
        "major": "Electrical & Computer Engineering",
        "global_tier": "Value Kings",
        "is_stem_designated": True,
        "annual_tuition_usd": 36000.0,
        "living_cost_annual_usd": 14000.0,
        "scholarship_probability": 0.25,
        "assistantship_probability": 0.42,
        "median_salary_usd_y1": 122000.0,
        "median_salary_usd_y5": 172000.0,
        "visa_type": "F-1 OPT (3-Year STEM)",
        "visa_survival_prob": 0.578,
        "effective_tax_rate": 0.255,
        "monthly_rent_median_usd": 850.0,
        "website_url": "https://illinois.edu",
    },
]

COURSE_MARKETPLACE_SEED = [
    {
        "course_title": "Deep Learning Specialization",
        "provider": "DeepLearning.AI",
        "category": "Technical Upskilling",
        "affiliate_url": "https://www.coursera.org/specializations/deep-learning?ranMID=40328",
        "price_inr": 3999.0,
        "duration_hours": 60,
        "skill_tags": ["Neural Networks", "PyTorch", "Transformers", "CNN", "RNN", "Vector Embeddings"],
        "career_paths": ["AI Engineer", "Machine Learning Researcher", "Data Scientist"],
        "ai_resilience_score": 0.940,
        "commission_rate_pct": 35.0,
    },
    {
        "course_title": "AWS Certified Solutions Architect Associate (SAA-C03)",
        "provider": "AWS Training",
        "category": "Enterprise Certifications",
        "affiliate_url": "https://aws.amazon.com/certification/certified-solutions-architect-associate",
        "price_inr": 12500.0,
        "duration_hours": 45,
        "skill_tags": ["Cloud Architecture", "AWS VPC", "S3", "EC2", "Distributed Systems", "Fault Tolerance"],
        "career_paths": ["Cloud Architect", "DevOps Engineer", "Backend Lead"],
        "ai_resilience_score": 0.880,
        "commission_rate_pct": 15.0,
    },
    {
        "course_title": "IIT JEE Advanced Masterclasses & Test Series",
        "provider": "Unacademy Plus",
        "category": "Exam Prep",
        "affiliate_url": "https://unacademy.com/goal/jee-main-and-advanced-preparation/TMUVD",
        "price_inr": 28000.0,
        "duration_hours": 250,
        "skill_tags": ["JEE Physics", "Calculus", "Organic Chemistry", "Analytical Problem Solving"],
        "career_paths": ["Engineering Undergraduate", "Research Scientist"],
        "ai_resilience_score": 0.750,
        "commission_rate_pct": 20.0,
    },
    {
        "course_title": "Duolingo English Test (DET) Official Prep & Voucher",
        "provider": "Duolingo",
        "category": "Global Language",
        "affiliate_url": "https://englishtest.duolingo.com/applicants",
        "price_inr": 4900.0,
        "duration_hours": 20,
        "skill_tags": ["Academic English", "Listening Comprehension", "Verbal Fluency", "GRE/TOEFL Alternative"],
        "career_paths": ["International Student", "Global Professional"],
        "ai_resilience_score": 0.820,
        "commission_rate_pct": 25.0,
    },
    {
        "course_title": "Generative AI with Large Language Models",
        "provider": "DeepLearning.AI",
        "category": "Technical Upskilling",
        "affiliate_url": "https://www.coursera.org/learn/generative-ai-with-llms",
        "price_inr": 3499.0,
        "duration_hours": 32,
        "skill_tags": ["LLMs", "RLHF", "PEFT", "LoRA", "Quantization", "Model Alignment"],
        "career_paths": ["GenAI Engineer", "Applied AI Lead", "NLP Architect"],
        "ai_resilience_score": 0.960,
        "commission_rate_pct": 40.0,
    },
    {
        "course_title": "Google Cloud Professional Data Engineer Certification",
        "provider": "Google Cloud",
        "category": "Enterprise Certifications",
        "affiliate_url": "https://cloud.google.com/learn/certification/data-engineer",
        "price_inr": 16500.0,
        "duration_hours": 50,
        "skill_tags": ["BigQuery", "Dataflow", "Apache Beam", "Bigtable", "Data Pipelines"],
        "career_paths": ["Data Engineer", "Analytics Lead", "Big Data Architect"],
        "ai_resilience_score": 0.890,
        "commission_rate_pct": 18.0,
    },
    {
        "course_title": "AWS Certified Machine Learning - Specialty",
        "provider": "AWS Training",
        "category": "Enterprise Certifications",
        "affiliate_url": "https://aws.amazon.com/certification/certified-machine-learning-specialty/",
        "price_inr": 24000.0,
        "duration_hours": 65,
        "skill_tags": ["SageMaker", "Feature Engineering", "MLOps", "Model Monitoring", "Deep Learning"],
        "career_paths": ["MLOps Engineer", "Machine Learning Specialist", "AI Solutions Architect"],
        "ai_resilience_score": 0.950,
        "commission_rate_pct": 20.0,
    },
    {
        "course_title": "CS50: Introduction to Computer Science",
        "provider": "edX / Harvard",
        "category": "Technical Upskilling",
        "affiliate_url": "https://www.edx.org/cs50",
        "price_inr": 11500.0,
        "duration_hours": 120,
        "skill_tags": ["C", "Python", "SQL", "Algorithms", "Data Structures", "Web Development"],
        "career_paths": ["Software Engineer", "Systems Programmer", "Full Stack Developer"],
        "ai_resilience_score": 0.910,
        "commission_rate_pct": 25.0,
    },
    {
        "course_title": "Databricks Certified Data Engineer Professional",
        "provider": "Databricks Academy",
        "category": "Enterprise Certifications",
        "affiliate_url": "https://www.databricks.com/learn/certification/data-engineer-professional",
        "price_inr": 18500.0,
        "duration_hours": 55,
        "skill_tags": ["Apache Spark", "Delta Lake", "Unity Catalog", "Structured Streaming", "CI/CD Data"],
        "career_paths": ["Senior Data Engineer", "Lakehouse Architect", "Big Data Lead"],
        "ai_resilience_score": 0.930,
        "commission_rate_pct": 18.0,
    },
    {
        "course_title": "CFA Level 1 Complete Prep & Schweser QBank",
        "provider": "Kaplan Schweser",
        "category": "Exam Prep",
        "affiliate_url": "https://www.schweser.com/cfa/level-1",
        "price_inr": 45000.0,
        "duration_hours": 300,
        "skill_tags": ["Financial Modeling", "Portfolio Management", "Equity Valuation", "Fixed Income", "Ethics"],
        "career_paths": ["Investment Banker", "Equity Analyst", "Portfolio Manager", "Risk Analyst"],
        "ai_resilience_score": 0.860,
        "commission_rate_pct": 15.0,
    },
]


async def seed():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    
    async with async_session() as session:
        # Seed Global Programs
        print(f"Seeding {len(GLOBAL_PROGRAMS_SEED)} global programs...")
        for prog in GLOBAL_PROGRAMS_SEED:
            await session.execute(
                text("""
                    INSERT INTO global_programs (
                        university_name, country, city, degree_name, major, global_tier,
                        is_stem_designated, annual_tuition_usd, living_cost_annual_usd,
                        scholarship_probability, assistantship_probability,
                        median_salary_usd_y1, median_salary_usd_y5, visa_type,
                        visa_survival_prob, effective_tax_rate, monthly_rent_median_usd,
                        website_url, is_active
                    ) VALUES (
                        :university_name, :country, :city, :degree_name, :major, :global_tier,
                        :is_stem_designated, :annual_tuition_usd, :living_cost_annual_usd,
                        :scholarship_probability, :assistantship_probability,
                        :median_salary_usd_y1, :median_salary_usd_y5, :visa_type,
                        :visa_survival_prob, :effective_tax_rate, :monthly_rent_median_usd,
                        :website_url, TRUE
                    )
                """),
                prog,
            )
        
        # Seed Course Marketplace
        print(f"Seeding {len(COURSE_MARKETPLACE_SEED)} marketplace courses...")
        for course in COURSE_MARKETPLACE_SEED:
            await session.execute(
                text("""
                    INSERT INTO course_marketplace (
                        course_title, provider, category, affiliate_url, price_inr,
                        duration_hours, skill_tags, career_paths, ai_resilience_score,
                        commission_rate_pct, is_active
                    ) VALUES (
                        :course_title, :provider, :category, :affiliate_url, :price_inr,
                        :duration_hours, :skill_tags, :career_paths, :ai_resilience_score,
                        :commission_rate_pct, TRUE
                    )
                """),
                course,
            )
        
        await session.commit()
    await engine.dispose()
    print("Successfully seeded global_programs and course_marketplace tables!")


if __name__ == "__main__":
    asyncio.run(seed())

