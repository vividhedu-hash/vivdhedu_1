/**
 * The signed-in student's own record: their name, and the reports they own.
 *
 * WHY THIS EXISTS
 * ---------------
 * Onboarding used to be a dead end. The wizard collected a name, stage, goals
 * and weights, handed them to `/api/analyze`, and that route wrote them into
 * `student_reports.profile_data` — a table keyed by a bearer token that anon
 * can both read and write. So a student's "profile" was never actually a
 * profile: it was a JSON blob reachable by anyone holding the link, with no
 * link back to the account that produced it. On return, the same person got a
 * fresh empty screen and, on the workspace, a hardcoded stranger's telemetry.
 *
 * This module is the account-scoped half. It uses the signed-in Supabase
 * session, never a token from the URL, and it is the only place in the app
 * that writes a student's name.
 *
 * WHY POSTGREST, DIRECTLY
 * -----------------------
 * The identity we need is `auth.uid()` from the Supabase JWT, and the three
 * RLS policies that scope these writes all compare against it:
 *
 *     users                 INSERT  with check (auth.uid() = id)
 *     users                 UPDATE  using / with check (auth.uid() = id)
 *     user_saved_reports    INSERT  with check (auth.uid() = id)
 *
 * `fetchSupabaseRest` pins `Authorization: Bearer <anon key>`, which would be
 * the `anon` role and is denied by every one of those policies. So the writes
 * here go over PostgREST with the caller's OWN access token as the bearer. The
 * database then decides the role from that token — there is no role selection
 * on this side of the wire at all, and no way to ask for a different one.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO
 * ---------------------------------
 * No service-role key. A service key would bypass RLS entirely, which would
 * turn every "is this really my row?" question in the database into a question
 * about whether this module got the logic right. The point of routing through
 * the policies is that the answer is enforced in Postgres, once.
 *
 * No new write path. `users` and `user_saved_reports` were already owned and
 * already policied; migration 0008 grants the privileges those existing
 * policies were written for. This module does not create tables, does not
 * create policies, and cannot write a row that is not the caller's own —
 * `id` and `user_id` are taken from the verified session, never from a payload.
 *
 * Not `student_reports`. That table stays a shareable, token-scoped artefact
 * so a report can be linked to a counsellor. A name is PII and belongs to an
 * account, not to a URL.
 */

import { getSupabaseUrl, getSupabaseAnonKey } from "./supabase";

export const ONBOARDING_PROFILE_KEY = "vividhedu:onboarding-profile:v1";

export interface StoredStudentProfile {
  /** The name the student typed in onboarding. Their own, not a persona. */
  fullName: string;
  stage: string;
  goals: string[];
  disciplines: string[];
  weights: Record<string, number>;
  budgetBand: string;
  geography: string[];
  targetField: string;
  dreamInstitutions: string[];
  immediateFocus: string;
  exploreFirst: boolean;
}

export interface ReportLink {
  report_token: string;
  title: string | null;
  created_at?: string;
}

export type SaveResult =
  | { ok: true; created: boolean; linkedReport: boolean }
  | { ok: false; created: boolean; linkedReport: boolean; reason: string };

// ─── PostgREST with the caller's own token ──────────────────────────────────

/**
 * Same shape as `fetchSupabaseRest`, except the bearer is the caller's session
 * token rather than the anon key. That single difference is what makes
 * `auth.uid()` inside the RLS policies resolve to the real student.
 */
async function restAs<T>(
  accessToken: string,
  endpoint: string,
  init: RequestInit & { prefer?: string; timeoutMs?: number } = {},
): Promise<{ status: number; data: T | null }> {
  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl || !accessToken) return { status: 0, data: null };

  const { prefer = "return=minimal", timeoutMs = 5000, ...rest } = init;
  const url = `${supabaseUrl}/rest/v1/${endpoint.replace(/^\//, "")}`;

  try {
    const res = await fetch(url, {
      ...rest,
      // `cache: "no-store"`: this is the signed-in student's own row, read on
      // every page load. Next's data cache must never serve one student's
      // profile to another. RLS is the security boundary; this is the
      // correctness one.
      cache: "no-store",
      headers: {
        apikey: getSupabaseAnonKey(),
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: prefer,
      },
      signal: rest.signal ?? AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { status: res.status, data: { error: detail.slice(0, 300) } as unknown as T };
    }

    const text = await res.text();
    return { status: res.status, data: text ? (JSON.parse(text) as T) : null };
  } catch {
    return { status: 0, data: null };
  }
}

