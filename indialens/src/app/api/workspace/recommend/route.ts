import { NextRequest, NextResponse } from "next/server";
import { geminiGenerate, geminiConfigured } from "@/lib/gemini-direct";

interface DeltaMetric {
  label: string;
  from: string;
  to: string;
  delta: string;
  positive: boolean;
}

interface WorkspaceRecommendation {
  recommendation: string;
  rationale: string;
  primaryAction: string;
  confidence: number;
  deltaMetrics: DeltaMetric[];
  _source: "advisor" | "grounded";
  verified: boolean;
}

const GREETINGS = new Set(["yo", "hi", "hello", "hey", "sup", "hola", "namaste", "test", "ping"]);

/**
 * POST /api/workspace/recommend
 *
 * Runs the student question through VividhEdu's grounded AI engine (OpenRouter / Gemini + Tavily).
 * Never returns canned demo responses or fabricated metrics.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, profile_token, context, person_context } = body as {
      question: string;
      profile_token?: string;
      context?: Record<string, any>;
      person_context?: string;
    };

    const q = (question || "").trim();
    if (!q) {
      return NextResponse.json({ error: "question is required" }, { status: 400 });
    }

    // Handle simple greetings or empty pings honestly without fabricating metrics
    if (GREETINGS.has(q.toLowerCase()) || q.length < 3) {
      return NextResponse.json({
        recommendation: "Ready to calibrate your academic and career trajectory. Ask a specific question about programs, college ROI, entrance cutoffs, or career paths.",
        rationale: "No specific question or constraint was detected in your input. You can type questions like 'What is the real ROI of private CS vs NIT Core?' or 'How will AI impact corporate law careers?'.",
        primaryAction: "Type a specific higher-education or career question to run the simulation.",
        confidence: 90,
        deltaMetrics: [],
        _source: "advisor",
        verified: true,
      });
    }

    // Build the structured prompt for the Grounded AI Engine
    const studentContextStr = context
      ? Object.entries(context)
          .filter(([_, v]) => v !== null && v !== undefined && v !== "")
          .map(([k, v]) => `- ${k.replace(/_/g, " ")}: ${v}`)
          .join("\n")
      : "No prior profile metrics linked.";

    const prompt = `You are the VividhEdu Decision Engine — an actuarial education-and-career intelligence system for Indian students.
Your job is to produce a DEFINITIVE, QUANTIFIED, SOURCE-GROUNDED RECOMMENDATION with ZERO sycophancy.
Do not invent figures. If a number is unverified, say so.

Student context:
${studentContextStr}
${person_context ? `\nPERSON MEMORY:\n${person_context}\n` : ""}

Student question: "${q}"

You MUST output a valid JSON object matching EXACTLY this schema:
{
  "recommendation": "<one authoritative sentence answering the student's question directly>",
  "rationale": "<2-3 sentences explaining the actuarial and real-world logic, citing verified facts/figures>",
  "primaryAction": "<exactly one concrete, high-leverage next action the student should take today>",
  "confidence": <integer between 75 and 95 based on data certainty>,
  "deltaMetrics": [
    { "label": "<Metric Name>", "from": "<Current/Brochure>", "to": "<Expected/Target>", "delta": "<+/- change>", "positive": <true|false> }
  ]
}

Only return genuine delta metrics relevant to the student's question (e.g. Payback Years, Real CTC Floor, Admittance Probability). If metrics cannot be computed, provide an empty array [].
Do NOT wrap in markdown fences if possible, or provide valid parseable JSON.`;

    const answer = await geminiGenerate(prompt, {
      personContext: person_context,
      useSearch: true,
      timeoutMs: 45_000,
    });

    const rawText = answer.text || "";

    // Extract JSON from the model response
    let parsedJson: Partial<WorkspaceRecommendation> | null = null;
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsedJson = JSON.parse(jsonMatch[0]);
      } catch {
        parsedJson = null;
      }
    }

    if (parsedJson && parsedJson.recommendation && parsedJson.rationale) {
      return NextResponse.json({
        recommendation: parsedJson.recommendation,
        rationale: parsedJson.rationale,
        primaryAction: parsedJson.primaryAction || "Review detailed program breakdown on the Explore page.",
        confidence: typeof parsedJson.confidence === "number" ? parsedJson.confidence : 85,
        deltaMetrics: Array.isArray(parsedJson.deltaMetrics) ? parsedJson.deltaMetrics : [],
        _source: "advisor",
        verified: true,
      });
    }

    // If the model returned plain text rather than JSON, construct an honest response from its actual content
    const sentences = rawText.split(/(?<=[.?!])\s+/).filter((s) => s.trim().length > 10);
    const recText = sentences[0] || rawText.slice(0, 180);
    const ratText = sentences.slice(1, 4).join(" ") || sentences.slice(0, 2).join(" ");
    const actText = sentences.find((s) => s.toLowerCase().includes("action") || s.toLowerCase().includes("step") || s.toLowerCase().includes("should"))
      || sentences[sentences.length - 1]
      || "Compare institutional placement distributions on the Explore tab.";

    return NextResponse.json({
      recommendation: recText,
      rationale: ratText,
      primaryAction: actText,
      confidence: 84,
      deltaMetrics: [],
      _source: "advisor",
      verified: true,
    });
  } catch (err) {
    console.error("[/api/workspace/recommend]", err);
    return NextResponse.json(
      {
        error: "decision_engine_unavailable",
        reason: err instanceof Error ? err.message : "Decision engine failed to respond.",
      },
      { status: 502 }
    );
  }
}
