# VividhEdu / IndiaLens — Codebase Audit & Handoff

Audit date: 2026-09-25. Reviewed the full repo: `backend/` (FastAPI, ~17.3k LOC Python),
`indialens/` (Next.js 14 App Router, 89 TS/TSX files), `db/` schema, `.github/workflows`,
deployment configs, and the Antigravity-era handoff docs.

## 0. TL;DR

This is a genuinely substantial build, not a toy. The product surface is broad and the ML
layer is real. But the architecture has a **split-brain data layer** that is the single
biggest structural problem, and several **security holes that must be fixed before any
public launch**. The Antigravity artifacts (welcome docs, partnership art, co-lab commit
tags) are noise that should be archived, not deleted from history.

Priority order: **fix security → unify data access → then add tooling/MCP.**

---

## 1. What already exists (good — do not rebuild)

### Backend (FastAPI)
- **15 routers** across `/api`, `/api/v1`, `/api/v2`, `/api/admin`, `/api/ml`:
  colleges, analyze, admin, scrape, external, ai, analytics, marketplace,
  global_programs, portfolio, psychometric, admissions, ml, auth.
- **ML engine** (`backend/ml/`, ~11 modules): XGBoost salary quantiles, LSTM career
  trajectory, BERT salary NER, ROI computer, admissions engine, Markov career
  transitions, psychometric bank, nextgen engine, model registry, feature engineering,
  training pipeline. Models warm up at startup.
- **18 scrapers**: NIRF, AmbitionBox, Naukri, Indeed, Internshala, Reddit (PRAW),
  PayScale, PLFS, RBI, World Bank, Tavily, Jina, Crawl4AI, plus base/registry/status files.
- **9 services**: Gemini grounded + advisor, Tavily auto, psychometrics (3 modules),
  personal intelligence, global standards analytics, external APIs, adaptive CAT.
- **Integration registry** (`api/integrations.py`) — fail-closed design, exposes
  configured/missing env per integration. This is a good pattern; keep it.
- **Health endpoint** returns DB status, ML status, and integration matrix. Good.
- Sentry, slowapi rate limiting, structlog, Alembic migrations, Dockerfiles
  (API + Airflow), `render.yaml`, `railway.toml`, `vercel.json`, Airflow DAG.

### Database (Supabase Postgres, 25+ tables)
`colleges, degrees, programs, scrape_runs, data_points, roi_scores, salary_trajectories,
risk_indicators, placement_data, cost_data, anomalies, educator_feedback, student_reports,
personal_intelligence, macro_indicators, model_versions, job_postings, reddit_extractions,
course_marketplace, course_impressions, global_programs, portfolio_profiles, users,
user_saved_reports` — plus trigram indexes (`pg_trgm`), uuid-ossp. Schema design quality
is genuinely good: immutable `data_points` with `is_current` flip, anomaly thresholds,
model versioning, provenance columns.

### Frontend (Next.js 14)
17 pages, 30+ components, 3 hooks, API route proxy layer (`/api/v1/[...path]`,
`/api/v2/[...path]`, `/api/ml/[...path]`, `/api/admin/[...path]`), Supabase + NextAuth,
PostHog, Recharts, Tailwind, react-query, zod.

### Data sources wired
Supabase, Gemini (grounded w/ Google Search), Tavily, HuggingFace, Adzuna, JSearch,
data.gov.in, GitHub, Reddit, Resend, Upstash Redis, Sentry, Razorpay/Stripe (config only).

**Verdict: the feature surface is ~85% built. The problem is not missing features.**

---

## 2. Critical problems (fix before launch)

### 🔴 P0-1: Hardcoded Supabase credentials committed to source
`indialens/src/lib/supabase.ts` lines 10-13 embed a live project ref
(`sxqdidcddmesamnpxxsp`) and a legacy **anon JWT** as literal fallback defaults,
committed to git. `.env` is correctly gitignored, so this fallback is the only reason
the credential leaked.

> **Update (2026-09-25, 23:50):** the project uses Supabase's **new key format**. The
> publishable key (`sb_publishable_…`) replaced the legacy anon JWT, and `sb_secret_…`
> replaced the legacy `service_role` JWT. Both new keys are now wired into
> `backend/.env` and `indialens/.env.local` (both gitignored), and the hardcoded
> fallbacks were **removed from `supabase.ts` in PR #1**. The user has reviewed the
> secret-key handling and made an informed decision not to rotate at this time;
> rotating remains available as a one-click Supabase setting change if wanted later.

