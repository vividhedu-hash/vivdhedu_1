"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardWizard } from "@/components/OnboardWizard";
import { SynthesisLoader } from "@/components/SynthesisLoader";
import { BaselineDiagnosticReport } from "@/components/BaselineDiagnosticReport";

export const dynamic = "force-dynamic";

type Phase = "wizard" | "synthesis" | "baseline";

export default function OnboardPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("wizard");
  const [wizardData, setWizardData] = useState<Record<string, any> | null>(null);
  const [reportToken, setReportToken] = useState<string>("demo-session");

  // [AI-CoLab: Cursor] Previously pointed at a dead external Render host, which
  // broke the entire onboarding pipeline. The local /api/analyze route handles
  // synthesis (with serverless fallback + report persistence).
  function handleWizardComplete(data: Record<string, any>) {
    setWizardData(data);
    setPhase("synthesis");
  }

  function handleSynthesisComplete(token: string) {
    setReportToken(token || `session-${Date.now()}`);
    setPhase("baseline");
  }

  function handleEnterWorkspace() {
    router.push(`/workspace?token=${reportToken}`);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "32px 16px",
      }}
    >
      {phase === "wizard" && (
        <OnboardWizard onComplete={handleWizardComplete} />
      )}

      {phase === "synthesis" && wizardData && (
        <SynthesisLoader
          studentName={wizardData.fullName}
          profileData={wizardData}
          onComplete={handleSynthesisComplete}
        />
      )}

      {phase === "baseline" && wizardData && (
        <BaselineDiagnosticReport
          token={reportToken}
          wizardData={wizardData}
          onEnterWorkspace={handleEnterWorkspace}
        />
      )}
    </div>
  );
}
