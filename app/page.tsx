import type { Metadata } from "next";
import Script from "next/script";
import { createClient } from "@supabase/supabase-js";
import TopPageClient from "./top-page-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_URL = "https://poikatu-ai.vercel.app";

type RankingItem = {
  category: string;
  rank: number;
  trend_keyword: string;
  offer_name?: string;
  reward?: number | null;
  reason?: string;
  updated_at?: string;
};

type TrendItem = {
  word: string;
  score: number;
  category?: string;
};

export const metadata: Metadata = {
  title: "ポイ活おすすめランキング｜モッピー案件をAI判定",
  description:
    "Google検索やトレンドで注目されているポイ活関連ワードをもとに、モッピーで案件ページと報酬ポイントを確認できる案件をAIが毎日ランキング化します。",
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

function getOfferName(item: RankingItem) {
  return item.offer_name || item.trend_keyword || item.category;
}

function getReviewUrl(offerName: string) {
  return `${BASE_URL}/reviews/${encodeURIComponent(offerName)}`;
}

function formatReward(reward?: number | null) {
  if (!reward || reward <= 0) return "報酬ポイント確認中";
  return `${reward.toLocaleString("ja-JP")}P`;
}

function formatUpdatedAt(items: RankingItem[]) {
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

async function getRankings() {
  const { data } = await getSupabase()
    .from("rankings")
    .select("category, rank, trend_keyword, offer_name, reward, reason, updated_at")
    .order("rank", { ascending: true })
    .limit(50);

  return Array.isArray(data) ? (data as RankingItem[]) : [];
}

async function getTrendItems() {
  const { data } = await getSupabase()
    .from("trends")
    .select("word, score, category")
    .order("score", { ascending: false })
    .limit(50);

  return Array.isArray(data) ? (data as TrendItem[]) : [];
}

function buildStructuredData(rankings: RankingItem[]) {
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
      itemListElement: rankings.map((item, index) => {
        const offerName = getOfferName(item);

        return {
          "@type": "ListItem",
          position: index + 1,
          name: offerName,
          url: getReviewUrl(offerName),
        };
      }),
    },
  ];
}

export default async function Page() {
  const [rankings, trendItems] = await Promise.all([getRankings(), getTrendItems()]);
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

      <section className="sr-only" aria-label="ポイ活おすすめランキングのSEO本文">
        <h2>ポイ活おすすめランキング</h2>
        <p>
          Google検索やトレンドで注目されているポイ活関連ワードをもとに、モッピーで案件ページと報酬ポイントを確認できる案件をAIが毎日ランキング化しています。
        </p>
        <p>最終更新: {updatedAt}</p>

        {trendItems.length > 0 && (
          <div>
            <h3>いまGoogle検索されているポイ活関連ワード</h3>
            <ul>
              {trendItems.map((item) => (
                <li key={item.word}>{item.word}</li>
              ))}
            </ul>
          </div>
        )}

        {rankings.length > 0 && (
          <ol>
            {rankings.map((item, index) => {
              const offerName = getOfferName(item);

              return (
                <li key={`${item.rank}-${offerName}-${index}`}>
                  <a href={getReviewUrl(offerName)}>{offerName}</a>
                  <span> {item.category}</span>
                  <span> {formatReward(item.reward)}</span>
                  {item.reason && <p>{item.reason}</p>}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <TopPageClient />
    </>
  );
}
