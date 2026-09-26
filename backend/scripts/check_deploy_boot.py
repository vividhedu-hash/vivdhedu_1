"""
Boot the app in the exact deployed layout and resolve every route.

The deploy targets (Procfile, render.yaml, railway.toml) all run
`uvicorn api.main:app` with cwd=backend/. Under that layout the repo root is
NOT importable, so `backend.*` and `..services` style imports fail. This script
reproduces that context and additionally walks each route's endpoint function
source for imports that would only fail at request time.
"""
import ast
import importlib
import inspect
import os
import sys
import traceback
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
REPO_ROOT = BACKEND.parent

# Emulate `cd backend && uvicorn api.main:app`
sys.path = [
    p for p in sys.path
    if os.path.abspath(p or ".") not in (str(REPO_ROOT), str(BACKEND))
]
sys.path.insert(0, str(BACKEND))

failures = []

print("=" * 72)
print("1. Can the app import under the deploy layout?")
print("=" * 72)
try:
    main = importlib.import_module("api.main")
    print(f"  OK  api.main imported")
except Exception as e:
    print(f"  FAIL  {type(e).__name__}: {e}")
    for line in traceback.format_exc().strip().splitlines()[-10:]:
        print("        ", line)
    sys.exit(1)

app = main.app
routes = []
for r in app.routes:
    path = getattr(r, "path", None)
    if path:
        routes.append((path, getattr(r, "endpoint", None), getattr(r, "methods", None)))
print(f"  OK  {len(routes)} routes registered")

print()
print("=" * 72)
print("2. Do all app-level (module-scope) imports resolve?")
print("=" * 72)
bad = 0
for mod in ["api.main", "api.scraper_jobs", "services.ai_engine",
            "services.openrouter_grounded", "services.gemini_grounded",
            "services.adaptive_cat", "api.integrations"]:
    try:
        importlib.import_module(mod)
        print(f"  OK    {mod}")
    except Exception as e:
        bad += 1
        failures.append(f"{mod}: {type(e).__name__}: {e}")
        print(f"  FAIL  {mod}: {type(e).__name__}: {e}")

print()
print("=" * 72)
print("3. Do lazy/function-level imports inside handlers resolve?")
print("=" * 72)
checked = 0
for path, endpoint, methods in routes:
    if endpoint is None:
        continue
    try:
        src = inspect.getsource(endpoint)
        tree = ast.parse(inspect.cleandoc(src))
    except (OSError, TypeError, SyntaxError):
        continue
    for node in ast.walk(tree):
        mods = []
        if isinstance(node, ast.ImportFrom) and node.module and node.level == 0:
            mods = [(node.module, [a.name for a in node.names])]
        elif isinstance(node, ast.Import) and not any(
            a.name and a.name.startswith("backend") for a in node.names
        ):
            continue
        for mod, names in mods:
            if not (mod.startswith("backend") or mod.split(".")[0] in
                    {"api", "services", "ml", "pipeline", "scrapers", "db"}):
                continue
            checked += 1
            try:
                m = importlib.import_module(mod)
                for n in names:
                    getattr(m, n)
            except Exception as e:
                failures.append(f"{path} [{methods}]: {mod}.{names} -> {type(e).__name__}: {e}")
                print(f"  FAIL  {path}: {mod} -> {type(e).__name__}: {e}")
print(f"  checked {checked} in-handler import(s)")

print()
print("=" * 72)
if failures:
    print(f"RESULT: {len(failures)} failure(s)")
    for f in failures:
        print(f"  - {f}")
    sys.exit(1)
print("RESULT: deploy layout is clean — app boots and every import resolves")
