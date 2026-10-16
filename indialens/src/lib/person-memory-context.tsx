"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "./auth-context";
import { functionalAllowed } from "./consent";
import { CONSENT_EVENT } from "./session-policy";
import { readLocalProfile } from "./profile-store";
import {
  PERSON_ANON_KEY,
  PERSON_MEMORY_KEY,
  applyEvent,
  compileLlmContext,
  emptyState,
  rankCandidates,
  seedFromProfile,
  upsertFact,
  type LlmContextPacket,
  type EntityKind,
  type PersonEvent,
  type PersonFact,
  type PersonState,
  type RankCandidate,
  type RankedItem,
} from "./person-memory";

type PersonMemoryApi = {
  state: PersonState;
  packet: LlmContextPacket;
  ready: boolean;
  track: (event: PersonEvent) => void;
  remember: (fact: PersonFact) => void;
  hide: (kind: string, entityId: string, label?: string) => void;
  rank: (candidates: RankCandidate[]) => RankedItem[];
  reset: () => void;
};

const PersonMemoryContext = createContext<PersonMemoryApi | null>(null);

function storageKeyFor(ownerId: string): string {
  return `${PERSON_MEMORY_KEY}:${ownerId}`;
}

function readOwnerId(userId: string | null): string {
  if (userId) return userId;
  if (typeof window === "undefined") return "anonymous";
  try {
    const existing = window.localStorage.getItem(PERSON_ANON_KEY);
    if (existing) return existing;
    const minted = `anon_${crypto.randomUUID()}`;
    window.localStorage.setItem(PERSON_ANON_KEY, minted);
    return minted;
  } catch {
    return "anonymous";
  }
}

function loadState(ownerId: string): PersonState {
  if (typeof window === "undefined") return emptyState(ownerId);
  try {
    const raw = window.localStorage.getItem(storageKeyFor(ownerId));
    if (!raw) return emptyState(ownerId);
    const parsed = JSON.parse(raw) as PersonState;
    if (!parsed || parsed.version !== 1) return emptyState(ownerId);
    return { ...emptyState(ownerId), ...parsed, owner_id: ownerId };
  } catch {
    return emptyState(ownerId);
  }
}

function persistState(state: PersonState): void {
  if (typeof window === "undefined") return;
  if (!functionalAllowed()) return;
  try {
    window.localStorage.setItem(storageKeyFor(state.owner_id), JSON.stringify(state));
  } catch {
    // private mode / quota
  }
}

function clearAllPersonKeys(): void {
  if (typeof window === "undefined") return;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(`${PERSON_MEMORY_KEY}:`)) toRemove.push(key);
    }
    toRemove.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // nothing to clean
  }
}

export function PersonMemoryProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);
  const [state, setState] = useState<PersonState>(() => emptyState("anonymous"));
  const [ready, setReady] = useState(false);
  const pending = useRef<PersonEvent[]>([]);
  const enteredAt = useRef<number>(Date.now());
  const lastPath = useRef<string>("");

  useEffect(() => {
    const sync = () => setAllowed(functionalAllowed());
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!allowed) {
      clearAllPersonKeys();
      setState(emptyState(user?.id || "anonymous"));
      setReady(true);
      return;
    }
    const ownerId = readOwnerId(user?.id ?? null);
    let next = loadState(ownerId);
    if (user?.id) {
      const draft = readLocalProfile(user.id);
      if (draft && !next.facts.full_name && !next.facts.target_field) {
        next = seedFromProfile(next, draft as Record<string, unknown>);
        persistState(next);
      }
      if (user.full_name && !next.facts.full_name) {
        next = upsertFact(next, { key: "full_name", value: user.full_name, confidence: 0.9, source: "auth" });
        persistState(next);
      }
    }
    setState(next);
    setReady(true);
  }, [allowed, user?.id, user?.full_name]);

  const flush = useCallback(
    async (events: PersonEvent[], snapshot: PersonState) => {
      if (!events.length || !token) return;
      try {
        await fetch("/api/person/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ events, snapshot }),
        });
      } catch {
        // local graph is the source of truth until the backend is up
      }
    },
    [token],
  );

  const commit = useCallback(
    (updater: (prev: PersonState) => PersonState, event?: PersonEvent) => {
      setState((prev) => {
        const next = updater(prev);
        if (allowed) persistState(next);
        if (event) {
          pending.current.push(event);
          if (pending.current.length >= 8) {
            const batch = pending.current.splice(0, pending.current.length);
            void flush(batch, next);
          }
        }
        return next;
      });
    },
    [allowed, flush],
  );

  const track = useCallback(
    (event: PersonEvent) => {
      if (!allowed) return;
      const stamped = { ...event, occurred_at: event.occurred_at || new Date().toISOString() };
      commit((prev) => applyEvent(prev, stamped), stamped);
    },
    [allowed, commit],
  );

  const remember = useCallback(
    (fact: PersonFact) => {
      if (!allowed) return;
      commit((prev) => upsertFact(prev, fact));
    },
    [allowed, commit],
  );

  const hide = useCallback(
    (kind: string, entityId: string, label?: string) => {
      track({
        signal: "hide",
        entities: [{ kind: kind as EntityKind, entity_id: entityId, label }],
      });
    },
    [track],
  );

  const rank = useCallback(
    (candidates: RankCandidate[]) => rankCandidates(state, candidates),
    [state],
  );

  const reset = useCallback(() => {
    const ownerId = readOwnerId(user?.id ?? null);
    const blank = emptyState(ownerId);
    setState(blank);
    try {
      window.localStorage.removeItem(storageKeyFor(ownerId));
    } catch {
      // private mode
    }
    if (token) {
      void fetch("/api/person/memory", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  }, [token, user?.id]);

  useEffect(() => {
    if (!allowed || !ready) return;
    const path = pathname || "/";
    if (lastPath.current && lastPath.current !== path) {
      const dwell = Date.now() - enteredAt.current;
      track({ signal: "view", path: lastPath.current, dwell_ms: dwell });
    }
    lastPath.current = path;
    enteredAt.current = Date.now();
    track({ signal: "view", path, dwell_ms: 400 });
  }, [pathname, allowed, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onHide = () => {
      if (!allowed || !lastPath.current) return;
      track({ signal: "view", path: lastPath.current, dwell_ms: Date.now() - enteredAt.current });
      const batch = pending.current.splice(0, pending.current.length);
      if (batch.length) void flush(batch, state);
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, [allowed, flush, state, track]);

  const packet = useMemo(() => compileLlmContext(state, false), [state]);

  const api = useMemo<PersonMemoryApi>(
    () => ({ state, packet, ready, track, remember, hide, rank, reset }),
    [state, packet, ready, track, remember, hide, rank, reset],
  );

  return <PersonMemoryContext.Provider value={api}>{children}</PersonMemoryContext.Provider>;
}

export function usePersonMemory(): PersonMemoryApi {
  const ctx = useContext(PersonMemoryContext);
  if (!ctx) {
    const fallback = emptyState("anonymous");
    return {
      state: fallback,
      packet: compileLlmContext(fallback),
      ready: false,
      track: () => undefined,
      remember: () => undefined,
      hide: () => undefined,
      rank: (candidates) => rankCandidates(fallback, candidates),
      reset: () => undefined,
    };
  }
  return ctx;
}
