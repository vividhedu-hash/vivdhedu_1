import { Metadata } from "next";
import { fetchCollegeById } from "../../../lib/live-colleges";
import { finiteOrNull } from "../../../lib/mock-data";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const found = await fetchCollegeById(params.id);

  // `!found.record` covers two distinct situations — a real 404, and an outage
  // where the index could not be checked — and they deliberately share this
  // fallback. Before the guard existed, an outage fell through to
  // `MOCK_DATA`, and this function then built a title, a description, and an
  // OG image URL from seed data: fabricated scores and salaries published as
  // structured metadata for a real-looking institution URL. Failing to a
  // neutral title is the correct outcome for both cases; the visible page
  // below handles the difference.
  if (!found.record) return { title: "Program Not Found" };

  const record = found.record;
  const composite = finiteOrNull(record.roi.compositeScore);
  const medianY1 =
    finiteOrNull(record.salary?.year1?.p50) ?? finiteOrNull(record.placement?.medianSalaryInr);

  // Never state a score or a salary we do not have — a wrong number in a
  // search-result snippet is the least recoverable kind of fabrication.
  const description = [
    composite != null ? `ROI score ${composite}/100.` : "ROI score not yet available.",
    medianY1 != null
      ? `Median salary ₹${(medianY1 / 100000).toFixed(1)}L at graduation.`
      : "Median salary not yet available.",
  ].join(" ");

  const ogQuery = new URLSearchParams({
    college: record.college.name,
    degree: record.degree.name,
  });
  // Only pass a score to the OG image when one exists; `score=null` would be
  // stringified into the image URL as the literal text "null".
  if (composite != null) ogQuery.set("score", String(composite));

  return {
    title: `${record.college.name} - ${record.degree.name}`,
    description,
    openGraph: {
      images: [{
        url: `/api/og/college/${params.id}?${ogQuery.toString()}`,
        width: 1200,
        height: 630,
      }],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}