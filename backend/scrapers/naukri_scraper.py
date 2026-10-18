"""
Naukri.com Job Postings Scraper
Extracts: job demand by role/city, salary ranges from job descriptions,
          required skills distribution, experience curves.

Uses Naukri's public job search (no auth required for basic listings).
"""
import re
import logging
from typing import List, Optional, Dict

from .base_scraper import BaseScraper, ScrapeResult

logger = logging.getLogger(__name__)

# Job roles to search — mapped to degree fields
SEARCH_TARGETS = [
    {"keywords": "software engineer developer", "field": "engineering-cs", "exp": "0,2"},
    {"keywords": "software engineer developer", "field": "engineering-cs", "exp": "3,5"},
    {"keywords": "software engineer developer", "field": "engineering-cs", "exp": "6,10"},
    {"keywords": "data scientist machine learning", "field": "engineering-cs", "exp": "0,5"},
    {"keywords": "mechanical engineer manufacturing", "field": "engineering-non-cs", "exp": "0,5"},
    {"keywords": "civil engineer construction", "field": "engineering-non-cs", "exp": "0,5"},
    {"keywords": "doctor physician medical officer", "field": "medicine", "exp": "0,5"},
    {"keywords": "chartered accountant finance", "field": "commerce", "exp": "0,5"},
    {"keywords": "management consultant MBA", "field": "management", "exp": "0,5"},
    {"keywords": "lawyer legal associate", "field": "law", "exp": "0,5"},
    {"keywords": "UX designer product designer", "field": "design", "exp": "0,5"},
]

# Salary regex patterns in job descriptions
SALARY_PATTERNS = [
    r"₹?\s*(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*(?:L|lakh|lakhs|LPA)",
    r"(\d+(?:\.\d+)?)\s*(?:L|lakh|lakhs|LPA)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*(?:L|lakh|lakhs|LPA)",
    r"(\d+(?:,\d+)*)\s*(?:to|-)\s*(\d+(?:,\d+)*)\s*per\s*(?:month|annum|year)",
    r"(?:CTC|ctc|salary).*?(\d+(?:\.\d+)?)\s*(?:L|lakh|LPA)",
]


