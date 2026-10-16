# Authentication

One identity: **Supabase Auth**. The browser signs in there. FastAPI verifies
the same access JWT. There is no second session minted by `/api/v1/auth/google/*`.

## The rule

A signed-in session comes from Supabase Auth, and from nothing else. There is no
development fallback, no demo account, and no path that produces a session when
a provider fails. A misconfigured provider is a visible error.

FastAPI treats `Authorization: Bearer <supabase access token>` as the student.
`sub` is `auth.uid()` and is upserted as `public.users.id`. Student-state RLS
(migration 0009) accepts `auth.uid()` as well as the backend `app.user_id` GUC.

## Browser flow

```
User clicks "Continue with Google"
  → supabase.auth.signInWithOAuth()          indialens/src/lib/auth-context.tsx
  → Supabase /auth/v1/authorize
  → Google consent screen
  → {origin}/auth/callback?code=...           indialens/src/app/auth/callback/page.tsx
  → supabase.auth.exchangeCodeForSession(code)  PKCE
  → onAuthStateChange fires, AuthProvider sets the user
  → subsequent API calls send Authorization: Bearer <access_token>
       via Next BFF proxies (proxyRequestHeaders) to FastAPI
  → get_current_user verifies the JWT (api/supabase_jwt.py)
```

**Error handling.** `loginWithGoogle` / `loginWithGithub` / `loginWithEmail`
return `{ success: false, error }`. `AuthModal` renders that string.

## Backend routes (`/api/v1/auth/*`)

| Route | Purpose |
|---|---|
| `GET /google/url`, `POST /google/callback` | **410.** Minting retired. Use the web sign-in. |
| `GET /github/url`, `POST /github/callback` | **410.** Same. |
| `POST /magic-link` | **501.** Not implemented. |
| `GET /me` | Current profile from `users`, after verifying the Bearer token |
| `POST /save-report`, `GET /my-reports` | Saved reports |
| `POST /premium/upgrade` | **501.** Billing not implemented |

Leftover HS256 tokens signed with `JWT_SECRET` are still decoded as `kind=legacy`
so machine callers that already hold one are not stranded. Nothing in the web
app mints those tokens anymore.

### Token verification

`api/supabase_jwt.py`:

- If `iss` is `{SUPABASE_URL}/auth/v1` (or `role` is `authenticated`), verify
  as a Supabase token: HS256 with `SUPABASE_JWT_SECRET` on legacy projects, or
  RS256/ES256 against `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`.
- Otherwise verify HS256 with `JWT_SECRET`.

An unreachable JWKS is an error, not a bypass.

Google ID token code in `api/oauth.py` remains for tests and for any future
non-browser caller; the HTTP minting routes return 410 and never call it.

## Entitlement

Nothing gates a feature on premium. When entitlement exists it lives in
`users.is_premium`, not in client `user_metadata`.

## What a deployment must configure

Browser sign-in — Supabase dashboard → Authentication → Providers:

1. Enable Google and/or GitHub.
2. Add the site origin and `{origin}/auth/callback` to Redirect URLs.

FastAPI — `backend/.env`:

- `SUPABASE_URL` (required to verify browser tokens)
- `SUPABASE_JWT_SECRET` (legacy HMAC projects) or rely on JWKS
- `SUPABASE_JWT_AUDIENCE=authenticated`
- `ENVIRONMENT=production` and a real 32+ char `JWT_SECRET`

Reported on `/health` as integration `supabase_jwt`.

The Next BFF copies `Authorization` onto FastAPI (`proxyRequestHeaders` in
`indialens/src/lib/backend.ts`).

## Tests

`backend/tests/test_auth_security.py` — Google claim policy, 410 minting,
fail-closed premium/magic-link.

`backend/tests/test_supabase_jwt.py` — hermetic HS256 Supabase tokens: wrong
secret, expired, wrong audience, wrong issuer, happy path.

`backend/tests/test_catalogue_source.py` — FastAPI is the catalogue path;
PostgREST is behind `ALLOW_CATALOGUE_POSTGREST=1`.
