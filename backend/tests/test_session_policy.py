"""Session handles must be unguessable, and placeholders must never pass."""
from api.session_policy import accepts_session_handle, new_report_token


def test_new_report_token_meets_the_floor():
    token = new_report_token()
    assert accepts_session_handle(token)
    assert token != new_report_token()


def test_placeholders_and_short_ids_are_rejected():
    assert accepts_session_handle("psy_default") is False
    assert accepts_session_handle("init") is False
    assert accepts_session_handle("offline") is False
    assert accepts_session_handle("psy_" + "ab" * 8) is False
    assert accepts_session_handle(None) is False
    assert accepts_session_handle("") is False
