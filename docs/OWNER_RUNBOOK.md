# Owner Runbook

Actions that need a human. Everything else is automated.

---

## 1. Apply the RLS migration (do this when convenient — not yet done)

**Status:** `backend/db/migrations/0003_rls_harden_student_data.sql` is committed
but has **never been run against the live database.**

The live database still has the permissive policies. 8 real student reports are
currently world-readable via the anon key, and any anonymous caller can overwrite
`portfolio_profiles` and `personal_intelligence` rows.

The frontend change that passes `x-report-token` ships in the same PR, so they
must land together. **Merge PR #2 first**, then apply.

### How to apply

In the Supabase dashboard → **SQL Editor** → paste the file → **Run**.

Or from a machine with the connection string:

```bash
cd backend
psql "$DATABASE_URL_SYNC" -f db/migrations/0003_rls_harden_student_data.sql
```

### Verify it worked

Paste into SQL Editor — every result should be empty:

```sql
SELECT tablename, policyname, qual FROM pg_policies
WHERE schemaname='public'
  AND (qual = 'true' OR with_check = 'true');

SELECT count(*) FROM pg_views
WHERE schemaname='public' AND schemaname='public'
  AND viewname IN ('v_programs_full','v_anomaly_queue')
  AND NOT options LIKE '%security_invoker=true%';
```

### If something breaks

Report pages use `GET /api/report/<token>`. They pass the token through
`fetchSupabaseRest(..., { reportToken })`, which sets the `x-report-token`
header the new policies match on. If a report shows "not found" after applying,
that header is not reaching PostgREST — check `indialens/src/lib/supabase.ts`.

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

| Check | Blocks merge? |
|---|---|
| `type-check` — `tsc --noEmit` | yes |
| `python-check` — ruff | yes |
| `Vercel – vivdhedu-1` — real production build | yes |
| `backend-tests` — 66 pytest | yes |
| `secret-scan` — committed credentials | yes |
| `rls-audit` — unconditional policies, SECURITY DEFINER views | yes |

`main` is protected: nothing lands without those passing. Never push to `main`
directly — branch and open a PR.
