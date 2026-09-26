# Database linkage audit — 2026-09-26

Read-only verification. No data was modified. Run before/after any scraper work so
regressions are attributable.

## Verdict

**Structurally linked and serving real results. Not "fully and wholly" sound.**

Every join resolves, zero orphans, all public endpoints return data, and the live
site renders. But three data-quality defects mean some published numbers are not
measurements. Two of the three are things a scraper cannot fix, because the
schema has no column to scrape into.

---

## 1. Structural integrity — PASS

| Relationship | Rows | Resolved | Orphaned |
|---|---|---|---|
| `programs.college_id → colleges` | 73 | 73 | 0 |
| `programs.degree_id → degrees` | 73 | 73 | 0 |
| `placement_data.program_id → programs` | 54 | 54 | 0 |
| `cost_data.program_id → programs` | 54 | 54 | 0 |
| `roi_scores.program_id → programs` | 360 | 360 | 0 |
| `salary_trajectories.program_id → programs` | 292 | 292 | 0 |
| `risk_indicators.program_id → programs` | 30 | 30 | 0 |

All 17 foreign keys are real `pg_constraint` entries, not convention. RLS is
enabled on all 24 tables.

## 2. Data actually flows — PASS

`v_programs_full` joins 30 columns across programs/colleges/degrees/cost/placement/
ROI/risk. Queried through the anon key exactly as the frontend does:

```
200 OK — ranked output, e.g.
  Christ University / B.Com Hons   76.00  ₹480,000   72%
  NIFT Delhi        / B.Des        75.60  null       null
  NID Ahmedabad     / B.Des        75.00  ₹900,000   88%
```

Live site: `/`, `/compare`, `/explore`, `/analyze`, and a real report page all
return 200. Every table the frontend reads returns rows via PostgREST.

## 3. Coverage — PARTIAL

Of 73 active programs:

| Data | Present | Missing |
|---|---|---|
| ROI scores | 73 | 0 |
| Salary trajectories | 73 | 0 |
| Risk indicators | 15 | 58 |
| Placement data | 54 | **19** |
| Cost data | 54 | **19** |

The same 19 programs lack both placement and cost: IIM Bangalore/Calcutta/Lucknow,
all six IITs, IIIT Hyderabad, the four NITs, CMC Vellore, JIPMER, NID, NIFT, NLU
Delhi, NALSAR, XLRI. These are the highest-ranked institutions in the catalogue.

## 4. Defects

### 4a. `mobility_score` is a constant, not a measurement

`0.8210` for **all 73 programs**, stddev `0.00`.

Full chain, confirmed end to end:
`risk_indicators.geographic_concentration = 0.25` for all 15 rows →
`roi_computer.py:525` `f3_mobility = 0.90 * (1 - 0.35 * geo_conc)` →
`0.8213` → stored as `0.8210`.

### 4b. 7 of 8 risk vectors are constants

| Vector | Distinct values (of 15) |
|---|---|
| `ai_automation_prob` | 15 — real variation |
| `salary_volatility` | 1 (0.20) |
| `industry_cyclicality` | 1 (0.22) |
| `credential_inflation` | 1 (0.18) |
| `geographic_concentration` | 1 (0.25) |
| `regulatory_risk` | 1 (0.10) |
| `work_life_quality` | 1 (0.72) |
| `physical_health_risk` | 1 |

`risk_score` still varies because it is dominated by `ai_automation_prob`, but 7
of its 8 inputs are flat. Composite stddev is only `1.43` across all 73 programs.

### 4c. 19 programs are scored on invented inputs

`compute_roi.py:469,471` substitutes defaults for missing data:

```python
total_cost     = float(program.get("total_cost_of_degree_inr") or 1_000_000.0)
placement_rate = float(program.get("placement_rate_pct") or 0.65)
```

`compute_roi` is a `LEFT JOIN` over `cost_data`/`placement_data`, so those 19 rows
join as NULL and silently take the defaults. **26% of the catalogue publishes a
composite score derived from a fabricated ₹10L cost and 65% placement rate.**

This is why NIFT Delhi (75.60) outranks AIIMS Delhi on composite while showing no
salary or placement at all — the score is real, but it was computed from invented
inputs and is not comparable with the other 54.

### 4d. No scraper has ever run

`scrape_runs` contains 3 rows, all `source_name = 'seed_script'`, all 15 records.
No NIRF/AmbitionBox/PayScale scrape has ever completed. All placement data is
hand-seeded from two sources (`nirf_2024_public` 15, `nirf_ambitionbox_benchmark`
39), academic year 2023-24 only.

`model_versions` has one row, `v1.0-seed`, `is_live = true`, trained on **15
records**, with `mse`, `r2_score`, `mape_salary`, `recall_at_5` all NULL. The
metrics were never computed, so there is no evidence the model performs.

### 4e. Universally null columns

All 54 current `placement_data` rows have NULL `highest_salary_inr`,
`companies_visited`, `ppo_count`. The frontend now renders "not measured" for
these, which is correct — but no scraper currently targets them.

## 5. What is genuinely sound