### 🔴 P0-2: RLS is enabled, but the "by token" policies are `qual = true` (unconditional)
> **CORRECTION (2026-09-25, verified live against the DB via Supabase MCP).** My first
> pass concluded "zero RLS" by grepping `backend/db/*.sql`. **That was wrong** — the SQL
> files simply do not contain the policies; they were applied out-of-band to the live
> database. Live verification shows **all 26 tables have RLS enabled with 1–4 policies
> each.** `users` and `user_saved_reports` are correctly scoped with `auth.uid() = id`.
> Disregard the earlier "no RLS" claim entirely.

The real, still-unresolved problem is narrower but serious. Three tables have a policy
named "by token" whose `qual` is literally `true`:

| Table | Policy | cmd | roles | qual |
|---|---|---|---|---|
| `student_reports` | Public access … by token | SELECT | anon, authenticated | **`true`** |
| `personal_intelligence` | Public access … by token | SELECT | anon, authenticated | **`true`** |
| `portfolio_profiles` | Public access … by token | SELECT | anon, authenticated | **`true`** |

`qual = true` means **no row filter at all.** Despite the "by token" name, these grant
*unconditional* `SELECT` to the `anon` role. The anon key ships in the client bundle,
so this is unauthenticated, unfiltered, enumerable read access to:
- `student_reports.profile_data` / `results_data` — 8 rows live: student budget,
  finances, risk tolerance, family context
- `personal_intelligence` — Gemini output + citations (0 rows today, but the policy is
  live and will expose every row the moment the feature is used)
- `portfolio_profiles` — **essays, activities, research artifacts** (0 rows today)

Verified: an anon-context read of `student_reports` returns all 8 rows. These tables are
also `INSERT`-able by anon (needed for the wizard flow), and `personal_intelligence` and
`portfolio_profiles` additionally have anon `UPDATE` with `qual=true` / `with_check=true`
— so anyone can **overwrite any student's portfolio or intelligence record.** That is
data destruction, not just disclosure.

Note the empty tables: `users`, `portfolio_profiles`, `personal_intelligence`,
`educator_feedback` are all 0 rows, so nothing has been leaked *yet*. `student_reports`
has 8 real rows — that is live student data.

**Fix (highest priority item in this document):**
1. Replace the three `qual = true` SELECT policies with token-scoped ones, e.g.
   `qual = (request.headers.get('x-report-token') = token)` — or better, revoke anon
   SELECT entirely and move report reads behind FastAPI.
2. **Drop anon `UPDATE` on `personal_intelligence` and `portfolio_profiles` entirely.**
   Writes should go through the backend with the service-role key.
3. Keep the anon `INSERT` on `student_reports` (the wizard needs it) but add a
   `with_check` that constrains shape/validity, and rate-limit it.
4. Add the CI guard from §5a so this class of bug cannot reappear.

### 🔴 P0-3: Payment upgrade endpoint has no payment verification — **OUT OF SCOPE (2026-09-25)**
> The user has decided not to go down the payments route. **Do not implement this.**
> Left as-is and flagged only so it is not mistaken for working billing. If it is ever
> reachable in production, disable it or gate it, since it grants premium for free.

`backend/api/routers/auth.py:400 upgrade_to_premium` takes a `payment_id` and
`gateway` from the request body, **never calls Razorpay or Stripe**, and flips
`is_premium = TRUE`. Any authenticated user can self-upgrade for free by POSTing
`{"payment_id": "x", "tier": "pro_lifetime"}`. There is no webhook signature
verification anywhere in the codebase. `stripe_webhook_secret` and `razorpay_key_secret`
are declared in config and never used.

Also note: **nothing in the codebase reads `is_premium` to gate any feature**, so
entitlements are unimplemented regardless of billing.

### ✅ P1-4: `JWT_SECRET` / `SECRET_KEY` hardcoded defaults — **FIXED in PR #1**
`config.py` shipped `secret_key = "change-me-in-production-use-32-char-minimum"`
and `jwt_secret = "the-project-jwt-secret-key-32-chars-min"`. If `JWT_SECRET` was unset
in a deployment, **every token was forgeable** — an attacker could mint a token with
`is_premium: true`.

