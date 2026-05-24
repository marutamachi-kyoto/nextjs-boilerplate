import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MOPPY_OFFER_URL = "https://poikatu-ai.vercel.app/api/moppy-offer-images";
const RANKING_LIMIT = 50;

type MoppyOffer = {
  title: string;
  imageUrl?: string;
  url: string;
  reward: number;
};

type MoppyDetail = {
  title: string;
  text: string;
  imageUrl?: string;
  reward: number;
};

type RankingItem = {
  rank?: number | null;
  offer_name?: string | null;
  trend_keyword?: string | null;
  category?: string | null;
  reward?: number | null;
  description?: string | null;
  reason?: string | null;
  primary_site_name?: string | null;
  primary_site_url?: string | null;
  secondary_site_name?: string | null;
  secondary_site_url?: string | null;
  updated_at?: string | null;
};

const normalizeText = (text?: string | null) => {
  return (text || "")
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/\u3000/g, "")
    .replace(/\s+/g, "")
    .replace(/\uff08/g, "(")
    .replace(/\uff09/g, ")")
    .replace(/[\u30fb\uff65]/g, "")
    .replace(/[\u30fc\uff70\u2212]/g, "-")
    .replace(/[\[\]\u3010\u3011!\uff01?\uff1f\u3002\u3001\u300c\u300d\u300e\u300f()\uff08\uff09]/g, "")
    .trim();
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
    "favicon",
    "logo",
  ];

  return !trackingImagePatterns.some((pattern) => lowerUrl.includes(pattern));
};

const getImageUrl = (html: string, baseUrl: string) => {
  const imageMatches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)];
  const imageUrls = imageMatches
    .map((match) => toAbsoluteUrl(match[1], baseUrl))
    .filter(isUsableImageUrl);

  return imageUrls.find((url) => url.includes("img.moppy.jp")) || imageUrls[0];
};

const getDetailTitle = (html: string) => {
  const heading = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1];
  const pageTitle = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const title = stripTags(heading || ogTitle || pageTitle || "")
    .replace(/の詳細.*$/g, "")
    .replace(/\|.*$/g, "")
    .replace(/｜.*$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return title.length >= 3 ? title.slice(0, 120) : "";
};

const getReward = (text: string) => {
  const values = [...text.matchAll(/([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)\s*P/g)]
    .map((match) => Number(match[1].replace(/,/g, "")))
    .filter((value) => Number.isFinite(value) && value > 0);

  return values.length > 0 ? Math.max(...values) : 0;
};

const isRewardAvailable = (reward?: number | null) => {
  return Number.isFinite(Number(reward)) && Number(reward) > 0;
};

const isVerifiedMoppyOffer = (offer?: MoppyOffer | null): offer is MoppyOffer => {
  return Boolean(
    offer?.url &&
      offer.url.includes("pc.moppy.jp/") &&
      !offer.url.includes("/entry/invite.php") &&
      isRewardAvailable(offer.reward)
  );
};

const fetchMoppyOffers = async (): Promise<MoppyOffer[]> => {
  try {
    const response = await fetch(MOPPY_OFFER_URL, {
      next: { revalidate: 1800 },
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; PoikatsuAI/1.0; +https://poikatu-ai.vercel.app)",
      },
    });

    if (!response.ok) return [];

    const json = await response.json();
    const offers = Array.isArray(json.data) ? (json.data as MoppyOffer[]) : [];
    const uniqueOffers = new Map<string, MoppyOffer>();

    offers.filter(isVerifiedMoppyOffer).forEach((offer) => {
      const key = normalizeText(offer.title) || offer.url;
      const current = uniqueOffers.get(key);
      if (!current) {
        uniqueOffers.set(key, offer);
        return;
      }

      const currentScore = (current.imageUrl ? 2 : 0) + Number(current.reward || 0);
      const nextScore = (offer.imageUrl ? 2 : 0) + Number(offer.reward || 0);
      if (nextScore > currentScore) uniqueOffers.set(key, offer);
    });

    return Array.from(uniqueOffers.values()).sort(
      (a, b) => Number(b.reward) - Number(a.reward)
    );
  } catch (error) {
    console.error(error);
    return [];
  }
};

