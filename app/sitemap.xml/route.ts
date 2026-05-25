import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_URL = "https://poikatu-ai.vercel.app";
const SITEMAP_TIMEOUT_MS = 4000;

type RankingItem = {
  offer_name?: string | null;
  trend_keyword?: string | null;
  category?: string | null;
  updated_at?: string | null;
};

type SitemapPage = {
  url: string;
  lastModified: Date;
  changeFrequency: "daily" | "weekly" | "monthly";
  priority: number;
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

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getStaticPages(now: Date): SitemapPage[] {
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

async function getRankingPages(): Promise<SitemapPage[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const rankingPromise = supabase
      .from("rankings")
      .select("offer_name, trend_keyword, category, updated_at")
      .order("rank", { ascending: true })
      .limit(50);

    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), SITEMAP_TIMEOUT_MS);
    });

    const result = await Promise.race([rankingPromise, timeoutPromise]);
    if (!result || result.error || !Array.isArray(result.data)) return [];

    return (result.data as RankingItem[]).reduce<SitemapPage[]>((pages, item) => {
      const offerName = getOfferName(item).trim();
      if (!offerName) return pages;

      pages.push({
        url: `${BASE_URL}/reviews/${encodeURIComponent(offerName)}`,
        lastModified: getValidDate(item.updated_at),
        changeFrequency: "daily",
        priority: 0.7,
      });

      return pages;
    }, []);
  } catch (error) {
    console.error("sitemap ranking fetch failed", error);
    return [];
  }
}

function uniquePages(pages: SitemapPage[]) {
  const seen = new Set<string>();

  return pages.filter((page) => {
    if (seen.has(page.url)) return false;
    seen.add(page.url);
    return true;
  });
}

function renderSitemapXml(pages: SitemapPage[]) {
  const urls = pages
    .map((page) => {
      return [
        "  <url>",
        `    <loc>${escapeXml(page.url)}</loc>`,
        `    <lastmod>${page.lastModified.toISOString()}</lastmod>`,
        `    <changefreq>${page.changeFrequency}</changefreq>`,
        `    <priority>${page.priority.toFixed(1)}</priority>`,
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export async function GET() {
  const now = new Date();
  const pages = uniquePages([
    ...getStaticPages(now),
    ...(await getRankingPages()),
  ]);

  return new Response(renderSitemapXml(pages), {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
