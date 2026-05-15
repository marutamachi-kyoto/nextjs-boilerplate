import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_URL = "https://poikatu-ai.vercel.app";

type RankingItem = {
  offer_name?: string | null;
  trend_keyword?: string | null;
  category?: string | null;
  updated_at?: string | null;
  rank?: number | null;
};

const getStaticPages = (): MetadataRoute.Sitemap => {
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
  ];
};

const getOfferName = (item: RankingItem) => {
  return (item.offer_name || item.trend_keyword || item.category || "")
    .replace(/\s+/g, " ")
    .trim();
};

const getSafeDate = (dateText?: string | null) => {
  if (!dateText) {
    return new Date();
  }

  const date = new Date(dateText);

  if (Number.isNaN(date.getTime())) {
    return new Date();
  }

  return date;
};

async function getRankingItems(): Promise<RankingItem[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return [];
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase
      .from("rankings")
      .select("offer_name, trend_keyword, category, updated_at, rank")
      .order("rank", { ascending: true })
      .limit(50);

    if (error || !data) {
      return [];
    }

    return data;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = getStaticPages();
  const data = await getRankingItems();

  if (data.length === 0) {
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
        lastModified: getSafeDate(item.updated_at),
        changeFrequency: "daily" as const,
        priority: 0.7,
      },
    ];
  });

  return [...staticPages, ...reviewPages];
}
