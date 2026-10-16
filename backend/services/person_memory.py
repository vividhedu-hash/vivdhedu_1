"""
Person memory — Instagram-style ranking for one student.

This is the quantitative half of personalization. It does not call an LLM.
It turns what a person did into a durable affinity graph, then compiles a
compact packet any later model call can inject.

Signals (Instagram analogues)
-----------------------------
view / dwell  → watch time
click         → tap
save          → save / collection
ask           → comment / send (they brought this topic to the advisor)
complete      → profile visit that converted
skip / hide   → not interested
explicit      → follow (they said it)

Ranking
-------
score = w_affinity * decayed_affinity
      + w_recency * recency
      + w_goal * goal_alignment
      + w_engage * predicted_engagement
      - w_fatigue * recent_unengaged_impressions
"""
from __future__ import annotations

import math
import re
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

HALF_LIFE_DAYS = 21.0
MAX_EVENTS = 400
MAX_EPISODES = 24
MAX_FACTS = 80

SIGNAL_WEIGHTS: Dict[str, float] = {
    "view": 0.18,
    "click": 0.55,
    "save": 1.20,
    "ask": 1.00,
    "complete": 0.90,
    "explicit": 1.50,
    "skip": -0.80,
    "hide": -1.40,
}

RANK_WEIGHTS = {
    "affinity": 0.36,
    "recency": 0.18,
    "goal": 0.20,
    "engagement": 0.16,
    "fatigue": 0.16,
}

# Surfaces on this product that imply a topic even without extra metadata.
ROUTE_TOPICS: Dict[str, List[str]] = {
    "/explore": ["admissions", "roi"],
    "/admissions": ["admissions"],
    "/workspace": ["roi", "admissions"],
    "/psychometric": ["psychometrics"],
    "/advisor": ["admissions", "roi"],
    "/marketplace": ["skills"],
    "/global": ["study-abroad"],
    "/career-trajectory": ["career"],
    "/job-security": ["job-security"],
    "/portfolio-builder": ["skills", "research"],
    "/onboard": ["goals"],
    "/you": ["personalization"],
}

# Cheap lexicon so questions become entities without a model call.
TOPIC_LEXICON: Dict[str, Tuple[str, str]] = {
    "iit": ("college", "iit"),
    "nit": ("college", "nit"),
    "bits": ("college", "bits"),
    "iiit": ("college", "iiit"),
    "aiims": ("college", "aiims"),
    "lse": ("college", "lse"),
    "oxford": ("college", "oxford"),
    "warwick": ("college", "warwick"),
    "ashoka": ("college", "ashoka"),
    "jee": ("exam", "jee"),
    "neet": ("exam", "neet"),
    "cuet": ("exam", "cuet"),
    "cat": ("exam", "cat"),
    "gate": ("exam", "gate"),
    "sat": ("exam", "sat"),
    "cse": ("topic", "engineering-cs"),
    "computer science": ("topic", "engineering-cs"),
    "ai": ("topic", "data-ai"),
    "machine learning": ("topic", "data-ai"),
    "data science": ("topic", "data-ai"),
    "medicine": ("topic", "medicine"),
    "mbbs": ("topic", "medicine"),
    "commerce": ("topic", "commerce"),
    "ca": ("topic", "commerce"),
    "mba": ("topic", "management"),
    "law": ("topic", "law"),
    "design": ("topic", "design"),
    "abroad": ("topic", "study-abroad"),
    "uk": ("topic", "study-abroad"),
    "usa": ("topic", "study-abroad"),
    "scholarship": ("topic", "scholarships"),
    "roi": ("topic", "roi"),
    "placement": ("topic", "placements"),
    "layoff": ("topic", "job-security"),
    "automation": ("topic", "job-security"),
    "bengaluru": ("city", "bengaluru"),
    "bangalore": ("city", "bengaluru"),
    "pune": ("city", "pune"),
    "delhi": ("city", "ncr"),
    "ncr": ("city", "ncr"),
    "hyderabad": ("city", "hyderabad"),
    "mumbai": ("city", "mumbai"),
    "chennai": ("city", "chennai"),
}

SENSITIVE_FACT_KEYS = frozenset({"category", "home_state", "family_income_band"})

