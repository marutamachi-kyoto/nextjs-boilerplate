import { NextResponse } from "next/server";

export const revalidate = 86400;

const CATEGORY_IDS = Array.from({ length: 20 }, (_, index) => 1001 + index);

const SOURCE_URLS = [
  "https://pc.moppy.jp/service/?order=1",
  "https://pc.moppy.jp/ad/?c_id=1083",
  ...CATEGORY_IDS.map((categoryId) => `https://pc.moppy.jp/ad/?c_id=${categoryId}`),
];

const DETAIL_SOURCE_URLS = [
  "https://pc.moppy.jp/ad/detail.php?site_id=160472",
];

type MoppyOfferImage = {
  title: string;
  imageUrl?: string;
  url: string;
  reward: number;
};

const stripTags = (html: string) => {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
};

const toAbsoluteUrl = (url: string, baseUrl: string) => {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return url;
  }
};

const isUsableImageUrl = (url?: string) => {
  if (!url) return false;

  const lowerUrl = url.toLowerCase();
  const trackingImagePatterns = [
    "ad-track.jp/ad/p/img",
    "ad-track.jp/ad/p/",
    "doubleclick",
    "pixel",
    "1x1",
    "spacer",
    "blank",
  ];

  return !trackingImagePatterns.some((pattern) => lowerUrl.includes(pattern));
};

const getImageUrl = (html: string, baseUrl: string) => {
  const imageMatches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)];

  for (const match of imageMatches) {
    const imageUrl = toAbsoluteUrl(match[1], baseUrl);
    if (isUsableImageUrl(imageUrl)) return imageUrl;
  }

  return undefined;
};

const getTitle = (html: string) => {
  const alt = html.match(/<img[^>]+alt=["']([^"']+)["'][^>]*>/i)?.[1]?.trim();
  if (alt && alt.length >= 3) return alt.slice(0, 80);

  return stripTags(html)
    .replace(/\d{1,3}(,\d{3})*P/g, " ")
    .replace(/★\d(\.\d)?/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
};

const getDetailTitle = (html: string) => {
  const heading = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1];
  const title = stripTags(heading || ogTitle || "")
    .replace(/の詳細.*$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return title.length >= 3 ? title.slice(0, 80) : "";
};

const getReward = (text: string) => {
  const values = [...text.matchAll(/([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)\s*P/g)]
    .map((match) => Number(match[1].replace(/,/g, "")))
    .filter((value) => Number.isFinite(value) && value > 0);

  return values.length > 0 ? Math.max(...values) : 0;
};

const parseMoppyOfferImages = (html: string, sourceUrl: string) => {
  const offers: MoppyOfferImage[] = [];
  const linkPattern = /<a\b[^>]*href=["']([^"']*(?:detail\.php|\/ad\/detail)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(linkPattern)) {
    const href = match[1];
    const chunk = match[2];
    const title = getTitle(chunk);
    const text = stripTags(chunk);

    if (!href || !title) continue;

    offers.push({
      title,
      imageUrl: getImageUrl(chunk, sourceUrl),
      url: toAbsoluteUrl(href, sourceUrl),
      reward: getReward(text),
    });
  }

  return offers;
};

const parseMoppyDetailOffer = (html: string, sourceUrl: string) => {
  const title = getDetailTitle(html);
  const mainHtml = html.split("ポイ活応援サービス")[0]?.split("ポイントの交換先")[0] || html;
  const reward = getReward(stripTags(mainHtml));

  if (!title || reward <= 0) return [];

  return [
    {
      title,
      imageUrl: getImageUrl(mainHtml, sourceUrl),
      url: sourceUrl,
      reward,
    },
  ];
};

export async function GET() {
  const listResults = await Promise.allSettled(
    SOURCE_URLS.map(async (url) => {
      const response = await fetch(url, {
        next: { revalidate: 86400 },
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; PoikatsuAI/1.0; +https://poikatu-ai.vercel.app)",
        },
      });

      if (!response.ok) return [];
      return parseMoppyOfferImages(await response.text(), url);
    })
  );

  const detailResults = await Promise.allSettled(
    DETAIL_SOURCE_URLS.map(async (url) => {
      const response = await fetch(url, {
        next: { revalidate: 86400 },
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; PoikatsuAI/1.0; +https://poikatu-ai.vercel.app)",
        },
      });

      if (!response.ok) return [];
      return parseMoppyDetailOffer(await response.text(), url);
    })
  );

  const offers = [...listResults, ...detailResults].flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );

  const uniqueOffers = Array.from(
    new Map(offers.map((offer) => [offer.title, offer])).values()
  ).slice(0, 500);

  return NextResponse.json({ data: uniqueOffers });
}