**Done:** added a `model_validator` (`_reject_placeholder_secrets_in_production`) that
raises at boot when `environment=production` and any of `secret_key` / `jwt_secret` /
`api_key_admin` is a placeholder or `jwt_secret` is under 32 chars. Verified firing.
A real 64-char `JWT_SECRET` was generated and written to `backend/.env` (gitignored).

### 🟠 P1-5: Admin auth is a single static API key, compared non-constant-time
`admin.py:24` uses `x_api_key != settings.api_key_admin` — a plain `!=` string compare,
timing-attack-prone, and the default value is `admin-dev-key-change-in-production`.
Seven admin routes (anomaly review, feedback, scrape control) depend on it. It is
correctly wired as a `Depends` on all 7, which is good — but the key's default is weak
and the check should be `secrets.compare_digest`.

### 🟠 P1-6: Google OAuth verified via unauthenticated `tokeninfo` GET
`auth.py:180-193` fetches `https://oauth2.googleapis.com/tokeninfo?id_token=...` and
**swallows all exceptions** (`except Exception: logger.warning(...)`). If that call fails
for any reason, the code falls through to the code-exchange path, and if *that* also
yields no email, execution continues. It also never checks `email_verified`. Standard
practice is to verify the ID token signature locally against Google's JWKS
(`google-auth` library) and assert `aud`/`iss`/`email_verified`.

### 🟠 P1-10: Two `SECURITY DEFINER` views readable by `anon` (confirmed by Supabase Advisor)
`get_advisors --type security` returns one ERROR-level lint with 2 findings:
`public.v_programs_full` and `public.v_anomaly_queue` are `SECURITY DEFINER`, which makes
them enforce the **creator's** privileges rather than the querying user's — a standard
RLS-bypass vector. Verified: `has_table_privilege('anon', 'v_anomaly_queue', 'SELECT')`
is `true`, so anon can read the view even though `anomalies` itself has a policy.
`v_anomaly_queue` exposes the internal review pipeline (`prior_value`, `new_value`,
`delta_pct`, `reviewed_by`, `review_notes`, `status`). It should be service-role only.

`v_programs_full` is the view the frontend actually reads for colleges/explore, so its
anon read is intentional — but it must be recreated as `SECURITY INVOKER` (or kept
definer with a hard `REVOKE` from anon) so RLS on the underlying tables can still apply.

**Fix:** `ALTER VIEW v_anomaly_queue SET (security_invoker = true); REVOKE ALL ON
v_anomaly_queue FROM anon, authenticated;` and re-verify `v_programs_full` separately.

### 🟡 P2-7: CORS is partially env-driven, allowlist is short
`main.py` builds origins from `FRONTEND_URL` but hardcodes `https://indialens.in`. If
`FRONTEND_URL` is unset the default is `http://localhost:3000`, so a production deploy
with a missing env var silently blocks all browser traffic — a confusing failure mode.

### 🟡 P2-8: Test coverage is thin and uneven
5 test files in `backend/tests/`, all ML/analysis-focused
(`test_nextgen_engine`, `test_ml_pipelines_prd`, `test_gemini_grounded`,
`test_prd_mathematical_models`, `test_new_routers`). **Zero tests for auth, payments,
admin authorization, or RLS.** Given P0-2 and P0-3 are auth/money bugs, this is the gap
that let them ship. Also `.pytest_cache` and `.ruff_cache` are committed to the repo.

### 🟡 P2-9: Dead code from the Antigravity era
- `WELCOME_CURSOR.md`, `welcome_cursor_partner.jpg` (1.2MB), `.agent_handoff.md` —
  AI-partnership ceremony with no engineering value.
- `PRD_generator.py` (59KB), `patch_prd.py`, `patch_css_cover.py`, `prd_builder/`,
  `case_study_builder/`, `case_study_previews/`, `case_study_previews_32/`,
  `extracted_assets/`, and 4 large generated PDFs (`indialens.pdf` 2.1MB,
  `MASTER_CASE_STUDY.pdf` 4.9MB, `PROJECT_PRD.pdf` 2.0MB) + their HTML twins.
  That is **~12MB of generated documents in the working tree.**
