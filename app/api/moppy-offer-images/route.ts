import { NextResponse } from "next/server";

export const revalidate = 86400;

const CATEGORY_IDS = Array.from({ length: 20 }, (_, index) => 1001 + index);
const DETAIL_ENRICH_LIMIT = 120;

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
  source?: "list" | "detail";
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

const normalizeTitle = (title: string) => {
  return title
    .toLowerCase()
    .replace(/\u3000/g, "")
    .replace(/\s+/g, "")
    .replace(/[\u30fb\uff65]/g, "")
    .replace(/[\u30fc\uff70\u2212]/g, "-")
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
    "favicon",
    "logo",
  ];

  return !trackingImagePatterns.some((pattern) => lowerUrl.includes(pattern));
};

const getImageUrl = (html: string, baseUrl: string) => {
  const candidates: string[] = [];
  const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  const ogImageReversed = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/i);

  if (ogImage?.[1]) candidates.push(ogImage[1]);
  if (ogImageReversed?.[1]) candidates.push(ogImageReversed[1]);

  const imagePattern = /<img\b[^>]*(?:src|data-src|data-original)=["']([^"']+)["'][^>]*>/gi;
  let imageMatch = imagePattern.exec(html);

  while (imageMatch) {
    if (imageMatch[1]) candidates.push(imageMatch[1]);
    imageMatch = imagePattern.exec(html);
  }

  const imageUrls = candidates
    .map((candidate) => toAbsoluteUrl(candidate, baseUrl))
    .filter(isUsableImageUrl);

  return imageUrls.find((url) => url.includes("img.moppy.jp")) || imageUrls[0];
};

const getTitle = (html: string) => {
  const alt = html.match(/<img[^>]+alt=["']([^"']+)["'][^>]*>/i)?.[1]?.trim();
  if (alt && alt.length >= 3) return alt.slice(0, 100);

  const titleAttr = html.match(/title=["']([^"']+)["']/i)?.[1]?.trim();
  if (titleAttr && titleAttr.length >= 3) return titleAttr.slice(0, 100);

  return stripTags(html)
    .replace(/\d{1,3}(,\d{3})*P/g, " ")
    .replace(/★\d(\.\d)?/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
};

const getDetailTitle = (html: string) => {
  const heading = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1];
  const title = stripTags(heading || ogTitle || "")
    .replace(/の詳細.*$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return title.length >= 3 ? title.slice(0, 100) : "";
};

const getReward = (text: string) => {
  const values = [...text.matchAll(/([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)\s*P/g)]
    .map((match) => Number(match[1].replace(/,/g, "")))
    .filter((value) => Number.isFinite(value) && value > 0);

  return values.length > 0 ? Math.max(...values) : 0;
};

const getPrimaryDetailHtml = (html: string) => {
  const cutMarkers = [
    "ポイ活応援サービス",
    "ポイントの交換先",
    "獲得条件",
    "広告概要",
    "特集・キャンペーン",
    "ジャンル別ランキング",
    "クチコミ",
  ];

  return cutMarkers.reduce((current, marker) => {
    const index = current.indexOf(marker);
    return index >= 0 ? current.slice(0, index) : current;
  }, html);
};

const getPrimaryDetailReward = (html: string) => {
  const text = stripTags(getPrimaryDetailHtml(html));
  const values = [...text.matchAll(/([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)\s*P/g)]
    .map((match) => Number(match[1].replace(/,/g, "")))
    .filter((value) => Number.isFinite(value) && value > 0);

  return values.at(-1) || 0;
};

const parseMoppyOfferImages = (html: string, sourceUrl: string) => {
  const offers: MoppyOfferImage[] = [];
  const linkPattern = /<a\b[^>]*href=["']([^"']*(?:detail\.php|\/ad\/detail)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(linkPattern)) {
    const href = match[1];
    const chunk = match[2];
    const start = Math.max(0, match.index ?? 0);
    const around = html.slice(Math.max(0, start - 700), Math.min(html.length, start + match[0].length + 1200));
    const title = getTitle(chunk) || getTitle(around);
    const chunkReward = getReward(stripTags(chunk));
    const nearbyReward = getReward(stripTags(around));

    if (!href || !title) continue;

    offers.push({
      title,
      imageUrl: getImageUrl(chunk, sourceUrl) || getImageUrl(around, sourceUrl),
      url: toAbsoluteUrl(href, sourceUrl),
      reward: chunkReward || nearbyReward,
      source: "list",
    });
  }

  return offers;
};

const parseMoppyDetailOffer = (html: string, sourceUrl: string) => {
  const title = getDetailTitle(html);
  const mainHtml = getPrimaryDetailHtml(html);
  const reward = getPrimaryDetailReward(html);

  if (!title || reward <= 0) return [];

  return [
    {
      title,
      imageUrl: getImageUrl(mainHtml, sourceUrl),
      url: sourceUrl,
      reward,
      source: "detail" as const,
    },
  ];
};

const fetchMoppyDetailOffer = async (url: string) => {
  try {
    const response = await fetch(url, {
      next: { revalidate: 86400 },
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; PoikatsuAI/1.0; +https://poikatu-ai.vercel.app)",
      },
    });

    if (!response.ok) return [];
    return parseMoppyDetailOffer(await response.text(), url);
  } catch (error) {
    console.error(error);
    return [];
  }
};

const pickBetterOffer = (current: MoppyOfferImage, next: MoppyOfferImage) => {
  if (next.source === "detail" && current.source !== "detail") return next;
  if (current.source === "detail" && next.source !== "detail") return current;

  const currentScore = (current.imageUrl ? 1000000 : 0) + Number(current.reward || 0);
  const nextScore = (next.imageUrl ? 1000000 : 0) + Number(next.reward || 0);

  return nextScore > currentScore ? next : current;
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
  const detailEnrichmentTargets = offers
    .filter((offer) => offer.title && offer.url && offer.reward > 0)
    .slice(0, DETAIL_ENRICH_LIMIT);
  const enrichmentResults = await Promise.allSettled(
    detailEnrichmentTargets.map((offer) => fetchMoppyDetailOffer(offer.url))
  );
  const enrichedOffers = enrichmentResults.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );

  const offerMap = new Map<string, MoppyOfferImage>();
  [...offers, ...enrichedOffers].forEach((offer) => {
    if (!offer.title || !offer.url || offer.reward <= 0) return;
    const key = normalizeTitle(offer.title);
    const current = offerMap.get(key);
    offerMap.set(key, current ? pickBetterOffer(current, offer) : offer);
  });

  const uniqueOffers = Array.from(offerMap.values()).slice(0, 700);

  return NextResponse.json({ data: uniqueOffers });
}
