import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MOPPY_OFFER_URL = "https://poikatu-ai.vercel.app/api/moppy-offer-images";
const GOOGLE_SUGGEST_URL = "https://suggestqueries.google.com/complete/search";
const RANKING_LIMIT = 50;
const BACKFILL_KEYWORD = "モッピー確認済み案件";

type MoppyOffer = {
  title: string;
  imageUrl?: string;
  url: string;
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

const toSearchWord = (value?: string | null) => {
  const original = (value || "").trim();
  if (!original) return "";

  let text = original
    .replace(/\u3010[^\u3011]*\u3011/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\uff08[^\uff09]*\uff09/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[\u300c\u300d\u300e\u300f]/g, " ")
    .replace(/[+\uff0b].*$/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  text = text
    .replace(/^(\u30dd\u30a4\u30f3\u30c8\u30b5\u30a4\u30c8|\u30dd\u30a4\u6d3b|\u30e2\u30c3\u30d4\u30fc|moppy|\u516c\u5f0f)\s*/i, "")
    .replace(/\s*(\u30dd\u30a4\u30f3\u30c8\u30b5\u30a4\u30c8|\u30dd\u30a4\u6d3b|\u30e2\u30c3\u30d4\u30fc|moppy|\u516c\u5f0f)$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  text = text
    .replace(/\bsbi\b/gi, "SBI")
    .replace(/\bfx\b/gi, "FX")
    .replace(/paypay/gi, "PayPay")
    .replace(/linemo/gi, "LINEMO")
    .replace(/u-next/gi, "U-NEXT")
    .trim();

  return text || original;
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
      next: { revalidate: 3600 },
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; PoikatsuAI/1.0; +https://poikatu-ai.vercel.app)",
      },
    });

    if (!response.ok) return [];

    const json = await response.json();
    const offers = Array.isArray(json.data) ? (json.data as MoppyOffer[]) : [];

    return offers
      .filter(isVerifiedMoppyOffer)
      .sort((a, b) => Number(b.reward) - Number(a.reward));
  } catch (error) {
    console.error(error);
    return [];
  }
};

const fetchMoppyDetailReward = async (url?: string) => {
  if (!url) return 0;

  try {
    const response = await fetch(url, {
      next: { revalidate: 1800 },
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; PoikatsuAI/1.0; +https://poikatu-ai.vercel.app)",
      },
    });

    if (!response.ok) return 0;

    const html = await response.text();
    const mainHtml =
      html.split("\u30dd\u30a4\u6d3b\u5fdc\u63f4\u30b5\u30fc\u30d3\u30b9")[0]?.split("\u30dd\u30a4\u30f3\u30c8\u306e\u4ea4\u63db\u5148")[0] || html;

    return getReward(stripTags(mainHtml));
  } catch (error) {
    console.error(error);
    return 0;
  }
};

const getUrlKey = (url?: string | null) => {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("site_id") || parsed.searchParams.get("s_id") || url;
  } catch {
    return url;
  }
};

