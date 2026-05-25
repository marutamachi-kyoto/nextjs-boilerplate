import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const BASE_URL = "https://poikatu-ai.vercel.app";

type SitemapEntry = MetadataRoute.Sitemap[number];

type RankingItem = {
  offer_name?: string | null;
  trend_keyword?: string | null;
  category?: string | null;
  updated_at?: string | null;
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key);
}

function getOfferName(item: RankingItem) {
  return item.offer_name || item.trend_keyword || item.category || "";
}

function getValidDate(dateText?: string | null) {
  if (!dateText) return new Date();

  const date = new Date(dateText);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function getStaticPages(now: Date): SitemapEntry[] {
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
  ];
}

async function getRankingPages(): Promise<SitemapEntry[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("rankings")
      .select("offer_name, trend_keyword, category, updated_at")
      .order("rank", { ascending: true })
      .limit(50);

    if (error || !Array.isArray(data)) return [];

    return (data as RankingItem[])
      .map((item) => {
        const offerName = getOfferName(item).trim();
        if (!offerName) return null;

        return {
          url: `${BASE_URL}/reviews/${encodeURIComponent(offerName)}`,
          lastModified: getValidDate(item.updated_at),
          changeFrequency: "daily" as const,
          priority: 0.7,
        };
      })
      .filter((item): item is SitemapEntry => Boolean(item));
  } catch (error) {
    console.error("sitemap ranking fetch failed", error);
    return [];
  }
}

function uniquePages(pages: SitemapEntry[]) {
  const seen = new Set<string>();

  return pages.filter((page) => {
    if (seen.has(page.url)) return false;
    seen.add(page.url);
    return true;
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages = getStaticPages(now);
  const rankingPages = await getRankingPages();

  return uniquePages([...staticPages, ...rankingPages]);
}
