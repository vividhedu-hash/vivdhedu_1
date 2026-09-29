"use client";

import { useMemo, useState } from "react";
import { GitBranch } from "lucide-react";
import { EmptyState } from "./EmptyState";
import type { PathEdge, PathNode } from "../lib/grounded";

/**
 * The academic path — a layered graph of choice nodes returned by the
 * intelligence payload.
 *
 * Colour notes, since this is the component where a hex is most tempting:
 *
 *  - The five node-kind colours are CSS custom properties. They were five
 *    hand-picked literals, tuned against a near-black panel, and they could not
 *    theme: on the light canvas the same five hues meant something different,
 *    so "exam vs. program" was carried by colours that shifted with the theme.
 *    The token set — purple / green / amber / accent / text-tertiary — is the
 *    same five roles.
 *  - Edges and labels use `--border` and `--text-tertiary` respectively, which
 *    is what a hairline is for. The previous pair existed only because the
 *    drawing surface was hardcoded near-black.
 */
const KIND_COLOR: Record<string, string> = {
  exam: "var(--purple)",
  program: "var(--green)",
  skill: "var(--amber)",
  role: "var(--accent)",
  gate: "var(--text-tertiary)",
};

export function AcademicPathChart({
  nodes,
  edges,
}: {
  nodes: PathNode[];
  edges: PathEdge[];
}) {
  const [active, setActive] = useState<string | null>(null);

  const layout = useMemo(() => {
    const layers = new Map<number, PathNode[]>();
    for (const n of nodes) {
      const layer = Number.isFinite(n.layer) ? Number(n.layer) : 0;
      const list = layers.get(layer) ?? [];
      list.push(n);
      layers.set(layer, list);
    }
    const layerKeys = Array.from(layers.keys()).sort((a, b) => a - b);
    const width = 920;
    const rowH = 120;
    const height = Math.max(220, layerKeys.length * rowH + 40);
    const pos = new Map<string, { x: number; y: number }>();
    layerKeys.forEach((layer, li) => {
      const row = layers.get(layer) ?? [];
      row.forEach((n, i) => {
        const x = ((i + 1) / (row.length + 1)) * width;
        const y = 40 + li * rowH;
        pos.set(n.id, { x, y });
      });
    });
    return { width, height, pos };
  }, [nodes]);

  const selected = nodes.find((n) => n.id === active);

  // An engine that returned a token but no path has measured nothing. Rendering
  // an empty axis band here would read as "the path has no steps", which is a
  // different claim from "no path was produced".
  if (!nodes.length) {
    return (
      <EmptyState
        variant="inline"
        icon={GitBranch}
        title="No academic path returned"
        hint="This run produced no path nodes, so nothing is drawn. An empty path is not a recommendation that the route is closed — the engine returned no steps to draw."
        action={{ label: "Run a new grounded search", href: "/advisor" }}
      />
    );
  }

  return (
    <div className="min-w-0 space-y-3">
      <div className="t-bg t-border min-w-0 overflow-x-auto rounded-xl border p-2">
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="h-auto w-full"
          role="img"
          aria-label="Academic choice path"
        >
          {edges.map((e, i) => {
            const a = layout.pos.get(e.from);
            const b = layout.pos.get(e.to);
            if (!a || !b) return null;
            const midY = (a.y + b.y) / 2;
            return (
              <g key={`${e.from}-${e.to}-${i}`}>
                <path
                  d={`M ${a.x} ${a.y + 18} C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y - 18}`}
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="1.5"
                />
                {e.label ? (
                  <text
                    x={(a.x + b.x) / 2}
                    y={midY}
                    fill="var(--text-tertiary)"
                    fontSize="10"
                    textAnchor="middle"
                    className="mono"
                  >
                    {e.label}
                  </text>
                ) : null}
              </g>
            );
          })}
          {nodes.map((n) => {
            const p = layout.pos.get(n.id);
            if (!p) return null;
            const color = KIND_COLOR[n.kind || ""] || "var(--text-tertiary)";
            const on = active === n.id;
            return (
              <g
                key={n.id}
                transform={`translate(${p.x}, ${p.y})`}
                className="cursor-pointer"
                onClick={() => setActive(n.id)}
              >
                <rect
                  x={-86}
                  y={-22}
                  width={172}
                  height={44}
                  rx={10}
                  fill={on ? "var(--bg-chip)" : "var(--bg-elevated)"}
                  stroke={color}
                  strokeWidth={on ? 2 : 1}
                />
                <text
                  textAnchor="middle"
                  y={-4}
                  fill={color}
                  fontSize="9"
                  fontWeight="600"
                  className="mono"
                  letterSpacing="0.08em"
                >
                  {(n.kind || "step").toUpperCase()}
                </text>
                <text
                  textAnchor="middle"
                  y={12}
                  fill="var(--text-primary)"
                  fontSize="11"
                  fontWeight="600"
                >
                  {n.label.length > 22 ? `${n.label.slice(0, 21)}…` : n.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {selected ? (
        <div className="t-elevated t-border rounded-xl border p-4">
          <p className="text-[14px] font-semibold t-text">{selected.label}</p>
          {selected.note && (
            <p className="mt-1 text-[12px] leading-relaxed t-muted">
              {selected.note}
            </p>
          )}
          {selected.catalog_program_id && (
            <a
              href={`/college/${selected.catalog_program_id}`}
              className="t-accent mt-2 inline-block text-[12px] font-medium"
            >
              Open catalog program
            </a>
          )}
        </div>
      ) : (
        <p className="text-[11px] t-faint">
          Select a node to see its note and any catalogue programme attached to it.
        </p>
      )}
    </div>
  );
}
