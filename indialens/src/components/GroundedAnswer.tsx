"use client";

import { ExternalLink } from "lucide-react";
import type { GroundedPayload } from "../lib/grounded";

export function GroundedAnswer({ payload }: { payload: GroundedPayload }) {
  const text = payload.text || payload.advice_markdown || "";
  const citations = payload.citations ?? [];
  const queries = payload.search_queries ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider">
        <span className={payload.grounded ? "text-emerald-400" : "text-amber-400"}>
          {payload.grounded ? "Web-grounded" : "Not grounded"}
        </span>
        {payload.engine && <span className="text-slate-500 font-mono normal-case">{payload.engine}</span>}
      </div>

      <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{text}</div>

      {citations.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Sources</p>
          <ol className="space-y-1.5">
            {citations.map((c, i) => (
              <li key={`${c.url}-${i}`} className="text-xs text-slate-400 flex gap-2">
                <span className="text-slate-600 font-mono">{i + 1}.</span>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-1 break-all"
                >
                  {c.title || c.url}
                  <ExternalLink size={11} />
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}

      {queries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {queries.map((q) => (
            <span key={q} className="text-[11px] px-2 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
              {q}
            </span>
          ))}
        </div>
      )}

      {payload.search_suggestions_html ? (
        <iframe
          title="Google Search suggestions"
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
          srcDoc={payload.search_suggestions_html}
          className="w-full min-h-[72px] rounded-lg border border-slate-800 bg-white"
        />
      ) : null}
    </div>
  );
}
