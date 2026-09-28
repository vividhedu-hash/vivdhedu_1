"""Consent parsing must fail closed, and must agree with the client policy.

The browser writes `vividhedu_consent`; the server reads it. These tests pin
the property that makes that safe: every input that is not an explicit,
current opt-in resolves to "off". A test that only covered the happy path
would not notice a change that made an unparseable cookie permissive.
"""

from api.consent import (
    CONSENT_COOKIE,
    analytics_allowed,
    consent_from_headers,
    cookie_cleared_serialization,
    cookie_serialization,
    functional_allowed,
    parse_consent,
)


def test_explicit_opt_in_is_read():
    state = parse_consent("2.1.1.1750000000")
    assert state.analytics is True
    assert state.functional is True
    assert state.has_decision is True


def test_necessary_only_disables_optional_storage():
    state = parse_consent("2.0.0.1750000000")
    assert state.necessary is True
    assert state.analytics is False
    assert state.functional is False


def test_absent_cookie_is_a_refusal_not_a_default_allow():
    for raw in (None, "", "   "):
        state = parse_consent(raw)
        assert state.analytics is False
        assert state.functional is False
        assert state.has_decision is False


def test_garbage_is_a_refusal():
    for raw in (
        "1",
        "true",
        "2.1.1",
        "2.1.1.0",
        "abc.def.ghi.jkl",
        "2.2.1.1750000000",
        "2.1.2.1750000000",
    ):
        assert parse_consent(raw).analytics is False, raw
        assert parse_consent(raw).functional is False, raw


def test_older_policy_version_is_not_honoured():
    # A v1 cookie predates the current category list. Re-asking is the honest
    # answer; silently upgrading it would claim agreement to categories the
    # person never saw.
    state = parse_consent("1.1.1.1750000000")
    assert state.has_decision is False
    assert state.analytics is False


def test_headers_helper_works_on_a_plain_mapping():
    headers = {CONSENT_COOKIE: "2.0.1.1750000000"}
    assert analytics_allowed(headers) is True
    assert functional_allowed(headers) is False
    assert consent_from_headers(None).analytics is False
    assert consent_from_headers({}).analytics is False


def test_cookie_serialization_matches_the_client_format():
    header = cookie_serialization("2.1.1.1750000000", secure=True)
    assert header.startswith(f"{CONSENT_COOKIE}=2.1.1.1750000000")
    assert "Path=/" in header
    assert "SameSite=Lax" in header
    assert "Secure" in header
    assert "Max-Age=15552000" in header  # 180 days
    # Round-trips through the parser the server uses on the next request.
    value = header.split(";", 1)[0].split("=", 1)[1]
    assert parse_consent(value).analytics is True


def test_clearing_drops_the_cookie_immediately():
    header = cookie_cleared_serialization(secure=True)
    assert "Max-Age=0" in header
    assert "Secure" in header
