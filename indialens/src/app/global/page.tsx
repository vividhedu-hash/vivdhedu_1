"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Globe,
  ShieldCheck,
  TrendingUp,
  Building2,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Calculator,
  Compass,
  CheckCircle2,
  Info
} from "lucide-react";

interface GlobalProgram {
  university_name: string;
  country: string;
  city: string;
  degree_name: string;
  major: string;
  global_tier: string;
  is_stem_designated: boolean;
  annual_tuition_usd: number;
  living_cost_annual_usd: number;
  median_salary_usd_y1: number;
  median_salary_usd_y5: number;
  visa_type: string;
  visa_survival_prob: number;
  effective_tax_rate: number;
  monthly_rent_median_usd: number;
}

const GLOBAL_PROGRAMS: GlobalProgram[] = [
  {
    university_name: "Purdue University",
    country: "United States",
    city: "West Lafayette, IN",
    degree_name: "Master of Science",
    major: "Computer Science",
    global_tier: "Value Kings",
    is_stem_designated: true,
    annual_tuition_usd: 29800,
    living_cost_annual_usd: 14500,
    median_salary_usd_y1: 118000,
    median_salary_usd_y5: 165000,
    visa_type: "F-1 OPT (3-Year STEM)",
    visa_survival_prob: 0.578,
    effective_tax_rate: 0.245,
    monthly_rent_median_usd: 950,
  },
  {
    university_name: "Georgia Institute of Technology",
    country: "United States",
    city: "Atlanta, GA",
    degree_name: "Master of Science",
    major: "Computer Science / Machine Learning",
    global_tier: "Value Kings",
    is_stem_designated: true,
    annual_tuition_usd: 31500,
    living_cost_annual_usd: 16800,
    median_salary_usd_y1: 128000,
    median_salary_usd_y5: 182000,
    visa_type: "F-1 OPT (3-Year STEM)",
    visa_survival_prob: 0.578,
    effective_tax_rate: 0.260,
    monthly_rent_median_usd: 1250,
  },
  {
    university_name: "Technical University of Munich (TUM)",
    country: "Germany",
    city: "Munich",
    degree_name: "Master of Science",
    major: "Informatics / Software Engineering",
    global_tier: "Zero-Tuition Arbitrage",
    is_stem_designated: true,
    annual_tuition_usd: 0,
    living_cost_annual_usd: 15600,
    median_salary_usd_y1: 72000,
    median_salary_usd_y5: 98000,
    visa_type: "EU Blue Card",
    visa_survival_prob: 0.940,
    effective_tax_rate: 0.340,
    monthly_rent_median_usd: 1100,
  },
  {
    university_name: "RWTH Aachen University",
    country: "Germany",
    city: "Aachen",
    degree_name: "Master of Science",
    major: "Automotive & Mechanical Systems",
    global_tier: "Zero-Tuition Arbitrage",
    is_stem_designated: true,
    annual_tuition_usd: 0,
    living_cost_annual_usd: 12000,
    median_salary_usd_y1: 68000,
    median_salary_usd_y5: 92000,
    visa_type: "EU Blue Card",
    visa_survival_prob: 0.940,
    effective_tax_rate: 0.320,
    monthly_rent_median_usd: 680,
  },
  {
    university_name: "Carnegie Mellon University (CMU)",
    country: "United States",
    city: "Pittsburgh, PA",
    degree_name: "Master of Science",
    major: "Language Technologies / AI",
    global_tier: "Convex Ceiling Elite",
    is_stem_designated: true,
    annual_tuition_usd: 58500,
    living_cost_annual_usd: 18000,
    median_salary_usd_y1: 155000,
    median_salary_usd_y5: 235000,
    visa_type: "F-1 OPT (3-Year STEM)",
    visa_survival_prob: 0.578,
    effective_tax_rate: 0.285,
    monthly_rent_median_usd: 1200,
  },
  {
    university_name: "National University of Singapore (NUS)",
    country: "Singapore",
    city: "Singapore",
    degree_name: "Master of Computing",
    major: "Computer Science & AI",
    global_tier: "Convex Ceiling Elite",
    is_stem_designated: true,
    annual_tuition_usd: 38000,
    living_cost_annual_usd: 19200,
    median_salary_usd_y1: 84000,
    median_salary_usd_y5: 130000,
    visa_type: "Employment Pass (EP)",
    visa_survival_prob: 0.820,
    effective_tax_rate: 0.150,
    monthly_rent_median_usd: 1600,
  },
  {
    university_name: "London School of Economics (LSE)",
    country: "United Kingdom",
    city: "London",
    degree_name: "BSc / MSc",
    major: "Economics & Quantitative Methods",
    global_tier: "Convex Ceiling Elite",
    is_stem_designated: true,
    annual_tuition_usd: 36500,
    living_cost_annual_usd: 21000,
    median_salary_usd_y1: 94000,
    median_salary_usd_y5: 165000,
    visa_type: "UK Graduate Route (2-Yr PSW)",
    visa_survival_prob: 0.880,
    effective_tax_rate: 0.280,
    monthly_rent_median_usd: 1550,
  },
  {
    university_name: "University of Warwick",
    country: "United Kingdom",
    city: "Coventry",
    degree_name: "BSc / MSc",
    major: "Economics & Econometrics",
    global_tier: "Value Kings",
    is_stem_designated: true,
    annual_tuition_usd: 28500,
    living_cost_annual_usd: 14000,
    median_salary_usd_y1: 76000,
    median_salary_usd_y5: 125000,
    visa_type: "UK Graduate Route (2-Yr PSW)",
    visa_survival_prob: 0.880,
    effective_tax_rate: 0.260,
    monthly_rent_median_usd: 900,
  },
  {
    university_name: "University of Oxford",
    country: "United Kingdom",
    city: "Oxford",
    degree_name: "MSc",
    major: "Financial Economics / Mathematical Modeling",
    global_tier: "Convex Ceiling Elite",
    is_stem_designated: true,
    annual_tuition_usd: 48000,
    living_cost_annual_usd: 19500,
    median_salary_usd_y1: 135000,
    median_salary_usd_y5: 220000,
    visa_type: "UK Graduate Route (2-Yr PSW)",
    visa_survival_prob: 0.910,
    effective_tax_rate: 0.310,
    monthly_rent_median_usd: 1350,
  },
];