- `salary_trajectories`: 292 rows, 73 programs, years 1–20, **zero NULLs, zero
  inverted percentiles** (p25 ≤ p50 ≤ p75 holds everywhere). ROI rests on this and
  it holds up.
- `placement_data` sanity: median ₹4.8L–₹33.2L, avg ₹13.4L, rate 70–100%, no
  nulls, no non-positive salaries, no `highest < median`. The two 100% rows are
  AIIMS MBBS and IIM Ahmedabad MBA from NIRF — plausible, not errors.
- `roi_scores`: 73/73 populated, none null, none out of 0–100.
- Referential integrity and RLS both hold.

---

## Recommended order

1. **Decide the 19.** Scrape cost + placement for them, or exclude them from
   rankings until real data exists. Do not leave them scored on defaults — that is
   the one issue that makes published numbers wrong rather than incomplete.
2. **Add columns for the flat risk vectors** (or derive them from something real).
   A scraper cannot fix constants that have no per-program source.
3. **Make `compute_roi` refuse to score incomplete programs** — return `None`
   instead of defaulting. This is a one-line change that removes defect 4c at the
   source and prevents recurrence.
4. **Populate the null placement columns** from NIRF, which publishes them.
5. **Compute and store real model metrics** in `model_versions`.

## Note for whoever owns the scraper

Defects 4a/4b need new source data, not a working scraper — there is nowhere to
scrape *into* for 7 of the 8 risk vectors. 4c/4d/4e are directly in scope for
scraper work. Re-run this audit afterwards; the coverage table in §3 is the
before-picture.

---

# Remediation log — 2026-09-26 (later)

The three defects above were fixed, and four further defects were found while
verifying the fixes. Production state after remediation is recorded here.

## Fixed

| # | Defect | Fix |
|---|---|---|
| 4c | `compute_roi` defaulted missing fee/placement to ₹10L / 65% | Fee and placement are now **required**. Returns `data_complete=False` with `None` figures and a `data_issues` list instead of a number. |
| 4d | No scraper had ever completed | `BaseScraper.update_run_status` bound `:status` as both the `scrape_status` enum and a text comparison, so asyncpg raised `AmbiguousParameterError` and **every** run failed at its first status write. Now `CAST(:status AS scrape_status)`. |
| — | 19 programs published fabricated ROI as `"verified"` | Scores nulled and `data_label` set to `pending_source_data`. Labels recomputed to `computed` / `pending_source_data` from actual source rows. |
| — | `/colleges/roi-index` returned **503 for every caller** | `placement_rate_pct` is `NUMERIC` → `Decimal`; `Decimal / float` and `Decimal > int` both raise. Coerced to `float` at the boundary. |
| — | `scripts/compute_roi.py` wrote `0.0/0.35/0.70/0.75/0.80` sub-scores when the model returned nothing | Skips programs where `data_complete` is false. |
| — | Zero-record scrapes reported `success` | `ScrapeYieldedNothing` — a run that parses or persists 0 rows is recorded as `failed` with the reason. |
| — | Six scrapers were unreachable via `POST /api/scrape/trigger/{name}` | `jina, crawl4ai, indeed, internshala, college_placement` added to `SCRAPER_REGISTRY`. |
| — | `from ..pipeline...` in `BaseScraper.persist_results` failed on every run | Absolute import with a `backend.`-prefixed fallback. |
| — | `pyjwt` was never declared in `requirements.txt`; `email-validator` was declared but unresolvable | `PyJWT==2.9.0` added. With both present the app serves **75 routes instead of 68** — all 7 `/api/auth/*` routes had been silently missing. |

## Verified live

Scrapers against the live database and the real upstream sources:

| Source | Result | Records |
|---|---|---|
| `nirf` | ✅ success | 40 |
| `plfs` | ✅ success | 24 |
| `internshala` | ✅ success | 12 |
| `worldbank` | ✅ success | 4 |
| `ambitionbox` | ❌ failed (honest) | 0 — upstream markup changed |
| `payscale` | ❌ failed (honest) | 21 parsed, 0 persisted — name matching drifted |
| `naukri`, `indeed`, `tavily`, `college_placement` | ❌ failed (honest) | 0 |

The failures are now **visible** rather than logged as healthy runs. They are
extractor drift, not infrastructure faults.

## ROI state after remediation

- 54 programs recomputed from real `cost_data` + `placement_data`.
- 19 remain unscored and labelled `pending_source_data` — they are no longer
  ranked, and the API returns `roi_data_complete: false` so the UI can say
  "not enough data" instead of rendering a number.
- `scripts/compute_roi.py` reports: `ROI recomputed for 54 programs (19 skipped
  — insufficient real data)`.

## Still open (unchanged, not fixable by a scraper)

- 7 of 8 risk vectors are hardcoded constants in `roi_computer.py` with no
  per-program source column.
- `model_versions` has one row (`v1.0-seed`) trained on 15 records with all
  metrics NULL — no evidence the model performs.
- 54 `placement_data` rows have NULL `highest_salary_inr`, `companies_visited`,
  `ppo_count`.

