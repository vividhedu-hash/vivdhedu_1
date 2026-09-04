"use client";

import { useMemo, useState } from "react";
import type { PathEdge, PathNode } from "../lib/grounded";

const KIND_COLOR: Record<string, string> = {
  exam: "#818cf8",
  program: "#34d399",
  skill: "#fbbf24",
  role: "#fb7185",
  gate: "#94a3b8",
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

  if (!nodes.length) {
    return <p className="text-sm text-slate-500">No path nodes returned.</p>;
  }

  return (
    <div className="space-y-3">
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="w-full h-auto rounded-xl border border-slate-800 bg-slate-950"
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
                stroke="#334155"
                strokeWidth="1.5"
              />
              {e.label ? (
                <text x={(a.x + b.x) / 2} y={midY} fill="#64748b" fontSize="10" textAnchor="middle">
                  {e.label}
                </text>
              ) : null}
            </g>
          );
        })}
        {nodes.map((n) => {
          const p = layout.pos.get(n.id);
          if (!p) return null;
          const color = KIND_COLOR[n.kind || ""] || "#94a3b8";
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
                fill={on ? "#1e293b" : "#0f172a"}
                stroke={color}
                strokeWidth={on ? 2 : 1}
              />
              <text textAnchor="middle" y={-4} fill={color} fontSize="9" fontWeight="600">
                {(n.kind || "step").toUpperCase()}
              </text>
              <text textAnchor="middle" y={12} fill="#e2e8f0" fontSize="11" fontWeight="600">
                {n.label.length > 22 ? `${n.label.slice(0, 21)}…` : n.label}
              </text>
            </g>
          );
        })}
      </svg>
      {selected && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">
          <p className="text-white font-semibold">{selected.label}</p>
          {selected.note && <p className="mt-1 text-slate-400">{selected.note}</p>}
          {selected.catalog_program_id && (
            <a
              href={`/college/${selected.catalog_program_id}`}
              className="mt-2 inline-block text-xs text-indigo-300 hover:text-indigo-200"
            >
              Open catalog program
            </a>
          )}
        </div>
      )}
    </div>
  );
}
