import type { Metadata } from "next";
import Script from "next/script";
import { createClient } from "@supabase/supabase-js";
import TopPageClient from "./top-page-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_URL = "https://poikatu-ai.vercel.app";
const MOPPY_OFFER_IMAGES_URL = `${BASE_URL}/api/moppy-offer-images`;
const OFFER_IMAGE_UNAVAILABLE_URL = "/offer-image-unavailable.svg";

type RankingRow = {
  category?: string | null;
  rank?: number | null;
  offer_name?: string | null;
  reward?: number | null;
  image_url?: string | null;
  primary_site_url?: string | null;
  updated_at?: string | null;
};

type DisplayRankingItem = {
  category: string;
  rank: number;
  offer_name: string;
  reward?: number | null;
  image_url?: string | null;
  primary_site_url?: string | null;
  updated_at?: string | null;
};

type MoppyOfferImage = {
  title?: string | null;
  imageUrl?: string | null;
  url?: string | null;
};

const FALLBACK_RANKINGS: DisplayRankingItem[] = [
  {
    category: "高額報酬",
    rank: 1,
    offer_name: "【超還元】SBI証券(新規総合口座開設+NISA口座開設)",
    reward: 17000,
    image_url: OFFER_IMAGE_UNAVAILABLE_URL,
    primary_site_url: "https://pc.moppy.jp/",
  },
  {
    category: "無料でできる",
    rank: 2,
    offer_name: "U-NEXT 無料トライアル",
    reward: 2500,
    image_url: OFFER_IMAGE_UNAVAILABLE_URL,
    primary_site_url: "https://pc.moppy.jp/",
  },
  {
    category: "申し込むだけでOK",
    rank: 3,
    offer_name: "povo2.0 新規契約",
    reward: 650,
    image_url: OFFER_IMAGE_UNAVAILABLE_URL,
    primary_site_url: "https://pc.moppy.jp/",
  },
];

