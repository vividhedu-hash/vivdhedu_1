# Owner Runbook

Actions that need a human. Everything else is automated.

---

## 1. Apply the RLS migration

**Status:** ready to run. The frontend half (which sends `x-report-token`) is
already merged and live, so the two are in sync.

The live database still has the permissive policies — 7 real student reports are
currently world-readable via the anon key, and any anonymous caller can overwrite
`portfolio_profiles` and `personal_intelligence` rows.

**File:** `backend/db/migrations/0003_rls_harden_student_data.sql`

### Option A — Supabase dashboard (easiest)

1. Open your project at **supabase.com/dashboard**
2. Left sidebar → **SQL Editor** → **New query**
3. Open the file above, select all, copy, paste
4. Click **Run**

The first statement is a preflight block. It may print a `NOTICE` about removing
debug rows — that is expected and already accounted for. **If you instead see a
red `EXCEPTION` error, stop.** That means a real row violates the shape check
and nothing was changed; paste the error to me.

### Option B — command line

```bash
cd /Users/indian/Downloads/VividhEdu/VividhEdu/backend
psql "$DATABASE_URL_SYNC" -f db/migrations/0003_rls_harden_student_data.sql
```

`DATABASE_URL_SYNC` is the plain `postgresql://` URL (not the `+asyncpg` one)
and is already in `backend/.env`. If `psql` is not installed: `brew install libpq`.

### Verify it worked

Paste this into SQL Editor. **All three results should be empty / zero.**

```sql
-- 1. The 5 bad policies, scoped to the 3 student-owned tables.
--    Before: 5 rows.  After: 0 rows.
--    (Only looks at these 3 tables on purpose — the public catalogue tables
--     have qual='true' policies that are CORRECT, since they hold no PII.)
SELECT tablename, policyname, COALESCE(qual,'-') AS using_expr,
       COALESCE(with_check,'-') AS check_expr
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('student_reports','personal_intelligence','portfolio_profiles')
  AND (qual = 'true' OR with_check = 'true')
  AND policyname NOT LIKE 'Service role%'
  AND policyname NOT LIKE 'Public insert%'
ORDER BY tablename;

-- 2. Both views should show is_hardened = true
SELECT c.relname AS viewname,
       'security_invoker=true' = ANY(coalesce(c.reloptions, '{}')) AS is_hardened
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('v_programs_full','v_anomaly_queue');

-- 3. Should return false: anon can no longer read the internal view
SELECT has_table_privilege('anon','public.v_anomaly_queue','SELECT') AS anon_can_read;
```

### Confirm the public site still works

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://vivdhedu-1.vercel.app/compare
```

Should print `200`. Then open one real report link and confirm the charts render.

### If something breaks

Report pages use `GET /api/report/<token>`. They pass the token through
`fetchSupabaseRest(..., { reportToken })`, which sets the `x-report-token`
header the new policies match on. If a report shows "not found" after applying,
that header is not reaching PostgREST — check `indialens/src/lib/supabase.ts`.

Public catalogue pages (`/`, `/compare`, `/explore`, `/college/[id]`) read
`colleges`/`degrees`/`programs`/`roi_scores`, which this migration does not
touch. Those cannot break.

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