- `.cursorrules` and the `[AI-CoLab: Antigravity]` commit convention — the tag is now
  meaningless and pollutes `git log`.

**Fix:** move docs/PDFs to a `docs/` folder or external drive, gitignore the preview
dirs, keep history intact but stop writing new co-lab entries.

- **Data completeness gap (found via MCP).** `v_programs_full` is the view the whole
  college/explore/report surface reads. Of the active programs, **19 have no current
  `placement_data` row**, so their `placement_rate_pct`, `median_salary_inr` and
  `highest_salary_inr` come back NULL. `mapSupabaseRowToRecord` then substitutes invented
  constants (`medianSalary ?? 1_200_000`, `rawPlacement ?? 88`, `totalSeats: 120`,
  `companiesVisited: 140`, `established: 1960`, `naacGrade: "A++"`). So a meaningful
  slice of the site's headline salary and placement numbers are **hardcoded fabrications
  presented as data**, not measurements. This is both a product-integrity problem and a
  disclosure risk — the schema is honest about what is missing, the frontend is not.
  Fix at the source: backfill `placement_data` for the 19 gaps, and make the frontend
  render an explicit "insufficient data" state instead of a plausible-looking number.

---

## 3. Architectural problem: the split-brain data layer

**This is the core structural issue and the reason the codebase feels unstable.**

There are two independent, uncoordinated data paths:

1. **Next.js → Supabase directly** via PostgREST with the anon key
   (`src/lib/supabase.ts`, `fetchSupabaseRest`) — used for colleges, stats, reports.
2. **Next.js → FastAPI** via `src/lib/backend.ts` and the catch-all proxies
   (`/api/v1/[...path]`, `/api/v2/[...path]`, `/api/ml/[...path]`) — for analyze,
   ML, AI, analytics, scrape, admin.

Consequences:
- **Auth logic is implemented twice, differently.** `next-auth` + Supabase on the
  frontend; hand-rolled PyJWT on the backend. A user authenticated in one is not
  necessarily recognized in the other. The frontend has `@supabase/supabase-js` AND
  `next-auth` AND a `lib/auth-context.tsx` — three auth surfaces.
- **Validation and business rules can diverge.** `mapSupabaseRowToRecord` in the frontend
  re-implements scoring defaults (`composite_score ?? 70`, `optionalityScore: 78`,
  `networkScore: 88`, `mobilityScore: 82`) as hardcoded fallbacks. The backend has real
  ML for exactly this. The frontend is quietly inventing numbers when a field is null.
- **RLS is enforceable, and mostly already correct** (corrected per P0-2). The remaining
  work is the three `qual = true` policies and the anon UPDATE grants — not a rewrite.
  The deeper problem is the *duplication*: `db/schema.sql` does not contain the policies
  that are actually live on the database. They were applied out-of-band and exist nowhere
  in the repo, so a fresh deploy or a new environment gets **no RLS at all.** That
  drift is the thing to fix, more than the individual policies.
- **Type contracts are duplicated by hand** — `CollegeDegreeRecord` in `mock-data.ts`
  must be kept in sync with `programs` + the view it queries, with no schema check.

**Recommended target architecture (pick one source of truth):**

> **All reads and writes go through FastAPI. The browser never touches Supabase
> directly. FastAPI is the only principal that holds the service-role key.**

- Move the report/profile/portfolio reads from `fetchSupabaseRest` to backend routers.
- Delete `DEFAULT_SUPABASE_URL` / `DEFAULT_SUPABASE_ANON_KEY` fallbacks.
- Then RLS becomes a defense-in-depth layer instead of the only thing standing between
  the internet and your user table.
- If you must keep direct client reads for SEO pages (college/explore), restrict them to
  a dedicated, RLS-locked **public** schema/view containing no PII, and keep it to
  `colleges/degrees/programs/roi_scores` only.

If instead you want to go **Supabase-first** (PostgREST + RLS + Edge Functions, drop
most of FastAPI), that is a legitimate choice too — but it means rewriting the ML serving
layer and the scraper orchestration. Given 17k LOC of working ML, **backend-first is
far cheaper.** Do not try to run both in parallel.

---

## 4. MCP servers to connect — recommendations

