"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, Lock, RefreshCw } from "lucide-react";
import type { CollegeDegreeRecord, DegreeField } from "@/lib/mock-data";

// [AI-CoLab: Cursor] Explore previously crashed with "cannot read tuitionTotal of
// undefined": it read `item.cost.tuitionTotal` (schema is `costs.totalTuitionInr`)
// and invoked the server-side data layer from a client component. It now consumes
// the /api/colleges route and uses the canonical CollegeDegreeRecord shape.

const FIELD_LABELS: Record<DegreeField, string> = {
  "engineering-cs": "Engineering — CS",
  "engineering-non-cs": "Engineering — Core",
  medicine: "Medicine",
  management: "Management",
  commerce: "Commerce",
  design: "Design",
  law: "Law",
  arts: "Arts & Humanities",
};

/** Placement rates arrive either as fractions (0–1) or percentages (0–100). */
function placementPct(record: CollegeDegreeRecord): number {
  const rate = record.placement?.rate ?? 0;
  return Math.round(rate <= 1 ? rate * 100 : rate);
}

export default function ExplorePage() {
  const [data, setData] = useState<CollegeDegreeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Filter states
  const [search, setSearch] = useState("");
  const [fieldFilter, setFieldFilter] = useState("");
  const [sortBy, setSortBy] = useState("score-desc");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setLoadError(false);
      try {
        const res = await fetch("/api/colleges?per_page=100", { cache: "no-store" });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const json = await res.json();
        if (!cancelled) setData(Array.isArray(json.data) ? json.data : []);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setData([]);
          setLoadError(true);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.college.shortName.toLowerCase().includes(q) ||
          c.college.name.toLowerCase().includes(q) ||
          c.college.city.toLowerCase().includes(q) ||
          c.degree.shortName.toLowerCase().includes(q) ||
          c.degree.name.toLowerCase().includes(q)
      );
    }

    if (fieldFilter) {
      filtered = filtered.filter((c) => c.degree.field === fieldFilter);
    }

    filtered.sort((a, b) => {
      if (sortBy === "score-desc") return b.roi.compositeScore - a.roi.compositeScore;
      if (sortBy === "score-asc") return a.roi.compositeScore - b.roi.compositeScore;
      if (sortBy === "tuition-asc") return a.costs.totalTuitionInr - b.costs.totalTuitionInr;
      if (sortBy === "tuition-desc") return b.costs.totalTuitionInr - a.costs.totalTuitionInr;
      return 0;
    });

    return filtered;
  }, [data, search, fieldFilter, sortBy]);

  const uniqueFields = Array.from(new Set(data.map((d) => d.degree.field)));

  return (
    <div className="min-h-screen pb-20">
      <div className="container-xl pt-12 pb-8">
        <p className="kicker-web">Program Asset Index</p>
        <h1 className="headline mb-6">India&apos;s degrees, priced as financial assets.</h1>
        <Link href="/analyze" className="btn-primary inline-block mb-8">
          Analyze a specific degree
        </Link>
      </div>

      {/* Sticky Filter Bar */}
      <div className="sticky top-0 z-10 glass-card border-b border-[#1E1E2E] py-4 mb-8">
        <div className="container-xl flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search institutions, programs, or cities..."
              className="form-input w-full pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-input"
            value={fieldFilter}
            onChange={(e) => setFieldFilter(e.target.value)}
          >
            <option value="">All Fields</option>
            {uniqueFields.map((f) => (
              <option key={f} value={f}>
                {FIELD_LABELS[f] ?? f}
              </option>
            ))}
          </select>

          <select
            className="form-input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="score-desc">Highest Score First</option>
            <option value="score-asc">Lowest Score First</option>
            <option value="tuition-asc">Lowest Tuition First</option>
            <option value="tuition-desc">Highest Tuition First</option>
          </select>

          {!isLoading && (
            <span className="text-xs text-gray-500 font-mono">
              {filteredData.length} program{filteredData.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      <div className="container-xl">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading the program index…</div>
        ) : loadError ? (
          <div className="glass-card text-center py-12 px-6">
            <p className="text-gray-300 mb-4">
              The program index could not be loaded. Please try again.
            </p>
            <button className="btn-secondary inline-flex items-center gap-2" onClick={() => setReloadKey((k) => k + 1)}>
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto glass-card">
              <table className="data-table w-full text-left">
                <thead>
                  <tr>
                    <th className="p-4 border-b border-[#1E1E2E]">Rank</th>
                    <th className="p-4 border-b border-[#1E1E2E]">Institution + Program</th>
                    <th className="p-4 border-b border-[#1E1E2E]">Composite Score</th>
                    <th className="p-4 border-b border-[#1E1E2E]">AI Risk</th>
                    <th className="p-4 border-b border-[#1E1E2E]">Placement %</th>
                    <th className="p-4 border-b border-[#1E1E2E]">Tuition (₹L)</th>
                    <th className="p-4 border-b border-[#1E1E2E]">Audit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, index) => {
                    const badgeClass =
                      item.meta.aiRiskLabel === "Low"
                        ? "badge-green"
                        : item.meta.aiRiskLabel === "Medium"
                        ? "badge-yellow"
                        : "badge-red";

                    const tuitionL = (item.costs.totalTuitionInr / 100000).toFixed(1);

                    return (
                      <tr key={item.id} className="border-b border-[#1E1E2E]/50 hover:bg-[#1E1E2E]/30">
                        <td className="p-4 font-mono">{index + 1}</td>
                        <td className="p-4">
                          <Link href={`/college/${item.id}`} className="hover:text-blue-400 transition">
                            <div className="font-semibold text-white">{item.college.shortName}</div>
                            <div className="text-sm text-gray-400">{item.degree.shortName}</div>
                          </Link>
                        </td>
                        <td className="p-4">
                          <span className={`font-mono font-bold ${item.roi.compositeScore >= 80 ? 'text-green-500' : item.roi.compositeScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                            {item.roi.compositeScore.toFixed(1)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${badgeClass}`}>
                            {item.meta.aiRiskLabel}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-gray-300">{placementPct(item)}%</td>
                        <td className="p-4 font-mono text-gray-300">{tuitionL}L</td>
                        <td className="p-4">
                          <Lock size={16} className="text-gray-500" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden grid gap-4 grid-cols-1 sm:grid-cols-2">
              {filteredData.map((item, index) => (
                <div key={item.id} className="glass-card p-4 rounded-lg border border-[#1E1E2E]">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-xs text-gray-500 font-mono mb-1">#{index + 1}</div>
                      <Link href={`/college/${item.id}`}>
                        <h3 className="font-bold text-white leading-tight mb-1">{item.college.shortName}</h3>
                        <p className="text-sm text-gray-400">{item.degree.shortName}</p>
                      </Link>
                    </div>
                    <div className={`font-mono text-xl font-bold ${item.roi.compositeScore >= 80 ? 'text-green-500' : item.roi.compositeScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {item.roi.compositeScore.toFixed(0)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mt-4">
                    <div>
                      <div className="text-gray-500 text-xs">Tuition</div>
                      <div className="font-mono text-gray-200">₹{(item.costs.totalTuitionInr / 100000).toFixed(1)}L</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Placement</div>
                      <div className="font-mono text-gray-200">{placementPct(item)}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredData.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No programs found matching filters.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
