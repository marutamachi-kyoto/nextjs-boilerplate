import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const BASE_URL = "https://poikatu-ai.vercel.app";

type RankingItem = {
  offer_name?: string;
  trend_keyword: string;
  category: string;
  updated_at?: string;
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getOfferName(item: RankingItem) {
  return item.offer_name || item.trend_keyword || item.category;
}

async function getRankingPages() {
  const { data } = await getSupabase()
    .from("rankings")
    .select("offer_name, trend_keyword, category, updated_at")
    .order("rank", { ascending: true })
    .limit(50);

  if (!Array.isArray(data)) return [];

  return (data as RankingItem[]).map((item) => ({
    url: `${BASE_URL}/reviews/${encodeURIComponent(getOfferName(item))}`,
    lastModified: item.updated_at ? new Date(item.updated_at) : new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rankingPages = await getRankingPages();
  const now = new Date();

  return [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/free-poikatsu`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about-poikatsu`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...rankingPages,
  ];
}
