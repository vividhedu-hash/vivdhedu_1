# Authentication

One identity provider owns the browser: **Supabase Auth**. The backend keeps a
separate OAuth surface for non-browser callers. This document records which is
which, because the codebase used to run three competing auth systems at once and
that ambiguity is what let the serious defects below ship.

## The rule

A signed-in session comes from Supabase Auth, and from nothing else. There is no
development fallback, no demo account, and no path that produces a session when
a provider fails. A misconfigured provider is a visible error, because a
silently fabricated session is strictly worse than a failed login: the user
believes they are signed in, the product believes their data is saved, and
neither is true.

## Browser flow (what a user actually hits)

```
User clicks "Continue with Google"
  → supabase.auth.signInWithOAuth()          indialens/src/lib/auth-context.tsx
  → Supabase /auth/v1/authorize               (client secret never reaches the browser)
  → Google consent screen
  → {origin}/auth/callback?code=...           indialens/src/app/auth/callback/page.tsx
  → supabase.auth.exchangeCodeForSession(code)  PKCE; the verifier stays in the browser
  → onAuthStateChange fires, AuthProvider sets the user
```

The flow is PKCE. The callback exchanges an authorization code for a session; it
never reads a token out of the URL fragment. A redirect allow-list must still be
configured in the Supabase project — see "What a deployment must configure".

**Error handling.** `loginWithGoogle` / `loginWithGithub` / `loginWithEmail`
return `{ success: false, error }`. `AuthModal` renders that string. There is no
substitute identity on any branch.

## Backend flow (non-browser callers)

`backend/api/routers/auth.py`, mounted at `/api/v1/auth/*`:

| Route | Purpose |
|---|---|
| `GET /google/url` | Google's authorize URL |
| `POST /google/callback` | ID token (signature-verified) or code exchange → session token |
| `GET /github/url` | GitHub's authorize URL |
| `POST /github/callback` | Code exchange → `/user` + `/user/emails` → session token |
| `POST /magic-link` | **501.** Not implemented; see below |
| `GET /me` | Current profile, from the `users` row |
| `POST /save-report`, `GET /my-reports` | Saved reports |
| `POST /premium/upgrade` | **501.** Billing not implemented |

### Google ID token verification

`backend/api/oauth.py` is the only place an external token becomes a trusted
identity. It uses `google-auth` to check the RS256 signature against Google's
published certificates, then asserts `aud == GOOGLE_CLIENT_ID`, `iss` is one of
Google's issuers, and `email_verified` is true.

The previous implementation asked `https://oauth2.googleapis.com/tokeninfo` what
the token contained and believed the answer. That endpoint *describes* a token;
it does not prove the token is authentic, so a forged token claiming any email
passed. A `try/except` around it then fell through to a hardcoded demo account.

Now: an unreachable JWKS is an error, not a bypass. A token we cannot verify is
rejected.

### Why `/magic-link` is disabled

It previously accepted nothing but an address and returned a signed session for
it — no link, no token, no proof the caller controlled the mailbox. That was
account takeover for any address that had never signed in. The browser uses
Supabase's verified email OTP, which does not have this problem. Re-enabling the
backend route requires sending a single-use, short-lived token and exchanging it.

## Entitlement

Nothing in the product gates a feature on premium (verified: the only reader of
the flag was the navbar badge). The navbar no longer renders a PRO badge at all.

The reason is concrete: the old badge was derived from Supabase `user_metadata`,
which the account holder can write themselves. Anyone could grant themselves a
PRO badge by editing their own profile. Entitlement is server-owned state — when
it is introduced, it comes from the `users` table, which the backend reads.

Note: the `users` table currently has **no RLS policies** (see
`db/schema.sql`; RLS was only ever added to the report/profile tables). Its
columns are read by the backend over a service connection, not by the browser
through PostgREST, so this is not currently exploitable — but it must not become
browser-reachable without an `auth.uid() = id` policy.

## What a deployment must configure

Browser sign-in — Supabase dashboard → Authentication → Providers:

1. Enable **Google** and/or **GitHub** (whichever buttons `AuthModal` shows).
2. Add the site origin and `{origin}/auth/callback` to **Redirect URLs**.

A provider left disabled makes that button fail with a visible error. That is
the intended behaviour, not a bug to paper over.

Backend OAuth routes — `backend/.env`:

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI`
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` / `GITHUB_REDIRECT_URI`
- `ENVIRONMENT=production` and a real 32+ char `JWT_SECRET` (the app refuses to
  boot in production on the shipped placeholder)

Both pairs are reported by `/health` and the integration matrix
(`backend/api/integrations.py`, keys `google_oauth` / `github_oauth`). Leaving
them blank does **not** break the web sign-in buttons, because those go through
Supabase.

## `next-auth` was removed

It was declared in `package.json` with no route handler, no provider, and no
import anywhere in the tree — a dead dependency that made the auth architecture
look more contested than it was. Removing it was preferable to wiring it: Supabase
Auth already owns the session and issues a JWT the rest of the stack can verify,
so a second session layer would have meant two notions of "logged in" for no
gain. See the commit message for the full reasoning.

## Tests

`backend/tests/test_auth_security.py` (31 tests) covers this file's claims with
real signed RS256 tokens against a locally generated key, hermetic and offline:

- a token signed by a different key, an `alg: none` token, and an expired token
  are all rejected
- `aud`, `iss` and `email_verified` policy
- an unreachable JWKS fails closed
- `/premium/upgrade` and `/magic-link` grant nothing
- no fabrication identifier survives in executable source

`test_auth_security.py` was written because the repo had **no auth tests at
all**, which is why these defects shipped.
