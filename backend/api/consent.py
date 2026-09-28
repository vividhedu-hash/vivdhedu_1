"""
What the server is allowed to do, and what it will not do.

This module is the server-side half of the consent system. The browser holds
the person's choice in `vividhedu_consent`; this reads that same cookie on the
request path so the server can honour a refusal instead of only documenting it.

Why it exists
-------------
A consent banner that is enforced only in the client is a marketing page, not
a control. Anything the server can do on the strength of a cookie — set one,
read one, log a person's visit, attach a distinct id — must check this first.
The rules are deliberately conservative: an unparseable or absent cookie is a
REFUSAL, never a default-allow. ePrivacy treats "we could not tell" as "no".

Scope, stated honestly
----------------------
This module covers **the VividhEdu Next.js edge**, which is where cookies are
actually set and where every browser storage decision is made. It does NOT
retrofit the FastAPI analytics engines: those are stateless computation behind
`/api/analytics/*` and hold no cookie, receive no visitor identifier, and
write nothing about a visitor. The one third-party call in the backend is
Sentry error monitoring, which is server-to-server, carries no cookie or
visitor id, and is covered by the privacy policy rather than by consent. If
that ever changes — if a backend route starts writing a visitor-scoped row or
calling a visitor-scoped vendor — this module's docstring is where that
limitation must be revisited, and the change must not be silent.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

CONSENT_COOKIE = "vividhedu_consent"

# Mirrors indialens/src/lib/session-policy.ts. A cookie written by an older
# policy version is treated as absent, not as consent.
POLICY_VERSION = 2

# `2.0.1.1750000000` — version, functional, analytics, unix seconds.
_CONSENT_RE = re.compile(r"^(\d+)\.([01])\.([01])\.(\d+)$")

MAX_AGE_DAYS = 180


@dataclass(frozen=True)
class ConsentState:
    """A resolved consent decision. Absent cookie -> all optional storage off."""

    necessary: bool
    functional: bool
    analytics: bool
    version: int | None = None
    decided_at: int | None = None

    @property
    def has_decision(self) -> bool:
        return self.version is not None


# Strictly necessary is on because it is not a tracker: it is the sign-in, the
# return path, the report handle, and the record of this decision.
NO_DECISION = ConsentState(necessary=True, functional=False, analytics=False)


def parse_consent(raw: str | None) -> ConsentState:
    """Resolve a raw cookie value. Anything unrecognised is a refusal.

    Fail-closed is the whole point. A malformed value, a truncated cookie, a
    value from a future or past policy version, or a zero timestamp all return
    `NO_DECISION` rather than raising, so a caller cannot accidentally treat an
    exception as a permissive path.
    """
    if not raw:
        return NO_DECISION

    match = _CONSENT_RE.match(raw.strip())
    if not match:
        return NO_DECISION

    version = int(match.group(1))
    if version != POLICY_VERSION:
        return NO_DECISION

    decided_at = int(match.group(4))
    if decided_at <= 0:
        return NO_DECISION

    return ConsentState(
        necessary=True,
        functional=match.group(2) == "1",
        analytics=match.group(3) == "1",
        version=version,
        decided_at=decided_at,
    )


def consent_from_headers(headers) -> ConsentState:
    """Read the consent cookie off a request's headers.

    Accepts anything with a `.get`/`getheader`-style accessor so it works with
    Starlette's `Request.headers` and with a plain dict in tests, without
    pulling in a web framework.
    """
    if headers is None:
        return NO_DECISION
    raw = headers.get(CONSENT_COOKIE) or None
    return parse_consent(raw)


def analytics_allowed(headers) -> bool:
    """True only when this request carries an explicit, current opt-in."""
    return consent_from_headers(headers).analytics


def functional_allowed(headers) -> bool:
    """True only when this request carries an explicit functional opt-in."""
    return consent_from_headers(headers).functional


def cookie_serialization(value: str, *, secure: bool, max_age_days: int = MAX_AGE_DAYS) -> str:
    """The `Set-Cookie` value for a consent decision.

    `SameSite=Lax` so the choice does not ride along on cross-site navigations.
    `HttpOnly` is intentionally NOT set: the banner has to read this cookie
    synchronously on the client, and an HttpOnly cookie would force a server
    round-trip before the first paint, which would itself become the tracking
    signal the banner exists to prevent. It holds two booleans and a timestamp —
    no identifier — so client-side readability exposes nothing about the person.
    """
    attrs = [
        f"{CONSENT_COOKIE}={value}",
        "Path=/",
        f"Max-Age={max_age_days * 24 * 60 * 60}",
        "SameSite=Lax",
    ]
    if secure:
        attrs.append("Secure")
    return "; ".join(attrs)


def cookie_cleared_serialization(*, secure: bool) -> str:
    """A `Set-Cookie` that expires the consent cookie immediately.

    Used when a server route revokes optional storage on the person's
    instruction. Necessary storage is left alone: clearing this cookie removes
    the record of the decision, not the storage itself.
    """
    attrs = [f"{CONSENT_COOKIE}=", "Path=/", "Max-Age=0", "SameSite=Lax"]
    if secure:
        attrs.append("Secure")
    return "; ".join(attrs)
