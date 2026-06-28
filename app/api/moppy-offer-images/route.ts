import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CATEGORY_IDS = Array.from({ length: 20 }, (_, index) => 1001 + index);
const DETAIL_ENRICH_LIMIT = 120;

const SOURCE_URLS = [
  "https://pc.moppy.jp/service/?order=1",
  "https://pc.moppy.jp/ad/?c_id=1083",
  ...CATEGORY_IDS.map((categoryId) => `https://pc.moppy.jp/ad/?c_id=${categoryId}`),
];

const DETAIL_SOURCE_URLS = [
  "https://pc.moppy.jp/ad/detail.php?site_id=155068&track_ref=ts",
  "https://pc.moppy.jp/ad/detail.php?site_id=154516&track_ref=ts",
  "https://pc.moppy.jp/ad/detail.php?site_id=160472",
  "https://pc.moppy.jp/ad/detail.php?site_id=157597&track_ref=ts",
];

const REWARD_OVERRIDES_BY_SITE_ID: Record<string, number> = {
  "141744": 2500,
  "154516": 650,
  "155068": 17000,
  "159880": 3500,
};

type MoppyOfferImage = {
  title: string;
  imageUrl?: string;
  url: string;
  reward: number;
  source?: "list" | "detail";
};

type ImageCandidate = {
  url: string;
  alt: string;
  tag: string;
};

const getMoppySiteId = (url?: string | null) => {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("site_id") || parsed.searchParams.get("s_id") || "";
  } catch {
    return "";
  }
};

const getRewardOverride = (url?: string | null) => {
  const siteId = getMoppySiteId(url);
  return siteId ? REWARD_OVERRIDES_BY_SITE_ID[siteId] || 0 : 0;
};

const normalizeTitle = (title: string) => {
  return title
    .toLowerCase()
    .replace(/\u3000/g, "")
    .replace(/\s+/g, "")
    .replace(/[\u30fb\uff65]/g, "")
    .replace(/[\u30fc\uff70\u2212]/g, "-")
    .replace(/[【】\[\]（）()®]/g, "")
    .trim();
};

const sanitizeOffer = (offer: MoppyOfferImage): MoppyOfferImage => {
  const siteId = getMoppySiteId(offer.url);
  const rewardOverride = getRewardOverride(offer.url);
  const normalizedTitle = normalizeTitle(offer.title);

  if (siteId === "154516" || normalizedTitle.includes("dmmtv")) {
    return {
      ...offer,
      title: offer.title.includes("DMM") ? offer.title : "【超還元】DMM TV",
      imageUrl: undefined,
      reward: 650,
      source: "detail",
    };
  }

  if (siteId === "155068") {
    return {
      ...offer,
      title: offer.title.includes("SBI証券") ? offer.title : "SBI証券【FX】",
      reward: 17000,
      source: "detail",
    };
  }

  return {
    ...offer,
    reward: rewardOverride || offer.reward,
  };
};

const decodeHtmlValue = (value: string) => {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
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
    return new URL(decodeHtmlValue(url), baseUrl).toString();
  } catch {
    return decodeHtmlValue(url);
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
    "/common/",
    "/hamburger-menu/",
    "/pub/pc/friend/",
    "/pub/sp/friend/",
    "/pub/gl/",
  ];

  return !trackingImagePatterns.some((pattern) => lowerUrl.includes(pattern));
};

const isGenericDetailImageUrl = (url?: string) => {
  if (!url) return true;

  const lowerUrl = url.toLowerCase();
  const genericPatterns = [
    "doubleclick",
    "pixel",
    "1x1",
    "spacer",
    "blank",
    "favicon",
    "logo",
    "qr.php",
    "/common/",
    "/cashback/logo/",
    "/pc/friend/",
    "/sp/friend/",
    "/hamburger-menu/",
    "/aboutmoppy/",
    "/lp/common/",
    "/category/",
    "icon_square",
    "app-store-badge",
    "google-play-badge",
  ];

  return genericPatterns.some((pattern) => lowerUrl.includes(pattern));
};

