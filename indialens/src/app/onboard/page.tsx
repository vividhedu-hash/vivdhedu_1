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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col transition-colors duration-300">
      {phase === "wizard" && (
        <div className="animate-fade-slide-up w-full">
          <OnboardWizard onComplete={handleWizardComplete} />
        </div>
      )}

      {phase === "synthesis" && wizardData && (
        <div className="animate-fade-slide-up w-full">
          <SynthesisLoader
            studentName={wizardData.fullName}
            profileData={wizardData}
            onComplete={handleSynthesisComplete}
          />
        </div>
      )}

      {phase === "baseline" && wizardData && (
        <div className="animate-fade-slide-up w-full">
          <BaselineDiagnosticReport
            token={reportToken}
            wizardData={wizardData}
            onEnterWorkspace={handleEnterWorkspace}
          />
        </div>
      )}
    </div>
  );
}
