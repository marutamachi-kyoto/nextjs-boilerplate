import type { MetadataRoute } from "next";

const BASE_URL = "https://poikatu-ai.vercel.app";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/about-poikatsu`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/reviews/${encodeURIComponent("楽天カード")}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];
}