ALLOWED_SIGNALS = frozenset(SIGNAL_WEIGHTS)
ALLOWED_KINDS = frozenset(
    {"topic", "college", "program", "city", "exam", "career", "skill", "style", "goal"}
)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def parse_ts(value: Any) -> datetime:
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(float(value), tz=timezone.utc)
    if isinstance(value, str) and value:
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return utcnow()
    return utcnow()


def iso(ts: datetime) -> str:
    return ts.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def decay_factor(age_days: float, half_life: float = HALF_LIFE_DAYS) -> float:
    if age_days <= 0:
        return 1.0
    return math.pow(0.5, age_days / max(half_life, 1e-6))


def empty_state(owner_id: str) -> Dict[str, Any]:
    return {
        "owner_id": owner_id,
        "version": 1,
        "created_at": iso(utcnow()),
        "updated_at": iso(utcnow()),
        "affinities": {},
        "facts": {},
        "events": [],
        "episodes": [],
        "hidden": [],
        "stats": {"event_count": 0, "ask_count": 0, "save_count": 0},
    }


def affinity_key(kind: str, entity_id: str) -> str:
    return f"{kind}:{entity_id.strip().lower()}"


def _affinity_row(kind: str, entity_id: str) -> Dict[str, Any]:
    return {
        "kind": kind,
        "entity_id": entity_id,
        "score": 0.0,
        "impressions": 0,
        "engagements": 0,
        "last_at": None,
        "label": entity_id,
    }


def extract_entities(
    text: Optional[str],
    extra: Optional[Sequence[Dict[str, Any]]] = None,
    path: Optional[str] = None,
) -> List[Dict[str, str]]:
    found: Dict[str, Dict[str, str]] = {}

    def add(kind: str, entity_id: str, label: Optional[str] = None) -> None:
        kind = kind if kind in ALLOWED_KINDS else "topic"
        eid = re.sub(r"[^a-z0-9_-]+", "-", (entity_id or "").strip().lower()).strip("-")
        if not eid:
            return
        found[affinity_key(kind, eid)] = {
            "kind": kind,
            "entity_id": eid,
            "label": (label or entity_id).strip()[:80],
        }

    if path:
        for topic in ROUTE_TOPICS.get(_canonical_path(path), []):
            add("topic", topic, topic.replace("-", " "))

    blob = (text or "").lower()
    if blob:
        for needle, (kind, eid) in TOPIC_LEXICON.items():
            if needle in blob:
                add(kind, eid, needle)

    for item in extra or []:
        if not isinstance(item, dict):
            continue
        add(str(item.get("kind") or "topic"), str(item.get("entity_id") or ""), item.get("label"))

    return list(found.values())


def _canonical_path(path: str) -> str:
    if not path:
        return "/"
    cleaned = path.split("?")[0].rstrip("/") or "/"
    parts = cleaned.split("/")
    if len(parts) > 2 and parts[1] in {"report", "college", "program"}:
        return f"/{parts[1]}"
    if len(parts) > 2:
        return f"/{parts[1]}"
    return cleaned