export const metadata: Metadata = {
  title: "モッピー案件分析｜お得なモッピー案件をAIが毎日更新",
  description:
    "ポイ活サイト「モッピー」のたくさんの案件の中から「お得」な案件がわかる。AIが分析して、毎日更新しています（0:00～1:00頃）。",
  keywords: [
    "モッピー",
    "モッピー 案件",
    "モッピー お得",
    "モッピー 高額報酬",
    "ポイ活",
    "ポイ活 案件",
  ],
  alternates: { canonical: BASE_URL },
  openGraph: {
    title: "モッピー案件分析",
    description:
      "ポイ活サイト「モッピー」のたくさんの案件の中から「お得」な案件がわかる。AIが分析して、毎日更新しています。",
    url: BASE_URL,
    siteName: "モッピー案件分析",
    type: "website",
    locale: "ja_JP",
    images: [
      {
        url: "/hero.png.png",
        width: 1200,
        height: 630,
        alt: "モッピー案件分析",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "モッピー案件分析",
    description:
      "ポイ活サイト「モッピー」のたくさんの案件の中から「お得」な案件がわかる。AIが分析して、毎日更新しています。",
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

function normalizeText(text?: string | null) {
  return (text || "")
    .toLowerCase()
    .replace(/\u3000/g, "")
    .replace(/\s+/g, "")
    .replace(/[【】\[\]（）()・･ーｰ]/g, "")
    .trim();
}

function getMoppySiteId(url?: string | null) {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("site_id") || parsed.searchParams.get("s_id") || "";
  } catch {
    return "";
  }
}

function getOfferName(item: RankingRow) {
  return (
    item.offer_name ||
    item.category ||
    `モッピー案件 ${item.rank || ""}`
  ).trim();
}

function formatRankingItem(item: RankingRow, index: number): DisplayRankingItem {
  const offerName = getOfferName(item);

  return {
    category: item.category || offerName,
    rank: item.rank || index + 1,
    offer_name: offerName,
    reward: item.reward || 0,
    image_url: item.image_url || null,
    primary_site_url: item.primary_site_url || null,
    updated_at: item.updated_at || null,
  };
}

function withUnavailableImages(rankings: DisplayRankingItem[]) {
  return rankings.map((item) => ({
    ...item,
    image_url: item.image_url || OFFER_IMAGE_UNAVAILABLE_URL,
  }));
}

async function attachOfferImages(rankings: DisplayRankingItem[]) {
  try {
    const response = await fetch(`${MOPPY_OFFER_IMAGES_URL}?match=${Date.now()}`, {
      cache: "no-store",
    });
    if (!response.ok) return withUnavailableImages(rankings);

    const json = await response.json();
    const offers = (Array.isArray(json.data) ? json.data : []).filter(
      (offer: MoppyOfferImage) => offer.title && offer.imageUrl
    ) as MoppyOfferImage[];

    const offersByTitle = new Map(
      offers.map((offer) => [normalizeText(offer.title), offer])
    );
    const offersBySiteId = new Map(
      offers
        .map((offer) => [getMoppySiteId(offer.url), offer] as const)
        .filter(([siteId]) => Boolean(siteId))
    );

    return rankings.map((item) => {
      const itemSiteId = getMoppySiteId(item.primary_site_url);
      const matchedOffer =
        (itemSiteId && offersBySiteId.get(itemSiteId)) ||
        offersByTitle.get(normalizeText(item.offer_name));

      return {
        ...item,
        image_url: matchedOffer?.imageUrl || item.image_url || OFFER_IMAGE_UNAVAILABLE_URL,
      };
    });
  } catch (error) {
    console.error(error);
    return withUnavailableImages(rankings);
  }
}

async function getRankings() {
  try {
    const { data, error } = await getSupabase()
      .from("rankings")
      .select("category, rank, offer_name, reward, primary_site_url, updated_at")
      .order("rank", { ascending: true })
      .limit(50);

    if (error || !Array.isArray(data)) {
      if (error) console.error(error);
      return FALLBACK_RANKINGS;
    }

    const rankings = (data as RankingRow[]).map(formatRankingItem);
    return rankings.length > 0 ? attachOfferImages(rankings) : FALLBACK_RANKINGS;
  } catch (error) {
    console.error(error);
    return FALLBACK_RANKINGS;
  }
}

function formatUpdatedAt(items: DisplayRankingItem[]) {
  const latestUpdatedAt = items
    .map((item) => item.updated_at)
    .filter(Boolean)
    .sort()
    .reverse()[0];

  return new Date(latestUpdatedAt || Date.now()).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildStructuredData(rankings: DisplayRankingItem[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${BASE_URL}/#website`,
        name: "モッピー案件分析",
        url: BASE_URL,
        inLanguage: "ja-JP",
      },
      {
        "@type": "Organization",
        "@id": `${BASE_URL}/#organization`,
        name: "モッピー案件分析",
        url: BASE_URL,
        logo: `${BASE_URL}/favicon.png`,
      },
      {
        "@type": "WebPage",
        "@id": `${BASE_URL}/#webpage`,
        url: BASE_URL,
        name: "モッピー案件分析",
        description:
          "ポイ活サイト「モッピー」のたくさんの案件の中から「お得」な案件がわかる。AIが分析して、毎日更新しています。",
        isPartOf: { "@id": `${BASE_URL}/#website` },
        about: ["モッピー", "ポイ活", "高額報酬", "無料案件"],
        inLanguage: "ja-JP",
      },
      {
        "@type": "ItemList",
        "@id": `${BASE_URL}/#ranking-itemlist`,
        name: "お得なモッピー案件ランキング",
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        numberOfItems: rankings.length,
        itemListElement: rankings.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.offer_name,
          url: BASE_URL,
        })),
      },
    ],
  };
}

export default async function Page() {
  const rankings = await getRankings();
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
      <TopPageClient initialItems={rankings} initialUpdatedAt={updatedAt} />
    </>
  );
}
