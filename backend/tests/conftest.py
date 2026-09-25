"""Test suite bootstrap.

This runs before any test module is imported, which matters because
``api.config.Settings`` reads ``backend/.env`` at import time — and that file
contains the real Supabase connection string.

Without the guard below, any test that exercises a DB-backed route was silently
querying the PRODUCTION database from CI. ``test_college_roi_index_from_database``
in particular asserts on live ``roi_scores`` rows, so a nightly data refresh
could break the build.

Pointing the app at an unreachable port makes DB-backed routes take their
documented 503 path, which is what the tests already expect (``assert
response.status_code in (200, 503)``).

This must stay in ``conftest.py`` rather than ``pytest.ini``: the ``env =``
ini option requires the pytest-env plugin, which is not installed. Setting it
here uses the stdlib and cannot silently stop working.
"""

import os

# Unreachable on purpose — see module docstring.
_SANDBOX_URL = "postgresql+asyncpg://nobody@127.0.0.1:1/none"

for _var in ("DATABASE_URL", "DATABASE_URL_SYNC"):
    os.environ[_var] = _SANDBOX_URL

# pydantic-settings resolves os.environ with higher priority than the
# env_file entries in Config, so the two os.environ assignments above are
# sufficient on their own. Verified: settings.database_url reports the
# unreachable sandbox URL, not the Supabase one from backend/.env.
