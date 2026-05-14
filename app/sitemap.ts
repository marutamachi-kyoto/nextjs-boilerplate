import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://poikatu-ai.vercel.app";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RankingItem = {
  offer_name?: string | null;
  trend_keyword?: string | null;
  category?: string | null;
  updated_at?: string | null;
  rank?: number | null;
};

const getOfferName = (item: RankingItem) => {
  return item.offer_name || item.trend_keyword || item.category || "";
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/about-poikatsu`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  const { data, error } = await supabase
    .from("rankings")
    .select("offer_name, trend_keyword, category, updated_at, rank")
    .order("rank", { ascending: true })
    .limit(50);

  if (error || !data) {
    return staticPages;
  }

  const seen = new Set<string>();

  const reviewPages: MetadataRoute.Sitemap = data.flatMap((item) => {
    const offerName = getOfferName(item);

    if (!offerName) {
      return [];
    }

    const url = `${BASE_URL}/reviews/${encodeURIComponent(offerName)}`;

    if (seen.has(url)) {
      return [];
    }

    seen.add(url);

    return [
      {
        url,
        lastModified: item.updated_at ? new Date(item.updated_at) : new Date(),
        changeFrequency: "daily" as const,
        priority: 0.7,
      },
    ];
  });

  return [...staticPages, ...reviewPages];
}
