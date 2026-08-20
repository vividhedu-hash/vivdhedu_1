import { MetadataRoute } from "next";
import { fetchCollegeList } from "../lib/live-colleges";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listed = await fetchCollegeList({ per_page: 100, sort_by: "compositeScore" });

  const routes: MetadataRoute.Sitemap = [
    { url: "https://indialens.in", lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: "https://indialens.in/explore", lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: "https://indialens.in/compare", lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: "https://indialens.in/methodology", lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: "https://indialens.in/analyze", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  ];

  const collegeRoutes = listed.data.map((record) => ({
    url: `https://indialens.in/college/${record.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...routes, ...collegeRoutes];
}
