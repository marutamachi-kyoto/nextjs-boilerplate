import { NextResponse } from "next/server";

const CATEGORY_IDS = Array.from({ length: 20 }, (_, index) => 1001 + index);

const SOURCE_URLS = [
  "https://pc.moppy.jp/service/?order=1",
  "https://pc.moppy.jp/ad/?c_id=1083",
  "https://pc.moppy.jp/ad/?c_id=1011",
  "https://pc.moppy.jp/ad/?c_id=1010",
  ...CATEGORY_IDS.map((categoryId) => `https://pc.moppy.jp/ad/?c_id=${categoryId}`),
];

const MAX_OFFERS = 50;

type FreeOffer = {
  title: string;
  description: string;
  reward: number;
  rewardText: string;
  imageUrl?: string;
  url: string;
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
  if (alt && alt.length >= 3) return alt.slice(0, 60);

  return stripTags(html)
    .replace(/\d{1,3}(,\d{3})*P/g, " ")
    .replace(/★\d(\.\d)?/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
};

const getReward = (text: string) => {
  const values = [...text.matchAll(/([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)\s*P/g)]
    .map((match) => Number(match[1].replace(/,/g, "")))
    .filter((value) => Number.isFinite(value) && value > 0);

  return values.length > 0 ? Math.max(...values) : 0;
};

const isFreeOffer = (text: string) => {
  const includeWords = [
    "無料",
    "無料会員登録",
    "無料登録",
    "会員登録",
    "新規登録",
    "資料請求",
    "無料資料請求",
    "一括見積",
    "見積もり",
    "見積り",
    "無料相談",
    "相談",
    "モニター",
    "アプリ",
    "インストール",
    "動画視聴",
    "LINE友達追加",
    "アンケート",
    "無料トライアル",
    "無料体験",
    "無料お試し",
  ];

  const excludeWords = [
    "商品購入",
    "購入完了",
    "有料",
    "月額",
    "課金",
    "入金",
    "投資",
    "投資完了",
    "不動産投資",
    "100万円",
    "取引",
    "取引完了",
    "証券",
    "FX",
    "クレジットカード",
    "カード発行",
    "カード利用",
    "ショッピング",
    "来店",
    "予約来店",
  ];

  return (
    includeWords.some((word) => text.includes(word)) &&
    !excludeWords.some((word) => text.includes(word))
  );
};

const isMoppyPromotionBanner = (
  title: string,
  text: string,
  imageUrl?: string
) => {
  const joined = `${title} ${text} ${imageUrl || ""}`.toLowerCase();
  return (
    joined.includes("累計会員数") ||
    joined.includes("1400万人") ||
    joined.includes("内職/副業/お小遣い稼ぎ") ||
    joined.includes("無料で貯まる") ||
    joined.includes("エンジョイ盛り沢山") ||
    joined.includes("img.moppy.jp/pub/pc/friend/") ||
    joined.includes("300x250-1.jpg")
  );
};

const parseMoppyOffers = (html: string, sourceUrl: string) => {
  const offers: FreeOffer[] = [];
  const linkPattern = /<a\b[^>]*href=["']([^"']*(?:detail\.php|\/ad\/detail)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(linkPattern)) {
    const href = match[1];
    const chunk = match[2];
    const text = stripTags(chunk);
    const reward = getReward(text);

    if (!href || !text || reward <= 0 || !isFreeOffer(text)) continue;

    const title = getTitle(chunk);
    if (!title || title.length < 3) continue;

    const imageUrl = getImageUrl(chunk, sourceUrl);
    if (isMoppyPromotionBanner(title, text, imageUrl)) continue;

    const description = text
      .replace(title, "")
      .replace(/\d{1,3}(,\d{3})*P/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 84);

    offers.push({
      title,
      description:
        description ||
        "無料で始めやすい案件です。ポイント獲得条件をモッピーで確認してから申し込めます。",
      reward,
      rewardText: `${reward.toLocaleString("ja-JP")}P`,
      imageUrl,
      url: toAbsoluteUrl(href, sourceUrl),
    });
  }

  return offers;
};

async function fetchFreeOffers() {
  const results = await Promise.allSettled(
    SOURCE_URLS.map(async (url) => {
      const response = await fetch(url, {
        next: { revalidate: 86400 },
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; PoikatsuAI/1.0; +https://poikatu-ai.vercel.app)",
        },
      });

      if (!response.ok) return [];
      return parseMoppyOffers(await response.text(), url);
    })
  );

  const offers = results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );

  return Array.from(new Map(offers.map((offer) => [offer.title, offer])).values())
    .sort((a, b) => b.reward - a.reward)
    .slice(0, MAX_OFFERS);
}

export async function GET() {
  try {
    const offers = await fetchFreeOffers();
    return NextResponse.json(
      { data: offers },
      {
        headers: {
          "Cache-Control": "s-maxage=86400, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 }
    );
  }
}
