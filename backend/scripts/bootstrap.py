"""
One-command backend bootstrap against hosted Postgres (Supabase).
No Docker.

  1. alembic upgrade head
  2. seed_db + seed_expanded
  3. compute_roi

Run from backend/:
    python -m scripts.bootstrap
"""
import os
import socket
import subprocess
import sys
from urllib.parse import urlparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(ROOT, ".env"))
except ImportError:
    pass


def run(cmd: list[str]) -> None:
    print("→", " ".join(cmd))
    subprocess.check_call(cmd, cwd=ROOT)


def _host_reachable(url: str) -> bool:
    parsed = urlparse(url.replace("postgresql+asyncpg://", "postgresql://", 1))
    host = parsed.hostname or "localhost"
    port = parsed.port or 5432
    try:
        with socket.create_connection((host, port), timeout=5):
            return True
    except OSError:
        return False


def main() -> None:
    url = os.environ.get("DATABASE_URL_SYNC") or os.environ.get("DATABASE_URL") or ""
    if not url:
        print("DATABASE_URL is not set. Use your Supabase pooler URI.")
        sys.exit(1)
    if "localhost" in url or "127.0.0.1" in url:
        print(
            "DATABASE_URL points at localhost, and this project does not use Docker.\n"
            "Replace it with the Supabase URI: Dashboard → Project Settings → Database → URI "
            "(Transaction pooler, port 6543)."
        )
        sys.exit(1)
    if not _host_reachable(url):
        print("Cannot reach the database host in DATABASE_URL. Check the URI, password, and that the project is not paused.")
        sys.exit(1)

    python = sys.executable
    run([python, "-m", "alembic", "upgrade", "head"])
    run([python, "-m", "scripts.seed_db"])
    run([python, "-m", "scripts.seed_expanded"])
    run([python, "-m", "scripts.compute_roi"])
    print("\nBootstrap complete. Start API with:")
    print("  python -m scripts.run_api")
    print("Health: GET http://localhost:8000/api/health")


if __name__ == "__main__":
    main()
