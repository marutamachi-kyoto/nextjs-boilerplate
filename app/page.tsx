import type { Metadata } from "next";
import Script from "next/script";
import { createClient } from "@supabase/supabase-js";
import TopPageClient from "./top-page-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_URL = "https://poikatu-ai.vercel.app";
const SITE_NAME = "モッピー案件分析";
const MOPPY_OFFER_IMAGES_URL = `${BASE_URL}/api/moppy-offer-images`;
const OFFER_IMAGE_UNAVAILABLE_URL = "/offer-image-unavailable.svg";
const PAGE_DESCRIPTION =
  "ポイ活サイト「モッピー」のたくさんの案件の中から「お得」な案件がわかる。報酬の高さや手軽さをもとに、AIが毎日更新（0:00～1:00頃）。";

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
  description: PAGE_DESCRIPTION,
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
    title: SITE_NAME,
    description: PAGE_DESCRIPTION,
    url: BASE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "ja_JP",
    images: [
      {
        url: "/hero.png.png",
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: PAGE_DESCRIPTION,
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

function getLatestUpdatedAt(items: DisplayRankingItem[]) {
  const latestUpdatedAt = items
    .map((item) => item.updated_at)
    .filter(Boolean)
    .sort()
    .reverse()[0];

  return latestUpdatedAt || null;
}

function formatUpdatedAt(items: DisplayRankingItem[]) {
  const latestUpdatedAt = getLatestUpdatedAt(items);

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

function getAbsoluteImageUrl(imageUrl?: string | null) {
  if (!imageUrl) return `${BASE_URL}${OFFER_IMAGE_UNAVAILABLE_URL}`;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
  return `${BASE_URL}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
}

function buildStructuredData(rankings: DisplayRankingItem[]) {
  const latestUpdatedAt = getLatestUpdatedAt(rankings);
  const dateModified = latestUpdatedAt ? new Date(latestUpdatedAt).toISOString() : undefined;
  const rankingItems = rankings.map((item, index) => {
    const itemUrl = item.primary_site_url || BASE_URL;
    const reward = Number(item.reward || 0);

    return {
      "@type": "ListItem",
      position: index + 1,
      url: itemUrl,
      item: {
        "@type": "Offer",
        "@id": `${BASE_URL}/#offer-${index + 1}`,
        name: item.offer_name,
        url: itemUrl,
        image: getAbsoluteImageUrl(item.image_url),
        category: item.category,
        seller: {
          "@type": "Organization",
          name: "モッピー",
          url: "https://pc.moppy.jp/",
        },
        itemOffered: {
          "@type": "Service",
          name: item.offer_name,
        },
        additionalProperty: [
          {
            "@type": "PropertyValue",
            name: "獲得ポイント",
            value: reward,
            unitText: "P",
          },
          {
            "@type": "PropertyValue",
            name: "お得な理由",
            value: item.category,
          },
        ],
      },
    };
  });

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${BASE_URL}/#website`,
        name: SITE_NAME,
        alternateName: ["ポイ活AI判定", "モッピー案件ランキング"],
        url: BASE_URL,
        description: PAGE_DESCRIPTION,
        inLanguage: "ja-JP",
        publisher: { "@id": `${BASE_URL}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${BASE_URL}/#organization`,
        name: SITE_NAME,
        url: BASE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${BASE_URL}/favicon.png`,
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${BASE_URL}/#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: SITE_NAME,
            item: BASE_URL,
          },
        ],
      },
      {
        "@type": "WebPage",
        "@id": `${BASE_URL}/#webpage`,
        url: BASE_URL,
        name: SITE_NAME,
        description: PAGE_DESCRIPTION,
        isPartOf: { "@id": `${BASE_URL}/#website` },
        breadcrumb: { "@id": `${BASE_URL}/#breadcrumb` },
        mainEntity: { "@id": `${BASE_URL}/#ranking-itemlist` },
        about: ["モッピー", "ポイ活", "高額報酬", "無料案件", "ポイントサイト"],
        inLanguage: "ja-JP",
        ...(dateModified ? { dateModified } : {}),
      },
      {
        "@type": "ItemList",
        "@id": `${BASE_URL}/#ranking-itemlist`,
        name: "お得なモッピー案件ランキング",
        description: "報酬の高さや手軽さをもとにAIが毎日更新するモッピー案件ランキングです。",
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        numberOfItems: rankingItems.length,
        itemListElement: rankingItems,
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
