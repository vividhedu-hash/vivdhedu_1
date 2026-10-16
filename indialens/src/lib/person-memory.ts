/**
 * Client-side person memory — same ranking contract as
 * `backend/services/person_memory.py`.
 *
 * The compiled `prompt_block` is what every future LLM call should receive.
 * Tracking here still works when FastAPI is down: the graph lives in this
 * browser (functional storage) and is sent with advisor requests.
 */

export const PERSON_MEMORY_KEY = "vividhedu:person-memory:v1";
export const PERSON_ANON_KEY = "vividhedu:person-anon:v1";

export type PersonSignal =
  | "view"
  | "click"
  | "save"
  | "ask"
  | "complete"
  | "explicit"
  | "skip"
  | "hide";

export type EntityKind =
  | "topic"
  | "college"
  | "program"
  | "city"
  | "exam"
  | "career"
  | "skill"
  | "style"
  | "goal";

export interface PersonEntity {
  kind: EntityKind;
  entity_id: string;
  label?: string;
}

export interface PersonEvent {
  signal: PersonSignal;
  path?: string;
  text?: string;
  dwell_ms?: number;
  strength?: number;
  entities?: PersonEntity[];
  occurred_at?: string;
}

export interface PersonFact {
  key: string;
  value: unknown;
  confidence?: number;
  source?: string;
  sensitive?: boolean;
  updated_at?: string;
}

export interface AffinityRow {
  kind: EntityKind | string;
  entity_id: string;
  score: number;
  impressions: number;
  engagements: number;
  skips?: number;
  last_at: string | null;
  label: string;
}

export interface PersonState {
  owner_id: string;
  version: 1;
  created_at: string;
  updated_at: string;
  affinities: Record<string, AffinityRow>;
  facts: Record<string, PersonFact & { key: string }>;
  events: PersonEvent[];
  episodes: Array<{
    kind: string;
    text: string;
    path?: string;
    at: string;
    entities: string[];
  }>;
  hidden: string[];
  stats: { event_count: number; ask_count: number; save_count: number };
}

