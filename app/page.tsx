import type { Metadata } from "next";
import Script from "next/script";
import { createClient } from "@supabase/supabase-js";
import ClientAdjustments from "./client-adjustments";
import RankingBannerImages from "./ranking-banner-images";
import RankingRelatedReasons from "./ranking-related-reasons";
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
  title: "ポイ活おすすめランキング｜モッピー案件をAI判定【毎日更新】",
  description:
    "Google検索で注目されているポイ活関連ワードをもとに、モッピーで確認できる案件や無料ポイ活案件をAIが毎日ランキング化します。",
  keywords: [
    "ポイ活",
    "ポイ活 おすすめ",
    "ポイ活 ランキング",
    "無料ポイ活",
    "モッピー",
    "ポイントサイト",
    "ポイ活 案件",
    "Google検索",
  ],
  alternates: { canonical: BASE_URL },
  openGraph: {
    title: "ポイ活おすすめランキング｜モッピー案件をAI判定【毎日更新】",
    description:
      "Google検索で注目されているポイ活関連ワードをもとに、モッピーで確認できる案件や無料ポイ活案件をAIが毎日ランキング化します。",
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
    title: "ポイ活おすすめランキング｜モッピー案件をAI判定【毎日更新】",
    description:
      "Google検索で注目されているポイ活関連ワードをもとに、モッピーで確認できる案件や無料ポイ活案件をAIが毎日ランキング化します。",
    images: ["/hero.png.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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

const TREND_TARGET_RULES = [
  { wordKeys: ["sbi", "nisa"], targetKeys: ["sbi"] },
  { wordKeys: ["amazon"], targetKeys: ["amazon"] },
  { wordKeys: ["u-next", "unext"], targetKeys: ["u-next", "unext"] },
  { wordKeys: ["paypay", "aupay", "au"], targetKeys: ["paypay", "aupay", "au"] },
  { wordKeys: ["moppy", "\u30e2\u30c3\u30d4\u30fc"], targetKeys: ["moppy", "\u30e2\u30c3\u30d4\u30fc"] },
  { wordKeys: ["mercari", "\u30e1\u30eb\u30ab\u30ea", "\u30e1\u30eb\u30ab\u30fc\u30c9"], targetKeys: ["mercari", "\u30e1\u30eb\u30ab\u30ea", "\u30e1\u30eb\u30ab\u30fc\u30c9"] },
  { wordKeys: ["wifi", "wimax"], targetKeys: ["wifi", "wimax"] },
  { wordKeys: ["fx"], targetKeys: ["fx"] },
  { wordKeys: ["jcb"], targetKeys: ["jcb"] },
  { wordKeys: ["dmm"], targetKeys: ["dmm"] },
  { wordKeys: ["rakuten", "\u697d\u5929"], targetKeys: ["rakuten", "\u697d\u5929"] },
  { wordKeys: ["olive"], targetKeys: ["olive"] },
  { wordKeys: ["ahamo"], targetKeys: ["ahamo"] },
  { wordKeys: ["povo"], targetKeys: ["povo"] },
  { wordKeys: ["chocozap"], targetKeys: ["chocozap"] },
];

function findRuleTarget(word: string, rankings: DisplayRankingItem[]) {
  const trendKey = normalizeKey(word);
  const matchedRule = TREND_TARGET_RULES.find((rule) =>
    rule.wordKeys.some((key) => trendKey.includes(normalizeKey(key)))
  );

  if (!matchedRule) return null;

  return (
    rankings.find((item) => {
      const terms = getMatchTerms(item);
      return matchedRule.targetKeys.some((key) => {
        const targetKey = normalizeKey(key);
        return terms.some((term) => term.includes(targetKey));
      });
    }) || null
  );
}

function findTrendTarget(word: string, rankings: DisplayRankingItem[]) {
  const trendKey = normalizeKey(word);
  if (trendKey.length < 2) return null;

  const directMatch =
    rankings.find((item) =>
      getMatchTerms(item).some((term) => {
        return trendKey.includes(term) || term.includes(trendKey);
      })
    ) || null;

  return directMatch || findRuleTarget(word, rankings);
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

async function getTrendItems(_rankings: DisplayRankingItem[]) {
  try {
    const response = await fetch(`${BASE_URL}/api/trends`, {
      cache: "no-store",
    });

    if (!response.ok) return [];

    const json = await response.json();
    if (!Array.isArray(json.data)) return [];

    return json.data.slice(0, 50) as TrendItem[];
  } catch (error) {
    console.error(error);
    return [];
  }
}

function buildStructuredData(rankings: DisplayRankingItem[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      name: "ポイ活AI判定",
      url: BASE_URL,
      inLanguage: "ja-JP",
      potentialAction: {
        "@type": "SearchAction",
        target: `${BASE_URL}/reviews/{search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "ポイ活AI判定",
      url: BASE_URL,
      logo: `${BASE_URL}/favicon.png`,
    },
    {
      "@type": "WebPage",
      "@id": `${BASE_URL}/#webpage`,
      url: BASE_URL,
      name: "ポイ活おすすめランキング",
      description:
        "Google検索で注目されているポイ活関連ワードをもとに、モッピーで確認できる案件や無料ポイ活案件をAIが毎日ランキング化します。",
      isPartOf: {
        "@id": `${BASE_URL}/#website`,
      },
      about: ["ポイ活", "モッピー", "ポイントサイト", "無料ポイ活"],
      inLanguage: "ja-JP",
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${BASE_URL}/#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "ポイ活AI判定",
          item: BASE_URL,
        },
      ],
    },
    {
      "@type": "ItemList",
      "@id": `${BASE_URL}/#ranking-itemlist`,
      name: "ポイ活おすすめランキング",
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      numberOfItems: rankings.length,
      itemListElement: rankings.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.offer_name || item.trend_keyword || item.category,
        url: `${BASE_URL}/reviews/${encodeURIComponent(
          item.offer_name || item.trend_keyword || item.category
        )}`,
      })),
    },
    ],
  };
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
      <RankingRelatedReasons />
      <RankingBannerImages />
    </>
  );
}