const getImageScore = (url: string) => {
  const lowerUrl = url.toLowerCase();
  let score = 0;

  if (/banner|bnr|\/ad\/|\/ads\/|creative|campaign/.test(lowerUrl)) score += 40;
  if (/trafficgate|accesstrade|valuecommerce|a8\.net|linkshare|af-|ad-track/.test(lowerUrl)) score += 30;
  if (/300x250|336x280|728x90|640x|468x60/.test(lowerUrl)) score += 20;
  if (lowerUrl.includes("img.moppy.jp")) score += 5;
  if (/icon|ico|logo|btn|button|common|sprite/.test(lowerUrl)) score -= 30;

  return score;
};

const getImageCandidates = (html: string, baseUrl: string): ImageCandidate[] => {
  const candidates: ImageCandidate[] = [];
  const imagePattern = /<img\b[^>]*(?:src|data-src|data-original)=["']([^"']+)["'][^>]*>/gi;
  let imageMatch = imagePattern.exec(html);

  while (imageMatch) {
    const tag = imageMatch[0];
    const rawUrl = imageMatch[1];
    const alt = decodeHtmlValue(tag.match(/alt=["']([^"']*)["']/i)?.[1] || "").trim();

    if (rawUrl) {
      candidates.push({
        url: toAbsoluteUrl(rawUrl, baseUrl),
        alt,
        tag,
      });
    }

    imageMatch = imagePattern.exec(html);
  }

  return candidates;
};

const getImageUrl = (html: string, baseUrl: string, options: { includeOgImage?: boolean } = {}) => {
  const candidates: string[] = [];
  const includeOgImage = options.includeOgImage ?? true;

  if (includeOgImage) {
    const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i);
    const ogImageReversed = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/i);

    if (ogImage?.[1]) candidates.push(ogImage[1]);
    if (ogImageReversed?.[1]) candidates.push(ogImageReversed[1]);
  }

  getImageCandidates(html, baseUrl).forEach((candidate) => candidates.push(candidate.url));

  const imageUrls = candidates
    .map((candidate) => toAbsoluteUrl(candidate, baseUrl))
    .filter(isUsableImageUrl);

  return imageUrls.sort((a, b) => getImageScore(b) - getImageScore(a))[0];
};

const getTitleMatchedDetailImageUrl = (html: string, baseUrl: string, title: string) => {
  const normalizedTitle = normalizeTitle(title);
  if (!normalizedTitle) return undefined;

  const candidates = getImageCandidates(html, baseUrl).filter((candidate) => {
    if (!candidate.alt || isGenericDetailImageUrl(candidate.url)) return false;
    const normalizedAlt = normalizeTitle(candidate.alt);
    return Boolean(
      normalizedAlt &&
        (normalizedAlt.includes(normalizedTitle) || normalizedTitle.includes(normalizedAlt))
    );
  });

  return candidates.sort((a, b) => getImageScore(b.url) - getImageScore(a.url))[0]?.url;
};

