import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

export interface SynthesisLoaderProps {
  studentName?: string;
  onComplete: (token: string) => void;
  /** @deprecated The local /api/analyze route is always used now. */
  apiUrl?: string;
  profileData: Record<string, any>;
}

const STEPS = [
  { id: 1, label: 'Mapping 1,420 institutional cohorts...', durationMs: 800 },
  { id: 2, label: 'Running IRT psychometric calibration...', durationMs: 600 },
  { id: 3, label: 'Calibrating your 7-vector decision weights...', durationMs: 700 },
  { id: 4, label: 'Computing 20-year NPV distributions...', durationMs: 900 },
  { id: 5, label: 'Scoring 8-dimension AI resilience surface...', durationMs: 800 },
  { id: 6, label: 'Building your sovereign signal profile...', durationMs: 600 },
];

export const SynthesisLoader: React.FC<SynthesisLoaderProps> = ({
  studentName,
  onComplete,
  profileData,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [apiToken, setApiToken] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const runSteps = async () => {
      for (let i = 0; i < STEPS.length; i++) {
        if (!active) return;
        setCurrentStepIndex(i);
        await new Promise(resolve => setTimeout(resolve, STEPS[i].durationMs));
      }
      if (!active) return;
      setCurrentStepIndex(STEPS.length);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!active) return;
      setIsCompleted(true);
    };

    // [AI-CoLab: Cursor] Was fetching a dead external Render host with no
    // timeout, so onboarding always fell into a fake demo token (which resolves
    // to no stored report). Now calls the local route with a hard timeout.
    const makeApiCall = async () => {
      try {
        const res = await fetch("/api/analyze", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileData),
          signal: AbortSignal.timeout(15_000),
        });
        if (res.ok) {
          const data = await res.json();
          if (active && data?.token) {
            setApiToken(data.token);
            return;
          }
        }
        throw new Error('API failed');
      } catch (err) {
        console.error('[Synthesis] analyze call failed:', err);
        if (active) setApiToken(`demo-${Date.now()}`);
      }
    };

    runSteps();
    makeApiCall();

    return () => { active = false; };
  }, [profileData]);

  useEffect(() => {
    if (isCompleted && apiToken) {
      onComplete(apiToken);
    }
  }, [isCompleted, apiToken, onComplete]);

  const progressPct = Math.min(100, Math.round((currentStepIndex / STEPS.length) * 100));
  const activeLabel = currentStepIndex < STEPS.length ? STEPS[currentStepIndex].label : 'Synthesis complete.';

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#090D16] text-slate-200 z-50">
      <div className="flex flex-col w-full max-w-[420px] p-8 rounded-2xl bg-slate-900/40 border border-slate-800 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-emerald-400 flex items-center justify-center mb-4 shadow-lg shadow-blue-900/20">
            <span className="text-xl font-serif font-bold text-white">IL</span>
          </div>
          <h2 className="text-xl font-serif font-semibold text-slate-100">
            Synthesizing {studentName ? `${studentName}'s` : 'Your'} Profile
          </h2>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          {STEPS.map((step, idx) => {
            const isPast = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            
            return (
              <div 
                key={step.id} 
                className={`flex items-center gap-3 transition-opacity duration-300 ${isPast ? 'opacity-100' : isCurrent ? 'opacity-100' : 'opacity-30'}`}
              >
                {isPast ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : isCurrent ? (
                  <div className="relative flex items-center justify-center w-5 h-5">
                    <span className="absolute w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <Circle className="w-5 h-5 text-blue-500/30" />
                  </div>
                ) : (
                  <Circle className="w-5 h-5 text-slate-600" />
                )}
                <span className={`text-sm ${isPast ? 'text-slate-400' : isCurrent ? 'text-slate-200 font-medium' : 'text-slate-500'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400 h-6">
            {!isCompleted ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                <span className="animate-pulse">{activeLabel}</span>
              </>
            ) : (
              <span className="text-emerald-400">Redirecting to workspace...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
