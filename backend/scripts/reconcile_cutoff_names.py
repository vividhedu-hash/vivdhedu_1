"""
Report cutoff college names that do not match a colleges row.

Read-only. Prints candidate matches. Does not update either table.

Run from backend/:
  .venv/bin/python -m scripts.reconcile_cutoff_names
"""
from __future__ import annotations

import asyncio
import re
import sys

from sqlalchemy import text

from api.db.database import AsyncSessionLocal, engine


def _norm(name: str) -> str:
    """Keep words inside parentheses. Dropping them makes BITS Goa match BITS Pilani."""
    cleaned = name.lower().replace("&", " and ")
    cleaned = cleaned.replace("(", " ").replace(")", " ")
    cleaned = re.sub(r"[^a-z0-9 ]", " ", cleaned)
    return " ".join(cleaned.split())


def _overlap(left: str, right: str) -> float:
    a, b = set(left.split()), set(right.split())
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


async def main() -> int:
    if engine is None:
        print("DATABASE_URL is not configured. Nothing was queried.")
        return 1
    async with AsyncSessionLocal() as session:
        cutoffs = (await session.execute(text(
            "SELECT DISTINCT college_name FROM cutoffs ORDER BY college_name"
        ))).scalars().all()
        colleges = (await session.execute(text(
            "SELECT id::text, short_name, full_name FROM colleges"
        ))).mappings().all()

    catalogue = []
    for row in colleges:
        for label in (row["short_name"], row["full_name"]):
            if label:
                catalogue.append((str(row["id"]), label, _norm(label)))

    unmatched = 0
    for name in cutoffs:
        key = _norm(name)
        exact = [item for item in catalogue if item[2] == key]
        if exact:
            print(f"MATCH  {name}  ->  {exact[0][1]}")
            continue
        ranked = sorted(
            (( _overlap(key, item[2]), item[1]) for item in catalogue),
            reverse=True,
        )
        top = [(score, label) for score, label in ranked if score >= 0.5][:3]
        unmatched += 1
        if top:
            suggestions = "; ".join(f"{label} ({score:.2f})" for score, label in top)
            print(f"CANDIDATE  {name}  ->  {suggestions}")
        else:
            print(f"NO MATCH  {name}")
    print(f"\n{unmatched} cutoff name(s) without an exact colleges match. No rows were changed.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