def apply_event(state: Dict[str, Any], event: Dict[str, Any]) -> Dict[str, Any]:
    """Mutates a copy. Safe to call from a test without a database."""
    next_state = deepcopy(state) if state else empty_state("anonymous")
    signal = str(event.get("signal") or "view").lower()
    if signal not in ALLOWED_SIGNALS:
        signal = "view"

    now = parse_ts(event.get("occurred_at") or event.get("at"))
    dwell_ms = max(0.0, float(event.get("dwell_ms") or 0))
    strength = float(event.get("strength") or 1.0)
    if signal == "view":
        strength *= min(1.0, dwell_ms / 8000.0) if dwell_ms else 0.35

    weight = SIGNAL_WEIGHTS[signal] * max(-2.0, min(3.0, strength))
    entities = extract_entities(
        event.get("text"),
        event.get("entities"),
        event.get("path"),
    )
    if not entities and event.get("path"):
        entities = extract_entities(None, None, event.get("path"))

    affinities: Dict[str, Any] = next_state.setdefault("affinities", {})
    for ent in entities:
        key = affinity_key(ent["kind"], ent["entity_id"])
        row = affinities.get(key) or _affinity_row(ent["kind"], ent["entity_id"])
        last = parse_ts(row["last_at"]) if row.get("last_at") else now
        age_days = max(0.0, (now - last).total_seconds() / 86400.0)
        row["score"] = row["score"] * decay_factor(age_days) + weight
        row["score"] = max(-8.0, min(12.0, row["score"]))
        row["impressions"] = int(row.get("impressions") or 0) + (1 if signal in {"view", "click"} else 0)
        if weight > 0 and signal != "view":
            row["engagements"] = int(row.get("engagements") or 0) + 1
        if signal in {"skip", "hide"}:
            row["skips"] = int(row.get("skips") or 0) + 1
        row["last_at"] = iso(now)
        row["label"] = ent.get("label") or row.get("label") or ent["entity_id"]
        row["kind"] = ent["kind"]
        row["entity_id"] = ent["entity_id"]
        affinities[key] = row

        if signal == "hide":
            hidden = next_state.setdefault("hidden", [])
            if key not in hidden:
                hidden.append(key)

    stats = next_state.setdefault("stats", {})
    stats["event_count"] = int(stats.get("event_count") or 0) + 1
    if signal == "ask":
        stats["ask_count"] = int(stats.get("ask_count") or 0) + 1
    if signal == "save":
        stats["save_count"] = int(stats.get("save_count") or 0) + 1

    events = next_state.setdefault("events", [])
    events.append({
        "signal": signal,
        "path": event.get("path"),
        "text": (event.get("text") or "")[:400],
        "dwell_ms": dwell_ms or None,
        "occurred_at": iso(now),
        "entities": entities,
    })
    next_state["events"] = events[-MAX_EVENTS:]

    if signal in {"ask", "explicit", "complete"} and (event.get("text") or entities):
        episodes = next_state.setdefault("episodes", [])
        episodes.append({
            "kind": signal,
            "text": (event.get("text") or "")[:280],
            "path": event.get("path"),
            "at": iso(now),
            "entities": [e["entity_id"] for e in entities[:6]],
        })
        next_state["episodes"] = episodes[-MAX_EPISODES:]

    next_state["updated_at"] = iso(now)
    return next_state


def upsert_fact(state: Dict[str, Any], fact: Dict[str, Any]) -> Dict[str, Any]:
    next_state = deepcopy(state) if state else empty_state("anonymous")
    key = re.sub(r"[^a-z0-9_]+", "_", str(fact.get("key") or "").strip().lower()).strip("_")
    value = fact.get("value")
    if not key or value in (None, "", []):
        return next_state
    confidence = float(fact.get("confidence") or 0.7)
    existing = next_state.setdefault("facts", {}).get(key)
    if existing and float(existing.get("confidence") or 0) > confidence + 0.05:
        # Do not let a weaker observation overwrite a stronger one.
        return next_state
    next_state["facts"][key] = {
        "key": key,
        "value": value,
        "confidence": max(0.05, min(1.0, confidence)),
        "source": str(fact.get("source") or "observed")[:40],
        "sensitive": key in SENSITIVE_FACT_KEYS or bool(fact.get("sensitive")),
        "updated_at": iso(parse_ts(fact.get("updated_at"))),
    }
    if len(next_state["facts"]) > MAX_FACTS:
        # Drop the weakest, oldest non-identity facts.
        ranked = sorted(
            next_state["facts"].items(),
            key=lambda kv: (kv[0] in {"full_name", "stage", "target_field"}, float(kv[1].get("confidence") or 0), kv[1].get("updated_at") or ""),
        )
        keep = dict(ranked[-MAX_FACTS:])
        next_state["facts"] = keep
    next_state["updated_at"] = iso(utcnow())
    return next_state


