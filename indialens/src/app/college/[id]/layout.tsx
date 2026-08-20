import { Metadata } from "next";
import { fetchCollegeById } from "../../../lib/live-colleges";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const found = await fetchCollegeById(params.id);
  if (!found) return { title: "Program Not Found" };

  const record = found.record;
  return {
    title: `${record.college.name} - ${record.degree.name}`,
    description: `ROI score ${record.roi.compositeScore}/100. Median salary ₹${(((record.salary?.year1?.p50 ?? record.placement?.medianSalaryInr) ?? 0) / 100000).toFixed(1)}L at graduation.`,
    openGraph: {
      images: [{
        url: `/api/og/college/${params.id}?college=${encodeURIComponent(record.college.name)}&degree=${encodeURIComponent(record.degree.name)}&score=${record.roi.compositeScore}`,
        width: 1200,
        height: 630,
      }],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
