"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardWizard, type WizardData } from "@/components/OnboardWizard";
import { SynthesisLoader } from "@/components/SynthesisLoader";
import { BaselineDiagnosticReport } from "@/components/BaselineDiagnosticReport";
import { useAuth } from "@/lib/auth-context";
import {
  clearLocalProfile,
  linkReportToAccount,
  readLocalProfile,
  saveProfile,
  writeLocalProfile,
  type StoredStudentProfile,
} from "@/lib/profile-store";

export const dynamic = "force-dynamic";

type Phase = "wizard" | "synthesis" | "baseline";

/**
 * What the student is told after onboarding, and nothing more.
 *
 * The previous version of this page had no persistence at all: `wizardData`
 * lived in React state, was posted to `/api/analyze` (which stored it against
 * a bearer token in a table anon can read), and was then dropped on navigation.
 * A returning student got a blank wizard and a workspace with no memory of
 * them. So the name they were asked for went nowhere.
 *
 * The fix is deliberately split in two:
 *
 *   1. THE NAME goes to `users`, scoped to the account by
 *      `auth.uid()`. That is the only place a name belongs.
 *   2. THE REPORT TOKEN goes to `user_saved_reports`, so returning to the
 *      workspace lands on their own report instead of an empty screen.
 *
 * The full answer set (stage, goals, weights, budget) is NOT written to a new
 * table. It is saved as a per-user local draft, because nothing in the schema
 * has a home for "career outcomes: 70" and inventing one here would duplicate
 * the `student_profiles` work the backend already owns. The report token is the
 * durable record of the analysis itself, and it is already linked to the
 * account.
 *
 * Example profiles are never persisted. `OnboardWizard` keeps `isExample` in
 * its own state and does not pass it down, so the signal has to travel out of
 * band — via `data.fullName` matching the example's placeholder, which is
 * cheap and unambiguous here, and is additionally refused below.
 */
const EXAMPLE_NAME = "Sample Student";

export default function OnboardPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  const [phase, setPhase] = useState<Phase>("wizard");
  const [wizardData, setWizardData] = useState<WizardData | null>(null);
  const [reportToken, setReportToken] = useState<string>("");
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const isExampleProfile = (data: WizardData) => data.fullName.trim() === EXAMPLE_NAME;

  const handleWizardComplete = (data: WizardData) => {
    setWizardData(data);
    setPhase("synthesis");

    // Persist the name and the local draft immediately, rather than waiting
    // for the report token that only arrives after synthesis. If the student
    // navigates away mid-synthesis they should still have their own name on
    // their account.
    if (user && token && !isExampleProfile(data)) {
      void saveProfile({
        accessToken: token,
        userId: user.id,
        email: user.email,
        fullName: data.fullName,
      });
      writeLocalProfile(user.id, data as unknown as Partial<StoredStudentProfile>);
    }
  };

  const handleSynthesisComplete = useCallback(
    (tokenFromAnalysis: string) => {
      const resolved = tokenFromAnalysis || `session-${Date.now()}`;
      setReportToken(resolved);
      setPhase("baseline");

      // Link the finished report to the account so a return visit opens their
      // own work. Reported separately from the name, because they are two
      // different writes against two different policies and one can succeed
      // while the other does not.
      if (!user || !token || !wizardData) return;

      if (isExampleProfile(wizardData)) {
        setSaveNotice(
          "That was an example profile, so nothing was saved to your account.",
        );
        return;
      }

      void (async () => {
        const [nameResult, linked] = await Promise.all([
          saveProfile({
            accessToken: token,
            userId: user.id,
            email: user.email,
            fullName: wizardData.fullName,
          }),
          linkReportToAccount({
            accessToken: token,
            userId: user.id,
            reportToken: resolved,
            title: `${wizardData.fullName.trim()} — degree ROI`,
          }),
        ]);

        if (!nameResult.ok) {
          setSaveNotice(
            `Your profile could not be saved: ${nameResult.reason} Your report still works from the link below.`,
          );
        } else if (!linked) {
          setSaveNotice(
            "Your name is saved. This report could not be linked to your account, so open it from the link below.",
          );
        } else {
          writeLocalProfile(user.id, wizardData as unknown as Partial<StoredStudentProfile>);
          setSaveNotice(null);
        }
      })();
    },
    [user, token, wizardData],
  );

  const handleEnterWorkspace = () => {
    router.push(reportToken ? `/workspace?token=${reportToken}` : "/workspace");
  };

  // A returning student should arrive with their own answers already in the
  // wizard. `OnboardWizard` reads the local draft itself; this only exists to
  // clear a draft that has been superseded by a completed save, so a later
  // visit does not resurrect stale answers on top of the account's real name.
  useEffect(() => {
    if (phase !== "baseline" || !user) return;
    if (saveNotice) return;
    const draft = readLocalProfile(user.id);
    if (draft && typeof draft.fullName === "string" && !draft.fullName.trim()) {
      clearLocalProfile(user.id);
    }
  }, [phase, user, saveNotice]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <span className="font-mono text-xs text-ink-2">Loading your profile…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col transition-colors duration-300">
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
            saveNotice={saveNotice}
          />
        </div>
      )}
    </div>
  );
}