def seed_from_profile(state: Dict[str, Any], profile: Dict[str, Any]) -> Dict[str, Any]:
    """Fold onboarding / student_profiles into facts + topic affinities."""
    next_state = deepcopy(state) if state else empty_state(str(profile.get("id") or "anonymous"))
    mapping = {
        "full_name": profile.get("full_name") or profile.get("fullName"),
        "stage": profile.get("stage"),
        "target_field": profile.get("target_field") or profile.get("targetField") or profile.get("twelfth_stream"),
        "budget_band": profile.get("budget_band") or profile.get("budgetBand"),
        "exam": profile.get("exam") or profile.get("exam_name"),
        "expected_rank": profile.get("expected_rank") or profile.get("jee_rank"),
        "home_state": profile.get("home_state"),
        "category": profile.get("category"),
        "immediate_focus": profile.get("immediate_focus") or profile.get("immediateFocus"),
    }
    for key, value in mapping.items():
        if value in (None, "", []):
            continue
        next_state = upsert_fact(next_state, {
            "key": key,
            "value": value,
            "confidence": 0.92,
            "source": "profile",
            "sensitive": key in SENSITIVE_FACT_KEYS,
        })

    entities: List[Dict[str, Any]] = []
    field = mapping.get("target_field")
    if field:
        entities.append({"kind": "topic", "entity_id": str(field), "label": str(field)})
    exam = mapping.get("exam")
    if exam:
        entities.append({"kind": "exam", "entity_id": str(exam), "label": str(exam)})
    for city in profile.get("geography") or profile.get("preferred_cities") or []:
        entities.append({"kind": "city", "entity_id": str(city), "label": str(city)})
    for goal in profile.get("goals") or []:
        entities.append({"kind": "goal", "entity_id": str(goal), "label": str(goal)})
        next_state = upsert_fact(next_state, {"key": f"goal_{len(entities)}", "value": goal, "confidence": 0.88, "source": "profile"})
    for disc in profile.get("disciplines") or []:
        entities.append({"kind": "topic", "entity_id": str(disc), "label": str(disc)})
    for inst in profile.get("dreamInstitutions") or profile.get("dream_institutions") or []:
        entities.append({"kind": "college", "entity_id": str(inst), "label": str(inst)})

    if entities:
        next_state = apply_event(next_state, {
            "signal": "explicit",
            "text": "onboarding profile",
            "entities": entities,
            "path": "/onboard",
        })
    return next_state


def _goal_ids(state: Dict[str, Any]) -> set[str]:
    ids: set[str] = set()
    for key, fact in (state.get("facts") or {}).items():
        if key in {"target_field", "exam", "immediate_focus"} or key.startswith("goal_"):
            ids.add(str(fact.get("value")).strip().lower())
    for key, row in (state.get("affinities") or {}).items():
        if row.get("kind") in {"goal", "topic"} and float(row.get("score") or 0) > 0.8:
            ids.add(str(row.get("entity_id")))
    return {i for i in ids if i}


def predicted_engagement(row: Dict[str, Any]) -> float:
    impressions = max(1, int(row.get("impressions") or 0))
    engagements = int(row.get("engagements") or 0)
    skips = int(row.get("skips") or 0)
    ctr = engagements / impressions
    skip_rate = skips / impressions
    return max(0.0, min(1.0, ctr * 0.8 + 0.2 - skip_rate * 0.5))


def rank_candidates(
    state: Dict[str, Any],
    candidates: Sequence[Dict[str, Any]],
    now: Optional[datetime] = None,
) -> List[Dict[str, Any]]:
    now = now or utcnow()
    affinities: Dict[str, Any] = state.get("affinities") or {}
    hidden = set(state.get("hidden") or [])
    goals = _goal_ids(state)
    ranked: List[Dict[str, Any]] = []

    for raw in candidates:
        cand = dict(raw)
        kind = str(cand.get("kind") or "topic")
        eid = str(cand.get("entity_id") or cand.get("id") or "").strip().lower()
        key = affinity_key(kind, eid)
        if key in hidden or cand.get("id") in hidden:
            cand["score"] = -99.0
            cand["reasons"] = ["You asked not to see this."]
            ranked.append(cand)
            continue

        row = affinities.get(key) or {}
        last = parse_ts(row["last_at"]) if row.get("last_at") else None
        age_hours = ((now - last).total_seconds() / 3600.0) if last else 240.0
        recency = decay_factor(age_hours / 24.0, half_life=7.0)
        affinity = float(row.get("score") or 0.0)
        tags = {str(t).lower() for t in (cand.get("tags") or [])}
        tags.add(eid)
        goal_hit = 1.0 if (tags & goals) else 0.0
        engage = predicted_engagement(row) if row else 0.15
        fatigue = min(1.0, max(0.0, (int(row.get("impressions") or 0) - int(row.get("engagements") or 0)) / 12.0))

        score = (
            RANK_WEIGHTS["affinity"] * math.tanh(affinity / 3.0)
            + RANK_WEIGHTS["recency"] * recency
            + RANK_WEIGHTS["goal"] * goal_hit
            + RANK_WEIGHTS["engagement"] * engage
            - RANK_WEIGHTS["fatigue"] * fatigue
        )
        reasons = []
        if affinity > 0.6:
            reasons.append(f"Strong interest in {row.get('label') or eid}.")
        if goal_hit:
            reasons.append("Lined up with a goal you stated.")
        if recency > 0.6 and last:
            reasons.append("You looked at this recently.")
        if fatigue > 0.5:
            reasons.append("Shown often without a save or click, so it is demoted.")
        if not reasons:
            reasons.append("Exploratory — not enough history yet.")

        cand["score"] = round(score, 4)
        cand["affinity"] = round(affinity, 3)
        cand["reasons"] = reasons[:3]
        ranked.append(cand)

    ranked.sort(key=lambda c: float(c.get("score") or 0), reverse=True)
    return ranked


