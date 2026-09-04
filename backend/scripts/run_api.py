"""Start FastAPI locally with uvicorn. No Docker."""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
sys.path.insert(0, ROOT)

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(ROOT, ".env"))
except ImportError:
    pass


def main() -> None:
    url = os.environ.get("DATABASE_URL", "")
    if "localhost" in url or "127.0.0.1" in url:
        print(
            "DATABASE_URL still points at localhost. "
            "This machine has no Docker and no local Postgres.\n"
            "Set DATABASE_URL / DATABASE_URL_SYNC to your Supabase pooler URI, then retry."
        )
        sys.exit(1)

    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    main()
