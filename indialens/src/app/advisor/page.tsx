import { AIModeStudio } from "@/components/AIModeStudio";

export const metadata = {
  title: "AI Mode",
  description:
    "Gemini 3.7 Flash with Google Search grounding — cited answers, personal intelligence, and an academic path map.",
};

export default function AdvisorPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Student-priced ROI · live web evidence
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ask with sources. Map the path.
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            Same mechanism as Google AI Mode: Gemini 3.7 Flash runs Google Search, then we show the citations.
            No invented ranks or packages. Catalog IDs only attach when the program is in Postgres.
          </p>
        </header>
        <AIModeStudio initialToken={searchParams.token} />
      </div>
    </div>
  );
}