class NaukriScraper(BaseScraper):
    """
    Scrapes Naukri.com for job posting data — demand signals and salary ranges.

    Note: Naukri has a JSON-based search API used internally by their React app.
    We target that endpoint which returns structured job data.
    """

    SOURCE_NAME = "naukri"
    REQUEST_DELAY = 2.0
    NAUKRI_API = "https://www.naukri.com/jobapi/v3/search"
    MAX_PAGES = 5   # scrape up to 5 pages per query (20 jobs/page = 100 max)

    def _extract_salary_from_text(self, text: str) -> Optional[Dict[str, int]]:
        """Extract salary range from job description text."""
        if not text:
            return None

        text = text.replace("\n", " ").replace(",", "")
        for pattern in SALARY_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    groups = match.groups()
                    if len(groups) >= 2 and groups[1]:
                        min_val = float(groups[0]) * 100_000  # LPA → INR
                        max_val = float(groups[1]) * 100_000
                        return {
                            "min_inr": int(min_val),
                            "max_inr": int(max_val),
                            "mid_inr": int((min_val + max_val) / 2),
                        }
                    elif len(groups) >= 1:
                        mid = float(groups[0]) * 100_000
                        return {"min_inr": None, "max_inr": None, "mid_inr": int(mid)}
                except (ValueError, IndexError):
                    continue
        return None

    def _extract_skills(self, job: dict) -> List[str]:
        """Extract key skills list from Naukri job object."""
        skills = job.get("keySkill", [])
        if isinstance(skills, list):
            return [s.get("label", s) if isinstance(s, dict) else s for s in skills[:10]]
        return []

    async def _search_jobs(self, keywords: str, exp_range: str, page: int = 1) -> List[dict]:
        """Call Naukri job search API and return raw job list."""
        try:
            headers = {
                "Accept": "application/json",
                "appid": "109",
                "systemid": "Naukri",
                "Referer": "https://www.naukri.com/",
            }
            params = {
                "noOfResults": 20,
                "urlType": "search_by_key_loc",
                "searchType": "adv",
                "keyword": keywords,
                "experience": exp_range,
                "pageNo": page,
                "k": keywords,
                "seoKey": keywords.replace(" ", "-"),
                "src": "jobsearchDesk",
            }
            resp = await self.get(
                self.NAUKRI_API,
                params=params,
                headers=headers,
            )
            data = resp.json()
            jobs = data.get("jobDetails") or data.get("jobDetailsDTOList") or []
            if jobs:
                return jobs
        except Exception as e:
            logger.warning(f"[Naukri] API call failed for '{keywords}': {e}")
        return await self._search_jobs_html(keywords, page)

    async def _search_jobs_html(self, keywords: str, page: int) -> List[dict]:
        """Listing HTML still exposes a result count when jobapi is recaptcha-gated."""
        seo = keywords.replace(" ", "-")
        url = f"https://www.naukri.com/{seo}-jobs-{page}" if page > 1 else f"https://www.naukri.com/{seo}-jobs"
        try:
            resp = await self.get(url, headers={"Accept": "text/html", "Referer": "https://www.naukri.com/"})
            text = resp.text
            count_match = re.search(r"(?:of|1\s*-\s*\d+\s+of)\s*([\d,]+)", text, re.I)
            title_match = re.search(r"\"title\"\s*:\s*\"([^\"]{5,80})\"", text)
            jobs: List[dict] = []
            if count_match:
                jobs.append({
                    "jobId": f"html-{seo}-{page}",
                    "title": title_match.group(1) if title_match else keywords,
                    "companyName": "",
                    "jobDescription": "",
                    "_html_count": float(count_match.group(1).replace(",", "")),
                })
            return jobs
        except Exception as e:
            logger.warning(f"[Naukri] HTML search failed for '{keywords}': {e}")
            return []

    async def scrape(self) -> List[ScrapeResult]:
        results: List[ScrapeResult] = []
        total_jobs_processed = 0

        for target in SEARCH_TARGETS:
            keywords = target["keywords"]
            field = target["field"]
            exp = target["exp"]

            logger.info(f"[Naukri] Scraping: '{keywords}' exp={exp}")
            target_count = 0
            salary_mids: List[int] = []
            source_url = f"https://www.naukri.com/{keywords.replace(' ', '-')}-jobs"

            for page in range(1, self.MAX_PAGES + 1):
                jobs = await self._search_jobs(keywords, exp, page)
                if not jobs:
                    break

                html_count = jobs[0].get("_html_count") if jobs else None
                if html_count:
                    target_count = max(target_count, int(html_count))
                    total_jobs_processed += 1
                    break

                for job in jobs:
                    total_jobs_processed += 1
                    target_count += 1
                    desc = job.get("jobDescription", "") or job.get("description", "")
                    salary_range = self._extract_salary_from_text(desc)
                    if salary_range and salary_range.get("mid_inr"):
                        salary_mids.append(int(salary_range["mid_inr"]))

                if len(jobs) < 20:
                    break

            if target_count:
                results.append(ScrapeResult(
                    program_id=None,
                    field_name="naukri_job_demand",
                    raw_value=str(target_count),
                    parsed_value=float(target_count),
                    unit="COUNT",
                    source_url=source_url,
                    metadata={
                        "degree_field": field,
                        "exp_range": exp,
                        "keywords": keywords,
                    },
                ))
            if salary_mids:
                salary_mids.sort()
                mid = salary_mids[len(salary_mids) // 2]
                results.append(ScrapeResult(
                    program_id=None,
                    field_name=f"naukri_salary_{field}",
                    raw_value=str(mid),
                    parsed_value=float(mid),
                    unit="INR",
                    source_url=source_url,
                    metadata={"degree_field": field, "exp_range": exp},
                ))

        logger.info(f"[Naukri] Processed {total_jobs_processed} jobs → {len(results)} data points")
        return results