export interface RankCandidate {
  kind?: string;
  entity_id?: string;
  id?: string;
  label?: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface RankedItem extends RankCandidate {
  score: number;
  affinity?: number;
  reasons: string[];
}

export interface LlmContextPacket {
  version: 1;
  owner_id: string;
  updated_at?: string;
  identity: Record<string, unknown>;
  facts: Record<string, unknown>;
  affinities: Array<{ kind?: string; entity_id?: string; label: string; score: number }>;
  recent_episodes: PersonState["episodes"];
  do_not_recommend: string[];
  stats: PersonState["stats"];
  prompt_block: string;
}

const HALF_LIFE_DAYS = 21;
const MAX_EVENTS = 400;
const MAX_EPISODES = 24;

const SIGNAL_WEIGHTS: Record<PersonSignal, number> = {
  view: 0.18,
  click: 0.55,
  save: 1.2,
  ask: 1,
  complete: 0.9,
  explicit: 1.5,
  skip: -0.8,
  hide: -1.4,
};

const RANK_WEIGHTS = {
  affinity: 0.36,
  recency: 0.18,
  goal: 0.2,
  engagement: 0.16,
  fatigue: 0.16,
};

const ROUTE_TOPICS: Record<string, string[]> = {
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
};

const TOPIC_LEXICON: Array<[string, PersonEntity]> = [
  ["iit", { kind: "college", entity_id: "iit" }],
  ["nit", { kind: "college", entity_id: "nit" }],
  ["bits", { kind: "college", entity_id: "bits" }],
  ["lse", { kind: "college", entity_id: "lse" }],
  ["jee", { kind: "exam", entity_id: "jee" }],
  ["neet", { kind: "exam", entity_id: "neet" }],
  ["cuet", { kind: "exam", entity_id: "cuet" }],
  ["sat", { kind: "exam", entity_id: "sat" }],
  ["cse", { kind: "topic", entity_id: "engineering-cs" }],
  ["computer science", { kind: "topic", entity_id: "engineering-cs" }],
  ["machine learning", { kind: "topic", entity_id: "data-ai" }],
  ["ai", { kind: "topic", entity_id: "data-ai" }],
  ["medicine", { kind: "topic", entity_id: "medicine" }],
  ["mbbs", { kind: "topic", entity_id: "medicine" }],
  ["mba", { kind: "topic", entity_id: "management" }],
  ["law", { kind: "topic", entity_id: "law" }],
  ["abroad", { kind: "topic", entity_id: "study-abroad" }],
  ["scholarship", { kind: "topic", entity_id: "scholarships" }],
  ["roi", { kind: "topic", entity_id: "roi" }],
  ["placement", { kind: "topic", entity_id: "placements" }],
  ["layoff", { kind: "topic", entity_id: "job-security" }],
  ["bengaluru", { kind: "city", entity_id: "bengaluru" }],
  ["bangalore", { kind: "city", entity_id: "bengaluru" }],
  ["pune", { kind: "city", entity_id: "pune" }],
  ["hyderabad", { kind: "city", entity_id: "hyderabad" }],
];

const SENSITIVE_KEYS = new Set(["category", "home_state", "family_income_band"]);

function nowIso(d = new Date()): string {
  return d.toISOString();
}

export function decayFactor(ageDays: number, halfLife = HALF_LIFE_DAYS): number {
  if (ageDays <= 0) return 1;
  return Math.pow(0.5, ageDays / Math.max(halfLife, 1e-6));
}

export function emptyState(ownerId: string): PersonState {
  const t = nowIso();
  return {
    owner_id: ownerId,
    version: 1,
    created_at: t,
    updated_at: t,
    affinities: {},
    facts: {},
    events: [],
    episodes: [],
    hidden: [],
    stats: { event_count: 0, ask_count: 0, save_count: 0 },
  };
}

export function affinityKey(kind: string, entityId: string): string {
  return `${kind}:${entityId.trim().toLowerCase()}`;
}

function slug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function canonicalPath(path?: string): string {
  if (!path) return "/";
  const cleaned = path.split("?")[0].replace(/\/$/, "") || "/";
  const parts = cleaned.split("/");
  if (parts.length > 2) return `/${parts[1]}`;
  return cleaned;
}

export function extractEntities(event: Pick<PersonEvent, "text" | "entities" | "path">): PersonEntity[] {
  const found = new Map<string, PersonEntity>();
  const add = (kind: EntityKind, entityId: string, label?: string) => {
    const eid = slug(entityId);
    if (!eid) return;
    found.set(affinityKey(kind, eid), { kind, entity_id: eid, label: (label || entityId).slice(0, 80) });
  };

  for (const topic of ROUTE_TOPICS[canonicalPath(event.path)] || []) {
    add("topic", topic, topic.replace(/-/g, " "));
  }

  const blob = (event.text || "").toLowerCase();
  if (blob) {
    for (const [needle, ent] of TOPIC_LEXICON) {
      if (blob.includes(needle)) add(ent.kind, ent.entity_id, needle);
    }
  }

  for (const item of event.entities || []) {
    add((item.kind as EntityKind) || "topic", item.entity_id, item.label);
  }

  return [...found.values()];
}

function cloneState(state: PersonState | null | undefined, ownerId: string): PersonState {
  if (!state) return emptyState(ownerId);
  return {
    ...state,
    affinities: { ...state.affinities },
    facts: { ...state.facts },
    events: [...(state.events || [])],
    episodes: [...(state.episodes || [])],
    hidden: [...(state.hidden || [])],
    stats: { ...state.stats },
  };
}

export function applyEvent(state: PersonState, event: PersonEvent): PersonState {
  const next = cloneState(state, state.owner_id);
  const signal: PersonSignal = (event.signal as PersonSignal) in SIGNAL_WEIGHTS ? event.signal : "view";
  const occurred = event.occurred_at ? new Date(event.occurred_at) : new Date();
  const dwell = Math.max(0, event.dwell_ms || 0);
  let strength = event.strength ?? 1;
  if (signal === "view") strength *= dwell ? Math.min(1, dwell / 8000) : 0.35;
  const weight = SIGNAL_WEIGHTS[signal] * Math.max(-2, Math.min(3, strength));
  const entities = extractEntities(event);

  for (const ent of entities) {
    const key = affinityKey(ent.kind, ent.entity_id);
    const row = next.affinities[key] || {
      kind: ent.kind,
      entity_id: ent.entity_id,
      score: 0,
      impressions: 0,
      engagements: 0,
      last_at: null,
      label: ent.label || ent.entity_id,
    };
    const last = row.last_at ? new Date(row.last_at) : occurred;
    const ageDays = Math.max(0, (occurred.getTime() - last.getTime()) / 86400000);
    row.score = Math.max(-8, Math.min(12, row.score * decayFactor(ageDays) + weight));
    if (signal === "view" || signal === "click") row.impressions += 1;
    if (weight > 0 && signal !== "view") row.engagements += 1;
    if (signal === "skip" || signal === "hide") row.skips = (row.skips || 0) + 1;
    row.last_at = occurred.toISOString();
    row.label = ent.label || row.label;
    next.affinities[key] = row;
    if (signal === "hide" && !next.hidden.includes(key)) next.hidden.push(key);
  }

  next.stats.event_count += 1;
  if (signal === "ask") next.stats.ask_count += 1;
  if (signal === "save") next.stats.save_count += 1;

  next.events = [
    ...next.events,
    {
      signal,
      path: event.path,
      text: (event.text || "").slice(0, 400),
      dwell_ms: dwell || undefined,
      occurred_at: occurred.toISOString(),
      entities,
    },
  ].slice(-MAX_EVENTS);

  if ((signal === "ask" || signal === "explicit" || signal === "complete") && (event.text || entities.length)) {
    next.episodes = [
      ...next.episodes,
      {
        kind: signal,
        text: (event.text || "").slice(0, 280),
        path: event.path,
        at: occurred.toISOString(),
        entities: entities.map((e) => e.entity_id).slice(0, 6),
      },
    ].slice(-MAX_EPISODES);
  }

  next.updated_at = occurred.toISOString();
  return next;
}

export function upsertFact(state: PersonState, fact: PersonFact): PersonState {
  const next = cloneState(state, state.owner_id);
  const key = (fact.key || "").trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
  if (!key || fact.value === undefined || fact.value === null || fact.value === "") return next;
  const confidence = fact.confidence ?? 0.7;
  const existing = next.facts[key];
  if (existing && (existing.confidence ?? 0) > confidence + 0.05) return next;
  next.facts[key] = {
    key,
    value: fact.value,
    confidence: Math.max(0.05, Math.min(1, confidence)),
    source: (fact.source || "observed").slice(0, 40),
    sensitive: SENSITIVE_KEYS.has(key) || Boolean(fact.sensitive),
    updated_at: nowIso(),
  };
  next.updated_at = nowIso();
  return next;
}

export function seedFromProfile(state: PersonState, profile: Record<string, unknown>): PersonState {
  let next = cloneState(state, state.owner_id);
  const mapping: Record<string, unknown> = {
    full_name: profile.full_name ?? profile.fullName,
    stage: profile.stage,
    target_field: profile.target_field ?? profile.targetField ?? profile.twelfth_stream,
    budget_band: profile.budget_band ?? profile.budgetBand,
    exam: profile.exam ?? profile.exam_name,
    expected_rank: profile.expected_rank ?? profile.jee_rank,
    immediate_focus: profile.immediate_focus ?? profile.immediateFocus,
  };
  for (const [key, value] of Object.entries(mapping)) {
    if (value === undefined || value === null || value === "") continue;
    next = upsertFact(next, { key, value, confidence: 0.92, source: "profile" });
  }

  const entities: PersonEntity[] = [];
  if (mapping.target_field) {
    entities.push({ kind: "topic", entity_id: String(mapping.target_field), label: String(mapping.target_field) });
  }
  if (mapping.exam) {
    entities.push({ kind: "exam", entity_id: String(mapping.exam), label: String(mapping.exam) });
  }
  for (const city of (profile.geography as string[]) || (profile.preferred_cities as string[]) || []) {
    entities.push({ kind: "city", entity_id: String(city), label: String(city) });
  }
  for (const goal of (profile.goals as string[]) || []) {
    entities.push({ kind: "goal", entity_id: String(goal), label: String(goal) });
  }
  for (const disc of (profile.disciplines as string[]) || []) {
    entities.push({ kind: "topic", entity_id: String(disc), label: String(disc) });
  }
  for (const inst of (profile.dreamInstitutions as string[]) || []) {
    entities.push({ kind: "college", entity_id: String(inst), label: String(inst) });
  }
  if (entities.length) {
    next = applyEvent(next, { signal: "explicit", text: "onboarding profile", entities, path: "/onboard" });
  }
  return next;
}

function goalIds(state: PersonState): Set<string> {
  const ids = new Set<string>();
  for (const [key, fact] of Object.entries(state.facts || {})) {
    if (key === "target_field" || key === "exam" || key === "immediate_focus" || key.startsWith("goal_")) {
      ids.add(String(fact.value).trim().toLowerCase());
    }
  }
  for (const row of Object.values(state.affinities || {})) {
    if ((row.kind === "goal" || row.kind === "topic") && row.score > 0.8) ids.add(row.entity_id);
  }
  return ids;
}

export function rankCandidates(state: PersonState, candidates: RankCandidate[], now = new Date()): RankedItem[] {
  const hidden = new Set(state.hidden || []);
  const goals = goalIds(state);
  const ranked: RankedItem[] = candidates.map((raw) => {
    const kind = String(raw.kind || "topic");
    const eid = String(raw.entity_id || raw.id || "").trim().toLowerCase();
    const key = affinityKey(kind, eid);
    if (hidden.has(key)) {
      return { ...raw, score: -99, reasons: ["You asked not to see this."] };
    }
    const row = state.affinities[key];
    const last = row?.last_at ? new Date(row.last_at) : null;
    const ageHours = last ? (now.getTime() - last.getTime()) / 3600000 : 240;
    const recency = decayFactor(ageHours / 24, 7);
    const affinity = row?.score ?? 0;
    const tags = new Set((raw.tags || []).map((t) => String(t).toLowerCase()));
    tags.add(eid);
    let goalHit = 0;
    for (const g of goals) if (tags.has(g)) goalHit = 1;
    const impressions = Math.max(1, row?.impressions || 0);
    const engage = row
      ? Math.max(0, Math.min(1, (row.engagements / impressions) * 0.8 + 0.2 - ((row.skips || 0) / impressions) * 0.5))
      : 0.15;
    const fatigue = Math.min(1, Math.max(0, ((row?.impressions || 0) - (row?.engagements || 0)) / 12));
    const score =
      RANK_WEIGHTS.affinity * Math.tanh(affinity / 3) +
      RANK_WEIGHTS.recency * recency +
      RANK_WEIGHTS.goal * goalHit +
      RANK_WEIGHTS.engagement * engage -
      RANK_WEIGHTS.fatigue * fatigue;
    const reasons: string[] = [];
    if (affinity > 0.6) reasons.push(`Strong interest in ${row?.label || eid}.`);
    if (goalHit) reasons.push("Lined up with a goal you stated.");
    if (recency > 0.6 && last) reasons.push("You looked at this recently.");
    if (fatigue > 0.5) reasons.push("Shown often without a save or click, so it is demoted.");
    if (!reasons.length) reasons.push("Exploratory — not enough history yet.");
    return { ...raw, score: Math.round(score * 10000) / 10000, affinity, reasons: reasons.slice(0, 3) };
  });
  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}

export function topAffinities(state: PersonState, limit = 8) {
  return Object.values(state.affinities || {})
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => ({
      kind: r.kind,
      entity_id: r.entity_id,
      label: r.label || r.entity_id,
      score: Math.round(r.score * 1000) / 1000,
    }));
}