const fetchMoppyDetail = async (url?: string): Promise<MoppyDetail | null> => {
  if (!url) return null;

  try {
    const response = await fetch(url, {
      next: { revalidate: 1800 },
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; PoikatsuAI/1.0; +https://poikatu-ai.vercel.app)",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();
    const mainHtml =
      html.split("ポイ活応援サービス")[0]?.split("ポイントの交換先")[0] || html;
    const text = stripTags(mainHtml);

    return {
      title: getDetailTitle(mainHtml),
      text,
      imageUrl: getImageUrl(mainHtml, url),
      reward: getReward(text),
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};

const getUrlKey = (url?: string | null) => {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    return (
      parsed.searchParams.get("site_id") ||
      parsed.searchParams.get("s_id") ||
      parsed.searchParams.get("id") ||
      url
    );
  } catch {
    return url;
  }
};

const isStrongNameMatch = (offerName: string, title: string) => {
  const name = normalizeText(offerName);
  const normalizedTitle = normalizeText(title);

  if (!name || !normalizedTitle) return false;
  if (name === normalizedTitle) return true;

  const shorterLength = Math.min(name.length, normalizedTitle.length);
  const longerLength = Math.max(name.length, normalizedTitle.length);
  const overlapRatio = shorterLength / Math.max(longerLength, 1);

  return (
    shorterLength >= 8 &&
    overlapRatio >= 0.55 &&
    (normalizedTitle.includes(name) || name.includes(normalizedTitle))
  );
};

const getImportantTokens = (value: string) => {
  const stopWords = new Set([
    "カード",
    "クレジット",
    "ポイント",
    "ポイ活",
    "モッピー",
    "キャンペーン",
    "無料",
    "新規",
    "公式",
    "the",
    "and",
    "with",
  ]);

  return value
    .replace(/[【】\[\]（）()「」『』・･_\-|｜]/g, " ")
    .split(/\s+/)
    .map((token) => normalizeText(token))
    .filter((token) => token.length >= 2)
    .filter((token) => !stopWords.has(token));
};

const isDetailMatchedToOffer = (offerName: string, detail: MoppyDetail) => {
  const offer = normalizeText(offerName);
  const detailTitle = normalizeText(detail.title);
  const detailBody = normalizeText(`${detail.title} ${detail.text.slice(0, 2500)}`);

  if (!offer || !detailBody) return false;
  if (detailTitle && (detailTitle.includes(offer) || offer.includes(detailTitle))) {
    return true;
  }

  const tokens = getImportantTokens(offerName);
  if (tokens.length === 0) return false;

  const matchedTokenCount = tokens.filter((token) => detailBody.includes(token)).length;
  if (tokens.length === 1) return matchedTokenCount === 1;

  return matchedTokenCount >= Math.min(2, tokens.length);
};

const findMoppyOffer = (item: RankingItem, offers: MoppyOffer[]) => {
  const savedUrlKey = getUrlKey(item.primary_site_url);

  if (savedUrlKey) {
    const urlMatched = offers.find((offer) => getUrlKey(offer.url) === savedUrlKey);
    if (urlMatched) return urlMatched;
  }

  const offerName = item.offer_name || "";
  if (!offerName) return null;

  return (
    offers.find((offer) => normalizeText(offer.title) === normalizeText(offerName)) ||
    offers.find((offer) => isStrongNameMatch(offerName, offer.title)) ||
    null
  );
};

const getFallbackReason = (offerName: string, trendKeyword?: string | null) => {
  const keyword = trendKeyword || offerName;
  return `${offerName}は、Googleの検索で「${keyword}」も一緒に調べられています。`;
};

const formatRankingItem = (
  item: RankingItem,
  index: number,
  matchedOffer: MoppyOffer
) => {
  const offerName =
    item.offer_name ||
    item.trend_keyword ||
    item.category ||
    matchedOffer.title ||
    `おすすめ案件 ${index + 1}`;
  const reward = matchedOffer.reward;
  const category = item.category ?? "その他";

  return {
    rank: index + 1,
    offer_name: offerName,
    category: `${category} ${offerName}`,
    trend_keyword: item.trend_keyword ?? item.offer_name ?? item.category ?? offerName,
    reward,
    reason:
      item.description ||
      item.reason ||
      getFallbackReason(offerName, item.trend_keyword ?? item.category),
    image_url: matchedOffer.imageUrl,
    primary_site_name: "モッピー",
    primary_site_url: matchedOffer.url,
    secondary_site_name: item.secondary_site_name ?? "ポイントインカム",
    secondary_site_url: item.secondary_site_url ?? "https://pointi.jp/",
    updated_at: item.updated_at,
  };
};

export async function GET() {
  try {
    const rankingResult = await supabase
      .from("rankings")
      .select("*")
      .order("updated_at", { ascending: false })
      .order("rank", { ascending: true })
      .limit(RANKING_LIMIT);
    const moppyOffers = await fetchMoppyOffers();

    if (rankingResult.error) {
      console.error(rankingResult.error);
      return Response.json(
        { error: "ランキング取得に失敗しました" },
        { status: 500 }
      );
    }

    const sourceItems = (rankingResult.data || []) as RankingItem[];
    const verifiedPairs = await Promise.all(
      sourceItems.map(async (item) => {
        const matchedOffer = findMoppyOffer(item, moppyOffers);
        if (!isVerifiedMoppyOffer(matchedOffer)) return null;

        const detail = await fetchMoppyDetail(matchedOffer.url);
        if (!detail || !isRewardAvailable(detail.reward)) return null;

        const offerName = item.offer_name || matchedOffer.title;
        if (!isDetailMatchedToOffer(offerName, detail)) return null;

        const verifiedOffer = {
          ...matchedOffer,
          reward: detail.reward,
          imageUrl: detail.imageUrl || matchedOffer.imageUrl,
        };

        return isVerifiedMoppyOffer(verifiedOffer)
          ? { item, matchedOffer: verifiedOffer }
          : null;
      })
    );

    const formatted = verifiedPairs
      .filter(
        (pair): pair is { item: RankingItem; matchedOffer: MoppyOffer } =>
          Boolean(pair)
      )
      .slice(0, RANKING_LIMIT)
      .map(({ item, matchedOffer }, index) => {
        return formatRankingItem(item, index, matchedOffer);
      });

    return Response.json({
      data: formatted,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