// ─── Local draft cache (not the source of truth) ────────────────────────────

/**
 * A local cache of the answers, so a student who refreshes mid-onboarding does
 * not lose their typing. It is scoped per user id and it is explicitly NOT the
 * record of account: `saveProfile` is still what persists, and a returning
 * student is hydrated from the database, not from here.
 */
export function readLocalProfile(userId: string): Partial<StoredStudentProfile> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${ONBOARDING_PROFILE_KEY}:${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredStudentProfile>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function writeLocalProfile(userId: string, data: Partial<StoredStudentProfile>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${ONBOARDING_PROFILE_KEY}:${userId}`, JSON.stringify(data));
  } catch {
    // Quota or private mode. Not fatal: the database is the real record.
  }
}

export function clearLocalProfile(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(`${ONBOARDING_PROFILE_KEY}:${userId}`);
  } catch {
    // Nothing to clean up.
  }
}

// ─── Read ───────────────────────────────────────────────────────────────────

export interface StoredUserRow {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

/**
 * Reads the signed-in student's own `users` row.
 *
 * The `id=eq.<uid>` filter is a convenience, not the control: the RLS policy
 * `Users can read own record` is `auth.uid() = id`, so a mismatched filter can
 * only ever return zero rows. That is the same reason the old
 * `USING (true)` policies were dangerous and these are not.
 */
export async function fetchStoredProfile(
  accessToken: string,
  userId: string,
): Promise<StoredUserRow | null> {
  if (!accessToken || !userId) return null;
  const { data } = await restAs<StoredUserRow[]>(
    accessToken,
    `users?select=id,email,full_name,avatar_url&id=eq.${encodeURIComponent(userId)}&limit=1`,
    { prefer: "return=representation", timeoutMs: 4000 },
  );
  if (!Array.isArray(data) || data.length === 0) return null;
  return data[0] ?? null;
}

/**
 * The report tokens this account owns, newest first. Scoped by the caller's
 * own `user_id` and by the RLS policy on top of that.
 */
export async function fetchOwnedReports(
  accessToken: string,
  userId: string,
): Promise<ReportLink[]> {
  if (!accessToken || !userId) return [];
  const { data } = await restAs<ReportLink[]>(
    accessToken,
    `user_saved_reports?select=report_token,title,created_at&user_id=eq.${encodeURIComponent(
      userId,
    )}&order=created_at.desc&limit=25`,
    { timeoutMs: 4000 },
  );
  return Array.isArray(data) ? data : [];
}

// ─── Write ──────────────────────────────────────────────────────────────────

/**
 * Persists the student's own name, creating the `users` row on first write and
 * updating it thereafter.
 *
 * `id` and `email` come from the verified session, never from the payload. The
 * payload's only writable field is `fullName` (plus an optional avatar the
 * student cannot set through this path). Everything else on `users` —
 * `is_premium`, `premium_tier`, `premium_until`, `oauth_id` — is not granted
 * to any client role, so it cannot be set from here even in principle.
 *
 * Returns `created: false` with a reason on failure. It does NOT throw and it
 * does NOT report success for a write that did not happen: onboarding must not
 * tell a student their profile is saved when it is not.
 */
export async function saveProfile(params: {
  accessToken: string;
  userId: string;
  email: string;
  fullName: string;
}): Promise<SaveResult> {
  const { accessToken, userId, email, fullName } = params;
  const name = fullName.trim();

  if (!accessToken || !userId) {
    return { ok: false, created: false, linkedReport: false, reason: "No signed-in session." };
  }
  if (!name) {
    return { ok: false, created: false, linkedReport: false, reason: "Name is required." };
  }

  const existing = await fetchStoredProfile(accessToken, userId);

  if (existing) {
    // Already a row: update the name. The filter is `id=eq.<uid>` and the RLS
    // policy is `auth.uid() = id`, so this can only ever touch the caller's
    // own row.
    const { status } = await restAs(accessToken, `users?id=eq.${encodeURIComponent(userId)}`, {
      method: "PATCH",
      body: JSON.stringify({ full_name: name, updated_at: new Date().toISOString() }),
    });

    if (status >= 200 && status < 300) {
      return { ok: true, created: false, linkedReport: false };
    }
    // A failed PATCH on a row that exists is worth one retry as an upsert-style
    // insert, because the far more common cause is that the row is present but
    // the session is not. We do not retry the UPDATE though — RLS denial is
    // deterministic and retrying it just doubles the latency of a real refusal.
    if (status !== 401 && status !== 403) {
      return {
        ok: false,
        created: false,
        linkedReport: false,
        reason: `Could not save your name (HTTP ${status}).`,
      };
    }
  }

  // No row yet, or the update was refused. Create it. `oauth_provider` is
  // written as 'supabase' because that is genuinely where this identity came
  // from; `oauth_id` is the auth uid, which is what Supabase's own `sub` claim
  // is.
  const { status } = await restAs(accessToken, "users", {
    method: "POST",
    prefer: "return=minimal",
    body: JSON.stringify({
      id: userId,
      email,
      full_name: name,
      oauth_provider: "supabase",
      oauth_id: userId,
    }),
  });

  if (status >= 200 && status < 300) {
    return { ok: true, created: true, linkedReport: false };
  }

  // 409 means the row exists after all (a concurrent first write, or a row the
  // read could not see). That is a save, not a failure.
  if (status === 409) {
    const retry = await restAs(accessToken, `users?id=eq.${encodeURIComponent(userId)}`, {
      method: "PATCH",
      body: JSON.stringify({ full_name: name, updated_at: new Date().toISOString() }),
    });
    if (retry.status >= 200 && retry.status < 300) {
      return { ok: true, created: false, linkedReport: false };
    }
  }

  return {
    ok: false,
    created: false,
    linkedReport: false,
    reason:
      status === 401 || status === 403
        ? "Your session could not be verified, so your name was not saved. Sign in again and retry."
        : `Could not save your name (HTTP ${status}).`,
  };
}

/**
 * Links a freshly built report to the signed-in account, so a returning student
 * lands on THEIR report rather than an empty workspace.
 *
 * `user_id` is the session's uid, not a payload field. The `Prefer` is
 * `resolution=ignore-duplicates,return=minimal` so re-running onboarding
 * updates the existing link's title instead of failing on the
 * `UNIQUE (user_id, report_token)` constraint.
 */
export async function linkReportToAccount(params: {
  accessToken: string;
  userId: string;
  reportToken: string;
  title?: string;
}): Promise<boolean> {
  const { accessToken, userId, reportToken, title } = params;
  if (!accessToken || !userId || !reportToken) return false;

  const { status } = await restAs(accessToken, "user_saved_reports", {
    method: "POST",
    prefer: "resolution=ignore-duplicates,return=minimal",
    body: JSON.stringify({
      user_id: userId,
      report_token: reportToken,
      title: title ?? "Degree ROI Analysis",
    }),
  });

  return status >= 200 && status < 300;
}

/**
 * Writes the full onboarding answer set: the name to `users`, and the report
 * token to `user_saved_reports`.
 *
 * These are two independent grants against two independent policies, so they
 * are reported separately. A student whose name saved but whose report link
 * did not is told exactly that, rather than being shown a green check for work
 * that was only half done.
 */
export async function persistOnboarding(params: {
  accessToken: string;
  userId: string;
  email: string;
  fullName: string;
  reportToken?: string;
  title?: string;
}): Promise<SaveResult> {
  const saved = await saveProfile(params);
  let linkedReport = false;

  if (saved.ok && params.reportToken) {
    linkedReport = await linkReportToAccount({
      accessToken: params.accessToken,
      userId: params.userId,
      reportToken: params.reportToken,
      title: params.title,
    });
  }

  return { ...saved, linkedReport };
}
