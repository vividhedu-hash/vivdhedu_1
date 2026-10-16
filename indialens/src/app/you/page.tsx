"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Fingerprint, EyeOff, RotateCcw, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Notice } from "@/components/Notice";
import { usePersonMemory } from "@/lib/person-memory-context";
import { functionalAllowed } from "@/lib/consent";
import { useAuth } from "@/lib/auth-context";
import { rankCandidates, topAffinities } from "@/lib/person-memory";

const SAMPLE_FEED = [
  { kind: "topic", entity_id: "engineering-cs", label: "CS / AI degrees", tags: ["engineering-cs"] },
  { kind: "topic", entity_id: "medicine", label: "Medicine / NEET", tags: ["medicine"] },
  { kind: "topic", entity_id: "study-abroad", label: "Study abroad", tags: ["study-abroad"] },
  { kind: "topic", entity_id: "roi", label: "Degree ROI", tags: ["roi"] },
  { kind: "topic", entity_id: "job-security", label: "AI job security", tags: ["job-security"] },
  { kind: "topic", entity_id: "admissions", label: "Admissions odds", tags: ["admissions"] },
  { kind: "exam", entity_id: "jee", label: "JEE", tags: ["jee"] },
  { kind: "city", entity_id: "bengaluru", label: "Bengaluru", tags: ["bengaluru"] },
  { kind: "topic", entity_id: "scholarships", label: "Scholarships", tags: ["scholarships"] },
  { kind: "topic", entity_id: "law", label: "Law", tags: ["law"] },
];

export default function ForYouPage() {
  const { user } = useAuth();
  const { state, packet, track, hide, remember, reset, ready } = usePersonMemory();
  const [note, setNote] = useState("");
  const allowed = functionalAllowed();
  const affinities = topAffinities(state, 12);
  const feed = useMemo(() => rankCandidates(state, SAMPLE_FEED), [state]);
  const facts = Object.values(state.facts || {});

  return (
    <div className="page-shell">
      <div className="container-xl page-header">
        <PageHeader
          kicker="For You"
          eyebrow={
            <span className="badge badge-purple">
              <Fingerprint size={10} aria-hidden="true" />
              Interest graph · not a feed of other people
            </span>
          }
          title={
            <>
              Your algorithm.
              <br />
              Built only from you.
            </>
          }
          lead="Same idea as Instagram's ranking — recency, interest, stated goals, and fatigue — pointed at colleges, exams, and careers. When an LLM is connected, it receives the packet below instead of a blank prompt."
        />
      </div>

      <div className="container-xl pb-16">
        {!allowed && (
          <Notice tone="warn" className="mb-6">
            Functional storage is off, so this graph is not being saved. Allow it in cookie settings if you want the advisor to remember you across visits.
          </Notice>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-6">
            <section className="panel">
              <div className="panel-head">
                <span className="panel-title">Ranked for you</span>
                <span className="badge">{state.stats.event_count} signals</span>
              </div>
              <ul className="divide-y t-divider">
                {feed.map((item) => (
                  <li key={`${item.kind}:${item.entity_id}`} className="flex items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold t-text">{item.label}</p>
                      <p className="mt-0.5 text-[12px] t-muted">{item.reasons[0]}</p>
                      <p className="mt-1 font-mono text-[10px] t-faint">
                        score {item.score.toFixed(2)}
                        {typeof item.affinity === "number" ? ` · affinity ${item.affinity.toFixed(2)}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        className="btn-ghost text-[11px]"
                        onClick={() =>
                          track({
                            signal: "save",
                            entities: [{ kind: (item.kind as "topic") || "topic", entity_id: String(item.entity_id), label: String(item.label) }],
                            text: String(item.label),
                            path: "/you",
                          })
                        }
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn-ghost text-[11px]"
                        onClick={() => hide(String(item.kind || "topic"), String(item.entity_id), String(item.label))}
                        aria-label={`Hide ${item.label}`}
                      >
                        <EyeOff size={13} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="panel">
              <div className="panel-head">
                <span className="panel-title">Tell it something lasting</span>
              </div>
              <form
                className="panel-pad space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const text = note.trim();
                  if (!text) return;
                  remember({ key: `note_${Date.now()}`, value: text, confidence: 0.85, source: "explicit" });
                  track({ signal: "explicit", text, path: "/you" });
                  setNote("");
                }}
              >
                <label className="form-label" htmlFor="memory-note">
                  A fact the models should not forget
                </label>
                <textarea
                  id="memory-note"
                  className="form-input min-h-[88px]"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. I will not take a loan above ₹8L, and I need to stay in Tamil Nadu."
                />
                <button type="submit" className="btn-primary" disabled={!allowed}>
                  Remember this
                </button>
              </form>
            </section>

            <section className="panel">
              <div className="panel-head">
                <span className="panel-title">LLM context packet</span>
                <Sparkles size={14} className="t-faint" aria-hidden="true" />
              </div>
              <pre className="panel-pad overflow-x-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed t-muted">
                {ready ? packet.prompt_block : "Loading graph…"}
              </pre>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="panel">
              <div className="panel-head">
                <span className="panel-title">Interest graph</span>
              </div>
              <div className="panel-pad space-y-2">
                {affinities.length === 0 && (
                  <p className="text-[13px] t-muted">
                    Browse explore, ask the workspace a question, or finish onboarding — those actions write this graph.
                  </p>
                )}
                {affinities.map((row) => (
                  <div key={`${row.kind}:${row.entity_id}`}>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="t-text">{row.label}</span>
                      <span className="font-mono t-faint">{row.score.toFixed(2)}</span>
                    </div>
                    <div className="mt-1 h-1 rounded-full t-chip">
                      <div
                        className="h-1 rounded-full bg-accent"
                        style={{ width: `${Math.min(100, (row.score / 6) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <span className="panel-title">Stable facts</span>
              </div>
              <ul className="panel-pad space-y-2 text-[13px]">
                {facts.length === 0 && <li className="t-muted">None yet.</li>}
                {facts.slice(0, 16).map((fact) => (
                  <li key={fact.key}>
                    <span className="font-mono text-[10px] t-faint">{fact.key}</span>
                    <p className="t-text">{String(fact.value)}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="panel">
              <div className="panel-head">
                <span className="panel-title">Account</span>
              </div>
              <div className="panel-pad space-y-3 text-[13px] t-muted">
                <p>
                  {user
                    ? "Signed in — events sync to your account when the API is up."
                    : "Signed out — the graph stays in this browser only."}
                </p>
                <p>
                  Advisor, AI Mode, and Workspace already attach this packet to every question.
                </p>
                <Link href="/workspace" className="text-accent font-semibold">
                  Open workspace →
                </Link>
                <button type="button" className="btn-ghost flex items-center gap-1.5" onClick={reset}>
                  <RotateCcw size={13} /> Forget everything
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
