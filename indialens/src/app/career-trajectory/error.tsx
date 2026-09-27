"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-16">
      <div className="mx-auto max-w-lg rounded-2xl border border-rose-200 bg-white p-6">
        <h1 className="text-lg font-semibold text-slate-950">The career projection could not be shown</h1>
        <p className="mt-2 text-sm text-slate-600">
          This page does not substitute a sample career for a failed one.
        </p>
        {error.digest && <p className="mt-3 font-mono text-xs text-slate-400">ref {error.digest}</p>}
        <button onClick={() => reset()} className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Retry
        </button>
      </div>
    </div>
  );
}
