export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 h-9 w-2/3 max-w-lg animate-pulse rounded bg-slate-200" />
        <p className="mt-10 text-sm text-slate-500">Loading admissions…</p>
      </div>
    </div>
  );
}