`.cursor/mcp.json` is currently `{"mcpServers": {}}` — empty. Here is what this
codebase would actually benefit from, in priority order.

### Tier 1 — connect now (high value, low friction)

| MCP server | Why this repo needs it |
|---|---|
| **Supabase MCP** | **Connected 2026-09-25 — working.** Already paid for itself: it disproved my "no RLS" claim, surfaced the `SECURITY DEFINER` view lint, and found the 19 `placement_data` gaps. Keep it as the primary tool for the security work in §5a and for any future schema question. The project already ships a Supabase skill, so this is aligned. |
| **GitHub MCP** | Manage issues/PRs, review the Antigravity commit backlog, and wire up the existing `.github/workflows`. |
| **Context7 / library docs MCP** | Pinned deps here are old and unusual: `next@14.2.35`, `torch==2.4.0`, `transformers==4.44.0`, `crawl4ai==0.4.3`, `mangum==0.17.0`. API drift on these is a real time sink. Docs lookup prevents guessing. |
| **Filesystem / Fetch MCP** | For the large `MASTER_CASE_STUDY.html` / PRD artifacts and the `extracted_assets/` tree — reading and reorganizing these is awkward with shell tools alone. |

### Tier 2 — connect when the corresponding work starts

| MCP server | Trigger |
|---|---|
| **Playwright / browser MCP** | There is no E2E test suite. The app has 17 pages, a multi-step onboarding wizard, psychometric radar charts, and a report renderer that was already patched once for a crash. A browser MCP lets you actually click through onboarding → analyze → report and catch SSR/runtime errors that unit tests miss. |
| **Sentry MCP** | `sentry-sdk` is already wired. Connecting Sentry lets you triage real production errors instead of guessing. |
| **PostHog MCP** | `posthog-js` is installed. Connect to read the funnel for `onboard → analyze → report` and see where users actually drop. |
| **Vercel MCP** | Frontend deploys are Vercel. Useful for build logs, env var management, and preview deployments during the RLS migration. |

### Tier 3 — probably not worth it

- **Anything ML-focused (Weights & Biases, MLflow).** `backend/ml/model_registry.py`
  plus the `model_versions` table already do registry + versioning, and artifacts are
  local `.pkl` files gitignored under `ml/artifacts/`. Adding a third ML tracker is
  overhead. Revisit only if you start training on GPU at scale.
- **Airflow MCP.** One DAG exists. GitHub Actions cron already covers the weekly scrape.
  Airflow is a separate Dockerfile with no evidence of a live deployment — either
  commit to running it or delete the Dockerfile.

---

## 5. Backends to create (not connect) — the work that's missing

Connecting an MCP server gives you *tools*. These are *systems* that don't exist yet.

### 5a. A database-migration + RLS enforcement layer — **build first**
The schema file and the live database have diverged: `backend/db/schema.sql` (646 lines)
creates 25 tables and **contains no RLS statements at all**, yet the live DB has 26 tables
with RLS and 60+ policies. Alembic has only two revisions
(`0001_baseline_schema.py` is 50 lines, `0002_personal_intelligence.py` is 35 lines) —
nowhere near enough to represent the live schema. Consequences:
- A staging DB built from `alembic upgrade head` would have **no RLS whatsoever**, i.e.
  a full copy of the anon-read problem, silently.
- Nobody can review a policy change in a PR, because the policies are not in the repo.
- `create_branch` on Supabase replays *migrations* — so branches inherit this gap too.

Concretely:
- Write the real policies as a versioned Alembic migration (or `supabase/migrations/*.sql`)
  so they land in git and in every environment.
- Add a reconciliation check that diffs the migration-built schema against production and
  fails CI on drift.
- Add `scripts/audit_rls.py` (or an equivalent CI step) that asserts no table holding PII
  has a policy whose `qual`/`with_check` is bare `true`, and that no anon `UPDATE`/
  `DELETE` policy exists on student-owned tables. This is the control that stops the
  class of bug, not the one-time fix.
- Also fold in the view fix from P1-10 (`v_programs_full`, `v_anomaly_queue` are
  `SECURITY DEFINER` and readable by `anon`).

### 5b. A payments service — **must be real before monetization**
Right now `/api/v1/auth/premium/upgrade` is a free-premium button. You need:
- Razorpay order creation server-side, webhook endpoint with HMAC signature
  verification, idempotency table, and reconciliation.
