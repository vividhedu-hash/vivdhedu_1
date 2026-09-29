"use client";

import React, { useState, useEffect } from "react";
import { Code2, Calendar, type LucideIcon } from "lucide-react";
import { Skeleton, SkeletonStatus } from "./Skeleton";
import { Notice } from "./Notice";
import { finiteOrNull, NO_DATA } from "../lib/mock-data";

interface EcosystemBadgeProps {
  universityName?: string;
}

/**
 * Open-source and tech-ecosystem density for one university, from the live
 * ecosystem endpoint.
 *
 * This was the only component in the set drawn on a near-black card sitting on
 * a light page, with the *dark* palette's green and a violet that is not in the
 * token set at all. On a light page the card read as a fragment of the dark
 * theme rather than as part of this one. It is now a `.panel` with the green
 * and purple tokens, which is the same meaning in both.
 *
 * The "GitHub & Wikidata Verified" chip was a hand-rolled green badge asserting
 * verification of the source. It is now `.badge-green` and says what the two
 * numbers actually are: the activity index comes from GitHub, the inception
 * year from Wikidata, and neither of those is a verification of the other. The
 * chip is therefore `GitHub + Wikidata`, with the provenance of each figure
 * stated on the figure rather than as a blanket claim on the header.
 *
 * The inception year is a plain integer, so it is a figure and is rendered in
 * `.num` like any other. It renders as a dash when absent — the previous
 * fallback put the dash in the same weight and colour as a real year.
 */
export default function EcosystemBadge({
  universityName = "IIT Bombay",
}: EcosystemBadgeProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/v1/external/ecosystem?university_name=${encodeURIComponent(universityName)}`);
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
    }
    load();
  }, [universityName]);

  if (loading) {
    return (
      <div className="panel min-w-0" aria-busy="true">
        <div className="panel-head">
          <span className="panel-title flex items-center gap-2">
            <Code2 size={12} aria-hidden="true" />
            Open-source &amp; tech ecosystem
          </span>
        </div>
        <div className="panel-pad-sm space-y-3">
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-2.5 w-24" delay={i * 70} />
                <Skeleton className="h-5 w-16" delay={i * 70 + 50} />
              </div>
            ))}
          </div>
          <SkeletonStatus label="Loading ecosystem telemetry" />
        </div>
      </div>
    );
  }

  if (!data) {
    // "Unavailable" as a stated failure with a next step, rather than a grey
    // sentence that reads as a state the page forgot to resolve.
    return (
      <Notice tone="warn" title="Ecosystem data unavailable" icon={Code2}>
        The live ecosystem endpoint did not return a response for{" "}
        <strong className="t-text">{universityName}</strong>, so no activity
        index or inception year is shown. Nothing has been substituted for the
        missing figures.
      </Notice>
    );
  }

  const activity = finiteOrNull(data?.github?.tech_activity_index);
  const established = finiteOrNull(data?.wikidata?.established);

  return (
    <section className="panel min-w-0">
      <div className="panel-head">
        <span className="panel-title flex items-center gap-2">
          <Code2 size={12} aria-hidden="true" />
          Open-source &amp; tech ecosystem
        </span>
        <span className="badge badge-green">GitHub + Wikidata</span>
      </div>

      <div className="panel-pad-sm">
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          <Figure
            label="Tech activity index"
            value={activity == null ? null : `${activity} / 100`}
            caption="From GitHub, as returned"
            color="var(--green)"
          />
          <Figure
            label="Est. inception year"
            value={established == null ? null : String(Math.round(established))}
            caption="From Wikidata, as returned"
            color="var(--purple)"
            icon={Calendar}
          />
        </div>
      </div>
    </section>
  );
}

function Figure({
  label,
  value,
  caption,
  color,
  icon: Icon,
}: {
  label: string;
  value: string | null;
  caption: string;
  color: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="t-elevated t-border min-w-0 rounded-lg border p-2.5">
      <span className="metric-label">{label}</span>
      {value == null ? (
        <span className="metric num-na">{NO_DATA}</span>
      ) : (
        <span className="flex items-center gap-1.5">
          {Icon && <Icon size={12} style={{ color }} aria-hidden="true" />}
          <span className="metric num" style={{ color }}>
            {value}
          </span>
        </span>
      )}
      <span className="mt-0.5 block text-[10px] leading-snug t-faint">
        {value == null ? "Not measured" : caption}
      </span>
    </div>
  );
}
