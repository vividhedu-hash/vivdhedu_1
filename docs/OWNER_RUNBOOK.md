# Owner Runbook

Actions that need a human. Everything else is automated.

---

## 1. RLS migration — ✅ APPLIED

**Applied to production on 2026-09-26.** Verified working. Nothing to do here.

The permissive policies are gone. `anon` can no longer read, update, or delete
student-owned rows unless the caller presents the matching `x-report-token`.

### What was verified after applying

| Check | Result |
|---|---|
| anon dumps `student_reports` with no token | `[]` — blocked |
| anon reads with a **wrong** token | `[]` — blocked |
| anon reads with the **correct** token | 1 row — works, share model intact |
| anon PATCHes a real report | 0 rows affected, data byte-identical |
| anon DELETEs a real report | 0 rows affected, row still present |
| anon reads `v_anomaly_queue` | `401 permission denied` — closed |
| anon reads `v_programs_full` + public tables | `200` — catalogue intact |
| `GET /api/report/<token>` end-to-end | `200`, full report JSON |
| `/`, `/compare`, `/explore`, `/analyze` | all `200` |

Note: PostgREST returns `204` for a DELETE that matched zero rows, not an error
code. An empty result is the success signal here, not a non-2xx status.

### If you ever need to undo it

`backend/db/migrations/0003_rollback.sql` restores the exact pre-migration
state, captured from live before applying. It re-opens the vulnerabilities, so
prefer fixing the `x-report-token` path in
`indialens/src/lib/supabase.ts` instead.

---

## 2. Delete the duplicate Vercel project

`vivdhedu-1-47pi` is a second project attached to the **same** repo on the same
production branch. Every push builds twice and you pay for two Hobby projects.

1. vercel.com → **vivdhedu-1-47pi**
2. Settings → scroll to the bottom → **Delete Project**
3. Then disconnect it from GitHub so it stops deploying:
   Settings → Git → **Disconnect**

Keep `vivdhedu-1`. That is the live one.

---

## 3. Enable the 19 missing placement records — or leave them blank

19 of 73 active programs have no current `placement_data` row:

CMC Vellore (MBBS), IIIT Hyderabad, IIM Bangalore, IIM Calcutta, IIM Lucknow,
IIT Guwahati, IIT Hyderabad, IIT Kanpur, IIT Kharagpur, IIT Roorkee,
JIPMER Puducherry, NALSAR Hyderabad (LLB), NID Ahmedabad, NIFT Delhi,
NIT Calicut, NIT Surathkal, NIT Warangal, NLU Delhi, XLRI Jamshedpur.

All 19 **do** have ROI scores — only placement is missing. Until real numbers
are scraped, those programs correctly render "No data" rather than an invented
salary. That is intentional.

To populate them, run the placement scraper for those colleges rather than
hand-writing rows — see `backend/scrapers/college_placement_scraper.py`.

---

## 4. Optional: rotate the Supabase secret key

Not urgent, and it is your call. The key works and lives only in gitignored
`.env` files plus your CI/Vercel env. If you do rotate, update it in four
places: `backend/.env`, `indialens/.env.local`, Vercel (both projects), and
GitHub Actions secrets.

---

## 5. What is now automated

`main` is protected. All six of these must pass before a PR can merge:

| Check | What it does |
|---|---|
| `type-check` | `tsc --noEmit` |
| `python-check` | ruff on `scrapers/` + `api/` |
| `Vercel – vivdhedu-1` | real production build |
| `backend-tests` | 50 pytest, sandboxed off the live database |
| `secret-scan` | blocks committed Supabase secrets, legacy JWTs, live keys |
| `rls-audit` | blocks unconditional policies and `SECURITY DEFINER` views |

Never push to `main` directly — branch and open a PR. Admin bypass is off, so
this applies to you too.

Note: `Vercel – vivdhedu-1-47pi` is **not** a required check, which is
intentional — it disappears when you delete that project (§2).