- An entitlements layer: `premium_until` exists in the schema but **nothing in the
  codebase reads it to gate features.** Verified: no route checks `is_premium`. So even
  a correct payment system wouldn't currently restrict anything. This needs a
  `require_premium` dependency applied to the paywalled routers.

### 5c. A secrets manager / config validation service
Instead of a `.env` with 20+ keys and weak defaults, build a boot-time validator:
- Reject default/short secrets in production.
- Fail loudly on missing required keys rather than degrading silently.
- Single source of truth for which integrations are configured — `integrations.py`
  already does this well; extend it to *enforce*, not just *report*.

### 5d. An observability + cost backend
- Sentry exists but there's no structured tracing across the ML paths.
- `structlog` is installed. Wire JSON logs with request IDs through the FastAPI
  middleware and the Next.js server, so a slow report can be traced end to end.
- Add the missing cost ceiling: Vercel free tier + Supabase free tier + Render's
  15-min sleep behavior (documented in DEPLOY.md) means an unnoticed ML warmup loop
  can burn the budget. Add alerting on function invocations and DB size.

### 5e. A data-quality monitoring service
The scraper/anomaly infrastructure is good but manual. Build:
- A daily freshness check per source with a freshness badge (the frontend already has
  a `DataFreshnessBadge` component) driven by real `scraped_at` values instead of the
  hardcoded `dataFreshnessDays: 12` in `mapSupabaseRowToRecord`.
- An anomaly digest that auto-creates review tasks instead of requiring someone to
  poll `/api/admin/anomalies`.

### 5f. A proper test/CI backend
- Add auth, payment, and RLS tests (currently zero).
- GitHub Actions currently has `deploy_check`, `weekly_scrape`, `daily_cache_refresh` —
  **but no lint/test/typecheck job.** That's why the auth bugs shipped.
- Add `ruff`, `mypy`, and `pytest` to CI. Remove committed `.pytest_cache`/`.ruff_cache`.

---

## 6. Suggested execution order

0. **Rotate the Supabase secret key now** (it was shared in plaintext in chat), then
   propagate the new value to Vercel / Render / GitHub Actions / `.env`.
1. **Fix the three `qual = true` policies** and drop anon `UPDATE` on
   `personal_intelligence` + `portfolio_profiles` (§P0-2). This is the live-data
   exposure — 8 real student reports are currently world-readable.
2. **Land the RLS policies + the real schema as migrations in git** (§5a). Right now a
   fresh environment gets no RLS at all; this drift is the systemic version of the bug.
3. **Fix the `SECURITY DEFINER` views** (§P1-10); `v_anomaly_queue` should be
   service-role only.
4. **Strip hardcoded credentials from `supabase.ts`**; add a CI secret scan.
5. **Delete/disable the premium upgrade endpoint** until webhooks exist (§P0-3).
6. **Add production secret validation** to `config.py` (§P1-4).
7. **Add the missing CI job** (ruff + pytest + typecheck + RLS audit) (§5f).
8. **Backfill the 19 `placement_data` gaps** and stop fabricating fallback numbers in the
   frontend (§3 data-completeness note).
9. **Then** unify the data layer — the big refactor, once the security floor is solid.
10. **Then** archive Antigravity artifacts and generated PDFs.
11. **Later:** Playwright E2E, payments/entitlements, observability.

---

## 7. One note on the Antigravity handoff

The `.agent_handoff.md` ledger and `WELCOME_CURSOR.md` describe a "partnership" framing
and mandate a `[AI-CoLab: <Agent>]` commit convention. The git log shows nearly every
commit tagged `[AI-CoLab: Antigravity]`, which makes authorship and intent impossible to
distinguish at `git blame` time.

If you're cutting Antigravity off, I'd suggest:
- Keep the history (rewriting 100+ commits to strip tags is risky and low value).
- Delete `WELCOME_CURSOR.md` and `.agent_handoff.md` — they are pure ceremony.
- Stop writing the tag; use conventional commits (`feat:`, `fix:`, `security:`) so the
  next person to read `git log` gets real signal.
- Replace `.cursorrules` with actual project rules that describe *this* codebase's
  conventions and the security constraints above, rather than partnership trivia.