const USD_TO_INR = 86.5;

export default function GlobalDegreesPage() {
  const [selectedCountry, setSelectedCountry] = useState<string>("All");
  const [selectedTier, setSelectedTier] = useState<string>("All");
  const [stemOnly, setStemOnly] = useState<boolean>(false);

  const filteredPrograms = GLOBAL_PROGRAMS.filter((p) => {
    if (selectedCountry !== "All" && p.country !== selectedCountry) return false;
    if (selectedTier !== "All" && p.global_tier !== selectedTier) return false;
    if (stemOnly && !p.is_stem_designated) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header Section */}
        <div className="border-b border-slate-200 pb-8 mb-10">
          <div className="flex items-center gap-2 text-rose-600 text-xs uppercase tracking-widest font-mono font-semibold mb-2">
            <Globe className="w-4 h-4" />
            <span>Cross-Border Actuarial Valuation Hub · Section 10 Specification</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
            Global Degree Valuation & Visa Arbitrage
          </h1>
          <p className="mt-3 text-base text-slate-600 max-w-3xl leading-relaxed">
            Evaluating foreign master's programs through 20-year cross-border Net Present Value, STEM OPT H-1B retention probabilities, and spatial cost-of-living tax drag. Zero agent commissions; pure actuarial math.
          </p>

          {/* Core Actuarial KPI Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
              <span className="text-xs font-mono text-slate-500 uppercase">STEM OPT H-1B Odds (3-Yr)</span>
              <div className="text-2xl font-bold text-emerald-700 mt-1">57.8%</div>
              <span className="text-[11px] text-slate-400">1 - (1 - 0.25)³ Cumulative</span>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
              <span className="text-xs font-mono text-slate-500 uppercase">Non-STEM H-1B Odds (1-Yr)</span>
              <div className="text-2xl font-bold text-rose-600 mt-1">25.0%</div>
              <span className="text-[11px] text-rose-600/80">75% Structural Deportation Hazard</span>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
              <span className="text-xs font-mono text-slate-500 uppercase">Germany EU Blue Card</span>
              <div className="text-2xl font-bold text-blue-700 mt-1">94.0%</div>
              <span className="text-[11px] text-slate-400">PR fast-track in 21 months</span>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
              <span className="text-xs font-mono text-slate-500 uppercase">US Dollar Benchmark</span>
              <div className="text-2xl font-bold text-amber-600 mt-1">₹86.50</div>
              <span className="text-[11px] text-slate-400">RBI Forward FX Drift Calibrated</span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-mono text-slate-500 uppercase">Country:</label>
            {["All", ...Array.from(new Set(GLOBAL_PROGRAMS.map((p) => p.country)))].map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCountry(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedCountry === c
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-mono text-slate-500 uppercase">Tier:</label>
            {["All", "Value Kings", "Zero-Tuition Arbitrage", "Convex Ceiling Elite"].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTier(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedTier === t
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="stem"
              checked={stemOnly}
              onChange={(e) => setStemOnly(e.target.checked)}
              className="rounded bg-white border-slate-300 text-slate-950 focus:ring-0"
            />
            <label htmlFor="stem" className="text-xs font-mono text-slate-600 cursor-pointer">
              STEM OPT Designated Only
            </label>
          </div>
        </div>

        {/* Global Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((p, idx) => {
            const totalCostUsd = (p.annual_tuition_usd + p.living_cost_annual_usd) * 2;
            const totalCostInr = totalCostUsd * USD_TO_INR;
            const netSavingsUsd = p.median_salary_usd_y1 * (1 - p.effective_tax_rate) - (p.monthly_rent_median_usd * 12) - 10000;
            const netSavingsInr = netSavingsUsd * USD_TO_INR;

            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {p.global_tier}
                    </span>
                    <span className={`text-[11px] font-mono font-semibold ${
                      p.visa_survival_prob >= 0.90 ? "text-emerald-700" : "text-amber-700"
                    }`}>
                      Visa Survival: {Math.round(p.visa_survival_prob * 100)}%
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-950 leading-tight">{p.university_name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{p.city}, {p.country}</p>
                  <div className="text-xs text-slate-700 font-medium mt-2 bg-slate-50 border border-slate-100 p-2 rounded-xl">
                    {p.degree_name} in {p.major}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
                    <div>
                      <span className="text-slate-400 font-mono text-[11px]">Total 2-Yr Cost:</span>
                      <div className="text-slate-900 font-bold font-mono">
                        {p.annual_tuition_usd === 0 ? "€0 Tuition (Living Only)" : `$${totalCostUsd.toLocaleString()}`}
                      </div>
                      <span className="text-[10px] text-slate-500">₹{(totalCostInr / 100000).toFixed(1)} Lakhs</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-mono text-[11px]">Starting Salary (Y1):</span>
                      <div className="text-emerald-700 font-bold font-mono">${p.median_salary_usd_y1.toLocaleString()}</div>
                      <span className="text-[10px] text-slate-500">₹{(p.median_salary_usd_y1 * USD_TO_INR / 100000).toFixed(1)} L/yr</span>
                    </div>
                  </div>

                  <div className="mt-3 bg-slate-50 border border-slate-200 p-3 rounded-xl text-[11px]">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Net Annual Savings (Post-Tax/Rent):</span>
                      <span className="text-slate-950 font-bold font-mono">${Math.round(netSavingsUsd).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 mt-1">
                      <span>Effective Tax Drag:</span>
                      <span className="font-mono text-slate-700">{(p.effective_tax_rate * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-500">Visa: {p.visa_type}</span>
                  <Link
                    href={`/analyze?country=${encodeURIComponent(p.country)}`}
                    className="text-xs text-slate-950 hover:underline font-bold flex items-center gap-1"
                  >
                    <span>Model NPV</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Spatial Arbitrage Commentary */}
        <div className="mt-12 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-rose-600" />
            <span>Spatial Arbitrage Law: Austin TX vs San Francisco vs Munich</span>
          </h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            A $120,000 gross offer in the San Francisco Bay Area carries an effective ~40.5% combined tax burden plus $3,200/mo median rent, generating ~$16,200 in net annual savings. The exact same candidate earning $100,000 in Austin, Texas (zero state tax, $1,450/mo rent) yields ~$48,000 in net savings—a <strong>300% higher capital accumulation rate</strong> despite a lower headline number.
          </p>
        </div>
      </main>
    </div>
  );
}
