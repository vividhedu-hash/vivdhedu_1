"""
Point backend/.env at Supabase. Next.js does not talk to Supabase —
only FastAPI does, via DATABASE_URL.

From backend/:
  python -m scripts.use_supabase

Paste the Transaction pooler URI from:
  Supabase → Project Settings → Database → Connect → URI (port 6543)
"""
import getpass
import os
import re
import sys
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(ROOT, ".env")


def _normalize(raw: str) -> str:
    url = raw.strip().strip("'").strip('"')
    url = re.sub(r"^postgres://", "postgresql://", url)
    return url


def _with_ssl(url: str) -> str:
    parsed = urlparse(url)
    q = dict(parse_qsl(parsed.query, keep_blank_values=True))
    if "pooler.supabase" in (parsed.hostname or "") or "supabase.co" in (parsed.hostname or ""):
        q.setdefault("sslmode", "require")
    query = urlencode(q)
    return urlunparse(parsed._replace(query=query))


def _upsert_env(path: str, values: dict) -> None:
    lines = []
    if os.path.exists(path):
        lines = path and open(path, encoding="utf-8").read().splitlines()
    seen = set()
    out = []
    for line in lines:
        key = line.split("=", 1)[0] if "=" in line and not line.lstrip().startswith("#") else None
        if key in values:
            out.append(f"{key}={values[key]}")
            seen.add(key)
        else:
            out.append(line)
    for key, val in values.items():
        if key not in seen:
            out.append(f"{key}={val}")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(out).rstrip() + "\n")


def main() -> None:
    raw = ""
    if len(sys.argv) > 1 and sys.argv[1] in ("--uri", "-u") and len(sys.argv) > 2:
        raw = sys.argv[2]
    elif len(sys.argv) > 1 and not sys.argv[1].startswith("-"):
        raw = sys.argv[1]
    else:
        print("Paste the Supabase pooler URI (input hidden):")
        raw = getpass.getpass("")
    url = _normalize(raw)
    parsed = urlparse(url.replace("postgresql+asyncpg://", "postgresql://", 1))
    host = parsed.hostname or ""
    if "supabase" not in host:
        print(f"That host is {host or '(empty)'}, not a Supabase pooler. Aborting.")
        sys.exit(1)

    sync_url = _with_ssl(url.replace("postgresql+asyncpg://", "postgresql://", 1))
    async_url = sync_url.split("?")[0].replace("postgresql://", "postgresql+asyncpg://", 1)

    _upsert_env(ENV_PATH, {
        "DATABASE_URL": async_url,
        "DATABASE_URL_SYNC": sync_url,
    })
    print(f"Wrote DATABASE_URL + DATABASE_URL_SYNC → {host}:{parsed.port or 6543}")
    print("Next:")
    print("  python -m scripts.bootstrap")
    print("  python -m scripts.run_api")
    print("Use the same URI as DATABASE_URL on Render (no +asyncpg needed there if you set the sync form).")


if __name__ == "__main__":
    main()
