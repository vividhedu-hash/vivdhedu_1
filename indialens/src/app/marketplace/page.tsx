"use client";

import { useState } from "react";
import {
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Award,
  Zap,
  CheckCircle2,
  Filter,
  DollarSign,
  BookOpen,
  Lock
} from "lucide-react";

interface Course {
  id: string;
  course_title: string;
  provider: string;
  category: string;
  affiliate_url: string;
  price_inr: number;
  duration_hours: number;
  skill_tags: string[];
  career_paths: string[];
  ai_resilience_score: number;
  match_score: number;
  projected_salary_uplift_inr: number;
}

const COURSES: Course[] = [
  {
    id: "c1",
    course_title: "Deep Learning Specialization",
    provider: "DeepLearning.AI",
    category: "Technical Upskilling",
    affiliate_url: "https://www.coursera.org/specializations/deep-learning",
    price_inr: 3999,
    duration_hours: 60,
    skill_tags: ["Neural Networks", "PyTorch", "Transformers", "CNN", "RNN"],
    career_paths: ["AI Engineer", "ML Researcher"],
    ai_resilience_score: 0.94,
    match_score: 0.92,
    projected_salary_uplift_inr: 280000,
  },
  {
    id: "c2",
    course_title: "Generative AI with Large Language Models",
    provider: "DeepLearning.AI",
    category: "Technical Upskilling",
    affiliate_url: "https://www.coursera.org/learn/generative-ai-with-llms",
    price_inr: 3499,
    duration_hours: 32,
    skill_tags: ["LLMs", "RLHF", "PEFT", "LoRA", "Quantization"],
    career_paths: ["GenAI Lead", "NLP Architect"],
    ai_resilience_score: 0.96,
    match_score: 0.89,
    projected_salary_uplift_inr: 350000,
  },
  {
    id: "c3",
    course_title: "AWS Certified Solutions Architect Associate (SAA-C03)",
    provider: "AWS Training",
    category: "Enterprise Certifications",
    affiliate_url: "https://aws.amazon.com/certification/certified-solutions-architect-associate",
    price_inr: 12500,
    duration_hours: 45,
    skill_tags: ["Cloud Architecture", "AWS VPC", "S3", "EC2", "Distributed Systems"],
    career_paths: ["Cloud Architect", "DevOps Lead"],
    ai_resilience_score: 0.88,
    match_score: 0.84,
    projected_salary_uplift_inr: 220000,
  },
  {
    id: "c4",
    course_title: "Google Cloud Professional Data Engineer Certification",
    provider: "Google Cloud",
    category: "Enterprise Certifications",
    affiliate_url: "https://cloud.google.com/learn/certification/data-engineer",
    price_inr: 16500,
    duration_hours: 50,
    skill_tags: ["BigQuery", "Dataflow", "Apache Beam", "Data Pipelines"],
    career_paths: ["Data Engineer", "Analytics Architect"],
    ai_resilience_score: 0.89,
    match_score: 0.82,
    projected_salary_uplift_inr: 240000,
  },
  {
    id: "c5",
    course_title: "IIT JEE Advanced Masterclasses & Test Series",
    provider: "Unacademy Plus",
    category: "Exam Prep",
    affiliate_url: "https://unacademy.com/goal/jee-main-and-advanced-preparation/TMUVD",
    price_inr: 28000,
    duration_hours: 250,
    skill_tags: ["Calculus", "Physics", "Inorganic Chemistry", "Problem Solving"],
    career_paths: ["B.Tech Undergraduate"],
    ai_resilience_score: 0.75,
    match_score: 0.79,
    projected_salary_uplift_inr: 450000,
  },
  {
    id: "c6",
    course_title: "Duolingo English Test (DET) Official Prep & Voucher",
    provider: "Duolingo",
    category: "Global Language",
    affiliate_url: "https://englishtest.duolingo.com",
    price_inr: 4900,
    duration_hours: 20,
    skill_tags: ["Verbal English", "Listening Comprehension", "GRE Alternative"],
    career_paths: ["International Student", "Global Professional"],
    ai_resilience_score: 0.82,
    match_score: 0.86,
    projected_salary_uplift_inr: 180000,
  },
];

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "Technical Upskilling", "Enterprise Certifications", "Exam Prep", "Global Language"];

  const filteredCourses = COURSES.filter((c) => {
    if (selectedCategory !== "All" && c.category !== selectedCategory) return false;
    return c.match_score >= 0.75; // Strict PRD threshold
  });

  const handleTrackClick = async (course: Course) => {
    try {
      await fetch("/api/v2/marketplace/track-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: course.id,
          student_token: "guest_session",
          match_score: course.match_score
        })
      });
    } catch {
      // Non-blocking telemetry
    }
    window.open(course.affiliate_url, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="border-b border-slate-200 pb-8 mb-10">
          <div className="flex items-center gap-2 text-rose-600 text-xs uppercase tracking-widest font-mono font-semibold mb-2">
            <ShoppingBag className="w-4 h-4" />
            <span>Actuarial Upskilling Hub · Section 03 Specification</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
            Curated Course Marketplace & Skill Gap Hedge
          </h1>
          <p className="mt-3 text-base text-slate-600 max-w-3xl leading-relaxed">
            Zero generic banner ads. Every course displayed here has passed a strict mathematical relevance threshold (Match Score ≥ 0.75), targeting your specific skill gaps and AI obsolescence vulnerabilities.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-8 bg-white border border-slate-200 p-2.5 rounded-xl shadow-sm">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedCategory === cat
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {course.provider}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {/* Match Score Gate — M(s,c) >= 0.75 required */}
                    {course.match_score >= 0.75 ? (
                      <span className="epistemic-tag tag-ui flex items-center gap-1">
                        <CheckCircle2 size={9} />
                        M={Math.round(course.match_score * 100)}%
                      </span>
                    ) : (
                      <span className="epistemic-tag tag-gap flex items-center gap-1" title="Below match threshold M(s,c) < 0.75 — not recommended">
                        <Lock size={9} />
                        Gated
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-950 leading-snug">{course.course_title}</h3>
                <p className="text-xs text-slate-500 mt-1">{course.category} · {course.duration_hours} Hours</p>

                {/* Skill Tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {course.skill_tags.map((st, i) => (
                    <span key={i} className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md">
                      {st}
                    </span>
                  ))}
                </div>

                {/* Economic ROI Impact */}
                <div className="mt-4 bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs space-y-1.5">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Course Fee:</span>
                    <span className="text-slate-900 font-bold font-mono">₹{course.price_inr.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-700">
                    <span>Projected Y1 Uplift:</span>
                    <span className="font-bold font-mono">+₹{(course.projected_salary_uplift_inr / 100000).toFixed(1)} L/yr</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 text-[11px]">
                    <span>AI Resilience Hedge:</span>
                    <span className="font-mono text-slate-700">{Math.round(course.ai_resilience_score * 100)}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleTrackClick(course)}
                  disabled={course.match_score < 0.75}
                  className={`w-full rounded-xl text-xs font-semibold py-2.5 flex items-center justify-center gap-1.5 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    course.match_score >= 0.75
                      ? "bg-slate-950 hover:bg-slate-800 text-white"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed opacity-50"
                  }`}
                >
                  {course.match_score >= 0.75 ? (
                    <>
                      <span>Enroll on {course.provider}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <Lock size={12} />
                      <span>Build profile to unlock</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