def top_affinities(state: Dict[str, Any], limit: int = 8) -> List[Dict[str, Any]]:
    rows = list((state.get("affinities") or {}).values())
    rows.sort(key=lambda r: float(r.get("score") or 0), reverse=True)
    out = []
    for row in rows[:limit]:
        if float(row.get("score") or 0) <= 0:
            continue
        out.append({
            "kind": row.get("kind"),
            "entity_id": row.get("entity_id"),
            "label": row.get("label") or row.get("entity_id"),
            "score": round(float(row.get("score") or 0), 3),
        })
    return out


def public_facts(state: Dict[str, Any], include_sensitive: bool = True) -> Dict[str, Any]:
    out = {}
    for key, fact in (state.get("facts") or {}).items():
        if not include_sensitive and fact.get("sensitive"):
            continue
        out[key] = fact.get("value")
    return out


def compile_llm_context(state: Dict[str, Any], include_sensitive: bool = False) -> Dict[str, Any]:
    """
    The object you paste into a system prompt when an LLM API is hooked up.
    Keep it short: models follow a dense packet better than a transcript dump.
    """
    facts = public_facts(state, include_sensitive=include_sensitive)
    affinities = top_affinities(state, 10)
    episodes = list(state.get("episodes") or [])[-8:]
    hidden = list(state.get("hidden") or [])[:12]
    name = facts.get("full_name") or "this student"
    field = facts.get("target_field")
    focus = facts.get("immediate_focus")

    lines = [
        "PERSON_MEMORY v1 — treat as ground truth about this specific person.",
        f"Address them as {name}." if facts.get("full_name") else "No name on file; do not invent one.",
    ]
    if field:
        lines.append(f"Primary field: {field}.")
    if facts.get("stage"):
        lines.append(f"Stage: {facts['stage']}.")
    if facts.get("exam"):
        lines.append(f"Exam: {facts['exam']}" + (f" (rank {facts['expected_rank']})" if facts.get("expected_rank") else "") + ".")
    if facts.get("budget_band"):
        lines.append(f"Budget band: {facts['budget_band']}.")
    if focus:
        lines.append(f"Immediate focus: {focus}.")
    if affinities:
        labels = ", ".join(f"{a['label']} ({a['score']})" for a in affinities[:8])
        lines.append(f"Interest graph (higher = more evidence): {labels}.")
    if episodes:
        last = episodes[-1]
        lines.append(f"Latest episode ({last.get('kind')}): {last.get('text') or last.get('path')}.")
    if hidden:
        lines.append("Do not push: " + ", ".join(hidden) + ".")
    lines.append(
        "Personalization rules: recall prior facts without re-asking them; "
        "prefer entities on the interest graph; challenge contradictions; "
        "never invent a biographical detail that is not in this packet."
    )

    prompt_block = "\n".join(lines)
    return {
        "version": 1,
        "owner_id": state.get("owner_id"),
        "updated_at": state.get("updated_at"),
        "identity": {k: facts[k] for k in ("full_name", "stage", "target_field", "exam") if k in facts},
        "facts": facts,
        "affinities": affinities,
        "recent_episodes": episodes,
        "do_not_recommend": hidden,
        "stats": state.get("stats") or {},
        "prompt_block": prompt_block,
    }


def apply_batch(
    state: Dict[str, Any],
    events: Iterable[Dict[str, Any]],
    facts: Optional[Iterable[Dict[str, Any]]] = None,
    profile: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    next_state = deepcopy(state) if state else empty_state("anonymous")
    if profile:
        next_state = seed_from_profile(next_state, profile)
    for fact in facts or []:
        next_state = upsert_fact(next_state, fact)
    ordered = sorted(list(events), key=lambda e: parse_ts(e.get("occurred_at") or e.get("at")))
    for event in ordered:
        next_state = apply_event(next_state, event)
    return next_state