export function compileLlmContext(state: PersonState, includeSensitive = false): LlmContextPacket {
  const facts: Record<string, unknown> = {};
  for (const [key, fact] of Object.entries(state.facts || {})) {
    if (!includeSensitive && fact.sensitive) continue;
    facts[key] = fact.value;
  }
  const affinities = topAffinities(state, 10);
  const episodes = (state.episodes || []).slice(-8);
  const hidden = (state.hidden || []).slice(0, 12);
  const name = (facts.full_name as string) || "this student";
  const lines = [
    "PERSON_MEMORY v1 — treat as ground truth about this specific person.",
    facts.full_name ? `Address them as ${name}.` : "No name on file; do not invent one.",
  ];
  if (facts.target_field) lines.push(`Primary field: ${facts.target_field}.`);
  if (facts.stage) lines.push(`Stage: ${facts.stage}.`);
  if (facts.exam) {
    lines.push(`Exam: ${facts.exam}${facts.expected_rank ? ` (rank ${facts.expected_rank})` : ""}.`);
  }
  if (facts.budget_band) lines.push(`Budget band: ${facts.budget_band}.`);
  if (facts.immediate_focus) lines.push(`Immediate focus: ${facts.immediate_focus}.`);
  if (affinities.length) {
    lines.push(
      `Interest graph (higher = more evidence): ${affinities
        .slice(0, 8)
        .map((a) => `${a.label} (${a.score})`)
        .join(", ")}.`,
    );
  }
  if (episodes.length) {
    const last = episodes[episodes.length - 1];
    lines.push(`Latest episode (${last.kind}): ${last.text || last.path}.`);
  }
  if (hidden.length) lines.push(`Do not push: ${hidden.join(", ")}.`);
  lines.push(
    "Personalization rules: recall prior facts without re-asking them; prefer entities on the interest graph; challenge contradictions; never invent a biographical detail that is not in this packet.",
  );
  return {
    version: 1,
    owner_id: state.owner_id,
    updated_at: state.updated_at,
    identity: Object.fromEntries(
      ["full_name", "stage", "target_field", "exam"]
        .filter((k) => k in facts)
        .map((k) => [k, facts[k]]),
    ),
    facts,
    affinities,
    recent_episodes: episodes,
    do_not_recommend: hidden,
    stats: state.stats,
    prompt_block: lines.join("\n"),
  };
}

export function applyBatch(
  state: PersonState,
  events: PersonEvent[],
  facts: PersonFact[] = [],
  profile?: Record<string, unknown>,
): PersonState {
  let next = cloneState(state, state.owner_id);
  if (profile) next = seedFromProfile(next, profile);
  for (const fact of facts) next = upsertFact(next, fact);
  const ordered = [...events].sort(
    (a, b) => new Date(a.occurred_at || 0).getTime() - new Date(b.occurred_at || 0).getTime(),
  );
  for (const event of ordered) next = applyEvent(next, event);
  return next;
}
