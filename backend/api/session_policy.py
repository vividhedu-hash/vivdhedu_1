"""
Rules for handles that grant access to one person's record.

A report token and a psychometric session id are bearer secrets. Anyone who
has the string can open that record. The floor is 16 bytes from a CSPRNG
(128 bits). `secrets.token_urlsafe(16)` encodes to 22 characters. A UUID v4
is longer. Anything shorter, or a fixed placeholder, is rejected by
`accepts_session_handle` so a missing id cannot become a shared session.
"""
from __future__ import annotations

import secrets

MIN_SESSION_BYTES = 16
# token_urlsafe(16) is 22 characters with no padding. Shorter is below the floor.
MIN_HANDLE_LENGTH = 22

REJECTED_HANDLES = frozenset({
    "psy_default",
    "init",
    "offline",
    "default",
})


def new_report_token() -> str:
    return secrets.token_urlsafe(MIN_SESSION_BYTES)


def accepts_session_handle(value: object) -> bool:
    if not isinstance(value, str):
        return False
    handle = value.strip()
    if handle in REJECTED_HANDLES:
        return False
    if len(handle) < MIN_HANDLE_LENGTH:
        return False
    return True