const isStrongNameMatch = (offerName: string, title: string) => {
  const name = normalizeText(offerName);
  const normalizedTitle = normalizeText(title);

  if (!name || !normalizedTitle) return false;
  if (name === normalizedTitle) return true;

  return name.length >= 5 && (normalizedTitle.includes(name) || name.includes(normalizedTitle));
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

const getGoogleRelatedReason = (offerName: string, trendKeywords: string[]) => {
  const words = trendKeywords
    .map((keyword) => toSearchWord(keyword))
    .filter(Boolean)
    .filter((keyword, index, keywords) => keywords.indexOf(keyword) === index)
    .slice(0, 2);

  const relatedWords = words.length > 0 ? words : [toSearchWord(offerName) || offerName];
  const relatedText = relatedWords.map((keyword) => `「${keyword}」`).join("や");

  return `${offerName}は、Googleの検索で${relatedText}も一緒に調べられています。`;
};

const extractQuotedWords = (text?: string | null) => {
  const words: string[] = [];
  const matches = String(text || "").matchAll(/「([^」]+)」/g);

  for (const match of matches) {
    const word = match[1]?.trim();
    if (word && !words.includes(word)) words.push(word);
  }

  return words;
};

const getDisplayReason = (item: RankingItem, offerName: string) => {
  const quotedWords = [
    ...extractQuotedWords(item.description),
    ...extractQuotedWords(item.reason),
  ].filter((word, index, words) => words.indexOf(word) === index);

  const relatedWords = quotedWords.length > 0
    ? quotedWords
    : [item.trend_keyword ?? item.category ?? offerName];

  return getGoogleRelatedReason(offerName, relatedWords);
};

const getSearchKeywordForReason = (item: RankingItem, offerName: string) => {
  const rawTrendKeyword = (item.trend_keyword || "").trim();

  if (rawTrendKeyword && rawTrendKeyword !== BACKFILL_KEYWORD) {
    return toSearchWord(rawTrendKeyword);
  }

  return toSearchWord(offerName) || offerName;
};

const cleanSuggestionHint = (suggestion: string, searchKeyword: string) => {
  let hint = suggestion;
  const keyword = searchKeyword.trim();

  [keyword, keyword.toLowerCase(), keyword.toUpperCase()].forEach((word) => {
    if (word) hint = hint.split(word).join("");
  });

  ["ポイ活", "口コミ", "評判", "おすすめ", "比較", "ランキング"].forEach((word) => {
    hint = hint.split(word).join("");
  });

  return hint.replace(/\s+/g, " ").replace(/　/g, " ").trim();
};

const fetchRelatedSearchWords = async (searchKeyword: string) => {
  const fallbackWords = [
    `${searchKeyword} メリット`,
    `${searchKeyword} デメリット`,
    `${searchKeyword} 口コミ`,
    `${searchKeyword} 評判`,
    `${searchKeyword} ポイント`,
    `${searchKeyword} ポイ活`,
    `${searchKeyword} キャンペーン`,
    `${searchKeyword} 条件`,
    `${searchKeyword} 注意点`,
    `${searchKeyword} お得`,
  ];

  try {
    const url = new URL(GOOGLE_SUGGEST_URL);
    url.searchParams.set("client", "firefox");
    url.searchParams.set("hl", "ja");
    url.searchParams.set("q", searchKeyword);

    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; PoikatsuAI/1.0; +https://poikatu-ai.vercel.app)",
      },
    });

    if (!response.ok) return fallbackWords;

    const json = await response.json();
    const suggestions = Array.isArray(json?.[1]) ? (json[1] as string[]) : [];
    const words = suggestions
      .map((word) => cleanSuggestionHint(word, searchKeyword))
      .filter((word) => word && normalizeText(word) !== normalizeText(searchKeyword));
    const uniqueWords = Array.from(new Set([...words, ...fallbackWords]));

    return uniqueWords.slice(0, 10);
  } catch (error) {
    console.error(error);
    return fallbackWords;
  }
};

const formatRankingItem = async (
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
  const trendKeyword = toSearchWord(
    item.trend_keyword ?? item.offer_name ?? item.category ?? offerName
  );
  const searchKeywordForReason = getSearchKeywordForReason(item, offerName);
  const relatedWords = searchKeywordForReason
    ? await fetchRelatedSearchWords(searchKeywordForReason)
    : [];

  return {
    rank: index + 1,
    offer_name: offerName,
    category: trendKeyword || category,
    trend_keyword: trendKeyword || offerName,
    reward,
    reason: relatedWords.length > 0
      ? getGoogleRelatedReason(offerName, relatedWords)
      : getDisplayReason(item, offerName),
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

        const detailReward = await fetchMoppyDetailReward(matchedOffer.url);
        const verifiedOffer = isRewardAvailable(detailReward)
          ? { ...matchedOffer, reward: detailReward }
          : matchedOffer;

        return isVerifiedMoppyOffer(verifiedOffer)
          ? { item, matchedOffer: verifiedOffer }
          : null;
      })
    );

    const formatted = await Promise.all(
      verifiedPairs
        .filter(
          (pair): pair is { item: RankingItem; matchedOffer: MoppyOffer } =>
            Boolean(pair)
        )
        .slice(0, RANKING_LIMIT)
        .map(({ item, matchedOffer }, index) => {
          return formatRankingItem(item, index, matchedOffer);
        })
    );

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
