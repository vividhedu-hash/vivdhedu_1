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
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              City Hiring Demand Telemetry
            </h3>
            <p className="text-xs text-slate-400">Live job posting volumes & compensation benchmarks</p>
          </div>
        </div>

        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-indigo-300 font-semibold focus:outline-none focus:border-indigo-500"
        >
          {CITIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          Fetching live hiring data...
        </div>
      ) : data ? (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" /> Active Job Postings
            </div>
            <div className="text-xl font-black text-white">
              {data.total_active_postings != null ? data.total_active_postings.toLocaleString() : "—"}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Avg Starting Salary
            </div>
            <div className="text-xl font-black text-emerald-400">
              {data.avg_salary_inr != null ? `₹${(data.avg_salary_inr / 100000).toFixed(1)} LPA` : "—"}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> Market Demand Score
            </div>
            <div className="text-xl font-black text-amber-400">
              {data.demand_score != null ? `${data.demand_score} / 100` : "—"}
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-xs text-slate-400">Job market data unavailable from the live API.</p>
      )}
    </div>
  );
}
