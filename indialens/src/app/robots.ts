import { MetadataRoute } from "next";
import { APP_URL } from "@/lib/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /admin is a back-office surface with no marketing value. It is not
        // a security control — it is already gated server-side by an API key
        // check — but there is no reason to have it in a search index.
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
