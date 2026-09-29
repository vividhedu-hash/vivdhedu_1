import { MetadataRoute } from "next";
import { fetchCollegeList } from "../lib/live-colleges";
import { APP_URL } from "@/lib/brand";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = APP_URL;
  const listed = await fetchCollegeList({ per_page: 100, sort_by: "compositeScore" });

  const staticRoutes: MetadataRoute.Sitemap = [    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/explore`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/admissions`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/analyze`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/psychometric`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/global`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${baseUrl}/portfolio-builder`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${baseUrl}/marketplace`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/advisor`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/career-trajectory`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/job-security`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/compare`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/methodology`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    // ── Commercial surface ─────────────────────────────────────────
    // /pricing is the conversion destination for every marketing push, so it
    // sits just below the product pages. The trust pages are indexed
    // deliberately: a privacy policy and a published methodology are what make
    // the pricing page credible, and search engines weigh them accordingly.
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/cookies`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
  ];

  // Only real index rows may appear in a sitemap.
  //
  // A sitemap is an instruction to a crawler: "fetch these, and treat them as
  // the site's real pages." Emitting one URL per `MOCK_DATA` row meant an
  // outage produced 73 URLs for programme detail pages that do not exist in
  // the catalogue — and each would then render either a 404 or, worse, a
  // detail page full of seed figures. With the guard in place an unreachable
  // index yields no college routes at all, and the static routes below are
  // still served, so the sitemap stays valid rather than becoming an error.
  //
  // The `database` test rather than a `!== "unavailable"` test is deliberate:
  // it excludes mock rows in every mode, so a production deploy with mocks
  // accidentally enabled still cannot publish seed URLs.
  const collegeRoutes: MetadataRoute.Sitemap =
    listed.source === "database"
      ? listed.data.map((record) => ({
          url: `${baseUrl}/college/${record.id}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }))
      : [];

  return [...staticRoutes, ...collegeRoutes];
}
