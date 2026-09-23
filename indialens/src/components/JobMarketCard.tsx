"use client";

import React, { useState, useEffect } from "react";
import { Briefcase, TrendingUp, DollarSign, Building2 } from "lucide-react";

interface JobMarketCardProps {
  initialField?: string;
  initialCity?: string;
}

export default function JobMarketCard({
  initialField = "engineering-cs",
  initialCity = "bengaluru",
}: JobMarketCardProps) {
  const [field, setField] = useState<string>(initialField);
  const [city, setCity] = useState<string>(initialCity);
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);

  const CITIES = [
    { id: "bengaluru", name: "Bengaluru (Silicon Valley of India)" },
    { id: "ncr", name: "Delhi-NCR (Gurugram / Noida)" },
    { id: "hyderabad", name: "Hyderabad (Cyberabad)" },
    { id: "mumbai", name: "Mumbai (Financial Hub)" },
    { id: "pune", name: "Pune (Auto & Tech)" },
    { id: "chennai", name: "Chennai (SaaS & Hardware)" },
  ];

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

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
              City Hiring Demand Telemetry
            </h3>
            <p className="text-xs text-slate-500">Live job posting volumes & compensation benchmarks</p>
          </div>
        </div>

        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-slate-400"
        >
          {CITIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          Fetching live hiring data...
        </div>
      ) : data ? (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-700" /> Active Job Postings
            </div>
            <div className="text-xl font-black text-slate-900 font-mono">
              {data.total_active_postings != null ? data.total_active_postings.toLocaleString() : "—"}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Avg Starting Salary
            </div>
            <div className="text-xl font-black text-emerald-700 font-mono">
              {data.avg_salary_inr != null ? `₹${(data.avg_salary_inr / 100000).toFixed(1)} LPA` : "—"}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100">
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" /> Market Demand Score
            </div>
            <div className="text-xl font-black text-amber-700 font-mono">
              {data.demand_score != null ? `${data.demand_score} / 100` : "—"}
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-xs text-slate-500">Job market data unavailable from the live API.</p>
      )}
    </div>
  );
}
