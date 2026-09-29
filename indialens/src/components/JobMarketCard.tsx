"use client";

import React, { useState, useEffect } from "react";
import { Briefcase, TrendingUp, DollarSign, Building2, type LucideIcon } from "lucide-react";
import { Skeleton, SkeletonStatus } from "./Skeleton";
import { Notice } from "./Notice";
import { finiteOrNull, NO_DATA } from "../lib/mock-data";

interface JobMarketCardProps {
  initialField?: string;
  initialCity?: string;
}

/**
 * City hiring telemetry from the live job-market endpoint.
 *
 * The three figures are a `Metric` triple rather than three hand-built stat
 * boxes, which is the whole point of the `Metric` component existing: a label,
 * a tabular value, a stated provenance, and a first-class unmeasured state, in
 * one place. The previous version drew a `text-xl font-black` figure inside a
 * tinted box per cell, with `—` rendered in the same weight as a real reading
 * and no statement of where any of the three numbers came from.
 *
 * **The demand score is labelled as out of 100, and the postings count is
 * labelled as a count.** Both were already true; the restyle just makes the
 * distinction legible, because "78" for a count of postings and "78 / 100" for
 * a demand index are different claims and the box used to make them look alike.
 *
 * `field` is still not surfaced as a control — the prop is accepted, sent to
 * the endpoint, and reflected in the request when it changes, exactly as
 * before. It is not given a selector here, because inventing one would imply a
 * field list this component does not have.
 */

const CITIES = [
  { id: "bengaluru", name: "Bengaluru (Silicon Valley of India)" },
  { id: "ncr", name: "Delhi-NCR (Gurugram / Noida)" },
  { id: "hyderabad", name: "Hyderabad (Cyberabad)" },
  { id: "mumbai", name: "Mumbai (Financial Hub)" },
  { id: "pune", name: "Pune (Auto & Tech)" },
  { id: "chennai", name: "Chennai (SaaS & Hardware)" },
];

type JobMarketData = {
  total_active_postings?: number | null;
  avg_salary_inr?: number | null;
  demand_score?: number | null;
} | null;

export default function JobMarketCard({
  initialField = "engineering-cs",
  initialCity = "bengaluru",
}: JobMarketCardProps) {
  const [field, setField] = useState<string>(initialField);
  const [city, setCity] = useState<string>(initialCity);
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchMarketData(field, city);
  }, [field, city]);

  const fetchMarketData = async (f: string, c: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/external/job-market?field=${f}&city=${c}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setData(null);
      }
    } catch (e) {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const body = (d: JobMarketData): React.ReactNode => {
    // Skeleton, not a spinner. A spinner implies the wait is short; this
    // request crosses to a FastAPI upstream, and the skeleton is shaped like
    // the three cells so nothing reflows when the figures land.
    if (loading) {
      return (
        <div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="min-w-0 space-y-2">
                <Skeleton className="h-2.5 w-28" delay={i * 70} />
                <Skeleton className="h-6 w-20" delay={i * 70 + 50} />
              </div>
            ))}
          </div>
          <SkeletonStatus label="Fetching live hiring data" />
        </div>
      );
    }

    if (!d) {
      // A failed fetch is stated as a failure. The previous line was a bare
      // grey sentence, which read as a loading state that had given up rather
      // than as a request that did not return.
      return (
        <Notice tone="warn" title="Job market data unavailable" className="mt-4">
          The live hiring endpoint did not return a response for this city, so
          the three figures below are not shown. Nothing has been estimated in
          their place &mdash; a dash here means the data is absent, not zero.
        </Notice>
      );
    }

    const postings = finiteOrNull(d.total_active_postings);
    const salary = finiteOrNull(d.avg_salary_inr);
    const demand = finiteOrNull(d.demand_score);

    return (
      <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
        <Cell
          icon={Building2}
          label="Active job postings"
          value={postings == null ? null : postings}
          format={(v) => v.toLocaleString()}
          caption="Count, as returned by the endpoint"
          color="var(--blue)"
        />
        <Cell
          icon={DollarSign}
          label="Avg starting salary"
          value={salary == null ? null : salary}
          format={(v) => `₹${(v / 100000).toFixed(1)}L`}
          caption="Annual, mean of the posted band"
          color="var(--green)"
        />
        <Cell
          icon={TrendingUp}
          label="Market demand score"
          value={demand == null ? null : demand}
          format={(v) => `${v} / 100`}
          caption="Index out of 100, not a posting count"
          color="var(--amber)"
        />
      </div>
    );
  };

  return (
    <section className="panel min-w-0">
      <div className="panel-head">
        <span className="panel-title flex items-center gap-2">
          <Briefcase size={12} aria-hidden="true" />
          City hiring demand telemetry
        </span>
        {/* `.form-select` keeps its own focus treatment, which the global
            focus rule would otherwise double up with. */}
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          aria-label="City"
          className="form-select form-input max-w-[15rem] cursor-pointer px-3 py-1.5 text-[12px]"
        >
          {CITIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="panel-pad">
        <p className="mb-1 text-[13px] font-semibold t-text">
          Live job posting volumes &amp; compensation benchmarks
        </p>
        <p className="text-[11px] t-faint">
          Field: <span className="num">{field}</span> &middot; source is the
          live job-market endpoint, not a stored figure
        </p>
        {body(data as JobMarketData)}
      </div>
    </section>
  );
}

/**
 * One figure, with its provenance.
 *
 * The value is coloured by the figure's own role (a count is neutral, a salary
 * reads green, a demand index reads amber) but the *unmeasured* state is
 * always the muted dash — a red or amber dash would assert that this is a bad
 * reading rather than that there is no reading, which is the distinction the
 * whole `.num-na` treatment exists to protect.
 */
function Cell({
  icon: Icon,
  label,
  value,
  format,
  caption,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: number | null;
  format: (v: number) => string;
  caption: string;
  color: string;
}) {
  return (
    <div className="t-elevated t-border min-w-0 rounded-xl border p-3.5">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Icon size={12} style={{ color }} aria-hidden="true" />
        <span className="metric-label">{label}</span>
      </div>
      {value == null ? (
        <>
          <span className="metric-lg num-na">{NO_DATA}</span>
          <span className="mt-0.5 block text-[10px] leading-snug t-faint">
            Not measured
          </span>
        </>
      ) : (
        <>
          <span className="metric-lg" style={{ color }}>
            {format(value)}
          </span>
          <span className="mt-0.5 block text-[10px] leading-snug t-faint">
            {caption}
          </span>
        </>
      )}
    </div>
  );
}