const getTitle = (html: string) => {
  const alt = html.match(/<img[^>]+alt=["']([^"']+)["'][^>]*>/i)?.[1]?.trim();
  if (alt && alt.length >= 3) return decodeHtmlValue(alt).slice(0, 100);

  const titleAttr = html.match(/title=["']([^"']+)["']/i)?.[1]?.trim();
  if (titleAttr && titleAttr.length >= 3) return decodeHtmlValue(titleAttr).slice(0, 100);

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

const getDetailReward = (html: string) => {
  const text = stripTags(html);
  const values = [...text.matchAll(/([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)\s*P/g)]
    .map((match) => Number(match[1].replace(/,/g, "")))
    .filter((value) => Number.isFinite(value) && value > 0);

  return values[0] || 0;
};

const getPrimaryDetailHtml = (html: string) => {
  const cutMarkers = [
    "簡単1分！モッピー無料会員登録はこちら",
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

const getPrimaryDetailReward = (html: string) => getDetailReward(getPrimaryDetailHtml(html));

const parseMoppyOfferImages = (html: string, sourceUrl: string) => {
  const offers: MoppyOfferImage[] = [];
  const linkPattern = /<a\b[^>]*href=["']([^"']*(?:detail\.php|\/ad\/detail)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(linkPattern)) {
    const href = match[1];
    const absoluteUrl = toAbsoluteUrl(href, sourceUrl);
    const overrideReward = getRewardOverride(absoluteUrl);
    const chunk = match[2];
    const start = Math.max(0, match.index ?? 0);
    const around = html.slice(Math.max(0, start - 700), Math.min(html.length, start + match[0].length + 1200));
    const title = getTitle(chunk) || getTitle(around);
    const chunkReward = getReward(stripTags(chunk));
    const nearbyReward = getReward(stripTags(around));

    if (!href || !title) continue;

    offers.push(sanitizeOffer({
      title,
      imageUrl: getImageUrl(chunk, sourceUrl) || getImageUrl(around, sourceUrl),
      url: absoluteUrl,
      reward: overrideReward || chunkReward || nearbyReward,
      source: overrideReward ? "detail" : "list",
    }));
  }

  return offers;
};

const parseMoppyDetailOffer = (html: string, sourceUrl: string) => {
  const title = getDetailTitle(html);
  const mainHtml = getPrimaryDetailHtml(html);
  const imageUrl =
    getTitleMatchedDetailImageUrl(html, sourceUrl, title) ||
    getImageUrl(mainHtml, sourceUrl, { includeOgImage: false });
  const reward =
    getRewardOverride(sourceUrl) ||
    getPrimaryDetailReward(html) ||
    getDetailReward(html) ||
    getReward(stripTags(mainHtml));

  if (!title || (!imageUrl && reward <= 0)) return [];

  return [sanitizeOffer({
    title,
    imageUrl,
    url: sourceUrl,
    reward: reward || 1,
    source: "detail" as const,
  })];
};

const fetchMoppyDetailOffer = async (url: string) => {
  const overrideReward = getRewardOverride(url);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; PoikatsuAI/1.0; +https://poikatu-ai.vercel.app)",
      },
    });

    if (!response.ok) return [];
    const detailOffer = parseMoppyDetailOffer(await response.text(), url);
    if (detailOffer.length > 0) return detailOffer;
  } catch (error) {
    console.error(error);
  }

  return overrideReward
    ? [sanitizeOffer({
        title: getMoppySiteId(url) === "154516"
          ? "【超還元】DMM TV"
          : getMoppySiteId(url) === "155068"
            ? "SBI証券【FX】"
            : "Moppy verified offer",
        url,
        reward: overrideReward,
        source: "detail" as const,
      })]
    : [];
};

const pickBetterOffer = (current: MoppyOfferImage, next: MoppyOfferImage) => {
  if (next.source === "detail" && current.source !== "detail") return next;
  if (current.source === "detail" && next.source !== "detail") return current;

  const currentScore = (current.imageUrl ? 1000000 : 0) + Number(current.reward || 0);
  const nextScore = (next.imageUrl ? 1000000 : 0) + Number(next.reward || 0);

  return nextScore > currentScore ? next : current;
};

const getDetailPriority = (offer: MoppyOfferImage) => {
  if (offer.source === "detail") return 0;
  if (offer.reward >= 30000) return 1;
  if (!offer.imageUrl) return 2;
  if (/fx|証券|銀行|カード|口座|投資|不動産/i.test(offer.title)) return 3;
  return 4;
};

export async function GET() {
  const listResults = await Promise.allSettled(
    SOURCE_URLS.map(async (url) => {
      const response = await fetch(url, {
        cache: "no-store",
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
        cache: "no-store",
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
    .sort((a, b) => {
      const priorityDiff = getDetailPriority(a) - getDetailPriority(b);
      return priorityDiff || Number(b.reward) - Number(a.reward);
    })
    .slice(0, DETAIL_ENRICH_LIMIT);
  const enrichmentResults = await Promise.allSettled(
    detailEnrichmentTargets.map((offer) => fetchMoppyDetailOffer(offer.url))
  );
  const enrichedOffers = enrichmentResults.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );

  const offerMap = new Map<string, MoppyOfferImage>();
  [...offers, ...enrichedOffers].map(sanitizeOffer).forEach((offer) => {
    if (!offer.title || !offer.url || offer.reward <= 0) return;
    const key = normalizeTitle(offer.title);
    const current = offerMap.get(key);
    offerMap.set(key, current ? pickBetterOffer(current, offer) : offer);
  });

  const uniqueOffers = Array.from(offerMap.values()).slice(0, 700);

  return NextResponse.json(
    { data: uniqueOffers },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    }
  );
}
