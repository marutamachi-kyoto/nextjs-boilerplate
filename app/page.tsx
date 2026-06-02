import type { Metadata } from "next";
import Script from "next/script";
import { createClient } from "@supabase/supabase-js";
import ClientAdjustments from "./client-adjustments";
import RankingBannerImages from "./ranking-banner-images";
import TopPageClient from "./top-page-client";
import TrendKeywordJumps from "./trend-keyword-jumps";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_URL = "https://poikatu-ai.vercel.app";
const BACKFILL_KEYWORD = "モッピー確認済み案件";

type RankingItem = {
  category?: string | null;
  rank?: number | null;
  trend_keyword?: string | null;
  offer_name?: string | null;
  reward?: number | null;
  reason?: string | null;
  image_url?: string | null;
  primary_site_name?: string | null;
  primary_site_url?: string | null;
  secondary_site_name?: string | null;
  secondary_site_url?: string | null;
  updated_at?: string | null;
};

type DisplayRankingItem = {
  category: string;
  rank: number;
  trend_keyword: string;
  offer_name?: string;
  reward?: number | null;
  reason?: string;
  image_url?: string;
  primary_site_name?: string;
  primary_site_url?: string;
  secondary_site_name?: string;
  secondary_site_url?: string;
  updated_at?: string;
};

type TrendItem = {
  word: string;
  score: number;
  category?: string;
  target_offer_name?: string;
};

export const metadata: Metadata = {
  title: "ポイ活おすすめランキング｜モッピー案件をAI判定",
  description:
    "Google検索やトレンドで注目されているポイ活関連ワードをもとに、モッピーで確認できる案件をAIが毎日ランキング化します。",
  alternates: { canonical: BASE_URL },
  openGraph: {
    title: "ポイ活おすすめランキング｜モッピー案件をAI判定",
    description:
      "Google検索やトレンドで注目されているポイ活関連ワードをもとに、モッピーで確認できる案件をAIが毎日ランキング化します。",
    url: BASE_URL,
    siteName: "ポイ活AI判定",
    type: "website",
    locale: "ja_JP",
    images: [
      {
        url: "/hero.png.png",
        width: 1200,
        height: 630,
        alt: "ポイ活AI判定",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ポイ活おすすめランキング｜モッピー案件をAI判定",
    description:
      "Google検索やトレンドで注目されているポイ活関連ワードをもとに、モッピーで確認できる案件をAIが毎日ランキング化します。",
    images: ["/hero.png.png"],
  },
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function normalizeSpaces(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeKey(value: string) {
  return normalizeSpaces(value)
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[・･]/g, "")
    .replace(/[ーｰ−]/g, "-")
    .trim();
}

function getMatchTerms(item: DisplayRankingItem) {
  const text = [
    item.offer_name,
    item.trend_keyword,
    item.category,
    item.primary_site_name,
  ]
    .filter(Boolean)
    .join(" ");

  const cleaned = normalizeSpaces(
    text
      .replace(/【[^】]*】/g, " ")
      .replace(/\[[^\]]*\]/g, " ")
      .replace(/（[^）]*）/g, " ")
      .replace(/\([^)]*\)/g, " ")
      .replace(/[「」『』]/g, " ")
  );

  return Array.from(
    new Set(
      [
        item.offer_name,
        item.trend_keyword,
        item.category,
        cleaned,
        ...cleaned.split(/[|｜／/、。!！?？\s]+/),
      ]
        .map((value) => normalizeKey(value || ""))
        .filter((value) => value.length >= 2)
    )
  );
}

function findTrendTarget(word: string, rankings: DisplayRankingItem[]) {
  const trendKey = normalizeKey(word);
  if (trendKey.length < 2) return null;

  return (
    rankings.find((item) =>
      getMatchTerms(item).some((term) => {
        return trendKey.includes(term) || term.includes(trendKey);
      })
    ) || null
  );
}

function getOfferName(item: RankingItem) {
  return (
    item.offer_name ||
    item.trend_keyword ||
    item.category ||
    `おすすめ案件 ${item.rank || ""}`
  ).trim();
}

function toDisplayKeyword(item: RankingItem, offerName: string) {
  const trendKeyword = (item.trend_keyword || "").trim();
  if (!trendKeyword || trendKeyword === BACKFILL_KEYWORD) return offerName;
  return normalizeSpaces(trendKeyword);
}

function getReason(_item: RankingItem, _offerName: string, keyword: string) {
  return `Googleの検索で「${keyword}」も一緒に調べられています。`;
}

function formatUpdatedAt(items: DisplayRankingItem[]) {
  const latestUpdatedAt = items
    .map((item) => item.updated_at)
    .filter(Boolean)
    .sort()
    .reverse()[0];

  if (!latestUpdatedAt) return "-";

  return new Date(latestUpdatedAt).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRankingItem(item: RankingItem, index: number): DisplayRankingItem {
  const offerName = getOfferName(item);
  const keyword = toDisplayKeyword(item, offerName);

  return {
    category: keyword,
    rank: item.rank || index + 1,
    trend_keyword: keyword,
    offer_name: offerName,
    reward: item.reward || 0,
    reason: getReason(item, offerName, keyword),
    image_url: item.image_url || undefined,
    primary_site_name: item.primary_site_name || "モッピー",
    primary_site_url: item.primary_site_url || undefined,
    secondary_site_name: item.secondary_site_name || undefined,
    secondary_site_url: item.secondary_site_url || undefined,
    updated_at: item.updated_at || undefined,
  };
}

async function getRankings() {
  const { data, error } = await getSupabase()
    .from("rankings")
    .select("*")
    .order("rank", { ascending: true })
    .limit(50);

  if (error || !Array.isArray(data)) {
    if (error) console.error(error);
    return [];
  }

  return (data as RankingItem[]).map(formatRankingItem);
}

async function getTrendItems(rankings: DisplayRankingItem[]) {
  const seen = new Set<string>();

  const { data, error } = await getSupabase()
    .from("trends")
    .select("word, score, category")
    .order("score", { ascending: false })
    .limit(100);

  if (error || !Array.isArray(data)) {
    if (error) console.error(error);
    return [];
  }

  return data
    .map((item) => {
      const word = normalizeSpaces(String(item.word || ""));
      const target = findTrendTarget(word, rankings);

      return {
        word,
        score: Number(item.score || 0),
        category: String(item.category || "Googleトレンド由来"),
        target_offer_name: target?.offer_name,
      };
    })
    .filter((item) => item.target_offer_name)
    .filter((item) => item.word && normalizeKey(item.word).length >= 2)
    .filter((item) => {
      const key = normalizeKey(item.word);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 50) as TrendItem[];
}

function buildStructuredData(rankings: DisplayRankingItem[]) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "ポイ活AI判定",
      url: BASE_URL,
      inLanguage: "ja-JP",
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "ポイ活おすすめランキング",
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      numberOfItems: rankings.length,
      itemListElement: rankings.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.offer_name || item.trend_keyword || item.category,
      })),
    },
  ];
}

export default async function Page() {
  const rankings = await getRankings();
  const trendItems = await getTrendItems(rankings);
  const updatedAt = formatUpdatedAt(rankings);
  const structuredData = buildStructuredData(rankings);

  return (
    <>
      <Script
        id="top-seo-structured-data"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ClientAdjustments />
      <TopPageClient
        initialItems={rankings}
        initialTrendTags={trendItems}
        initialUpdatedAt={updatedAt}
      />
      <TrendKeywordJumps />
      <RankingBannerImages />
    </>
  );
}
