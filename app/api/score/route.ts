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
const RANKING_SOURCE_LIMIT = 180;
const BACKFILL_KEYWORD = "モッピー確認済み案件";

const REWARD_OVERRIDES_BY_SITE_ID: Record<string, number> = {
  "141744": 2500,
  "154516": 650,
  "155068": 17000,
  "159880": 3500,
};

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

const CANONICAL_MOPPY_OFFERS: MoppyOffer[] = [
  {
    title: "SBI証券【FX】",
    url: "https://pc.moppy.jp/ad/detail.php?site_id=155068&track_ref=ts",
    reward: 17000,
  },
  {
    title: "SBI証券 確定拠出年金 iDeCo",
    url: "https://pc.moppy.jp/ad/detail.php?s_id=141744",
    reward: 2500,
  },
  {
    title: "SBI FXトレード",
    url: "https://pc.moppy.jp/ad/detail.php?site_id=159880&track_ref=ts",
    reward: 3500,
  },
  {
    title: "【超還元】DMM TV",
    url: "https://pc.moppy.jp/ad/detail.php?site_id=154516&track_ref=ts",
    reward: 650,
  },
];

const getMoppySiteId = (url?: string | null) => {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("site_id") || parsed.searchParams.get("s_id") || "";
  } catch {
    return "";
  }
};

const getUrlKey = (url?: string | null) => {
  return getMoppySiteId(url) || url || "";
};

const getRewardOverride = (url?: string | null) => {
  const siteId = getMoppySiteId(url);
  return siteId ? REWARD_OVERRIDES_BY_SITE_ID[siteId] || 0 : 0;
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

const toSearchWord = (value?: string | null) => {
  const original = (value || "").trim();
  if (!original) return "";

  const text = original
    .replace(/\u3010[^\u3011]*\u3011/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\uff08[^\uff09]*\uff09/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[\u300c\u300d\u300e\u300f]/g, " ")
    .replace(/[+\uff0b].*$/g, " ")
    .replace(/^(\u30dd\u30a4\u30f3\u30c8\u30b5\u30a4\u30c8|\u30dd\u30a4\u6d3b|\u30e2\u30c3\u30d4\u30fc|moppy|\u516c\u5f0f)\s*/i, "")
    .replace(/\s*(\u30dd\u30a4\u30f3\u30c8\u30b5\u30a4\u30c8|\u30dd\u30a4\u6d3b|\u30e2\u30c3\u30d4\u30fc|moppy|\u516c\u5f0f)$/i, "")
    .replace(/\bsbi\b/gi, "SBI")
    .replace(/\bfx\b/gi, "FX")
    .replace(/paypay/gi, "PayPay")
    .replace(/linemo/gi, "LINEMO")
    .replace(/u-next/gi, "U-NEXT")
    .replace(/\s+/g, " ")
    .trim();

  return text || original;
};

const getCanonicalMoppyOffer = (...values: Array<string | null | undefined>) => {
  const text = values.map(normalizeText).filter(Boolean).join(" ");
  const siteIds = values.map(getMoppySiteId).filter(Boolean);

  if (siteIds.includes("155068") || text.includes("sbi証券fx")) {
    return CANONICAL_MOPPY_OFFERS.find((offer) => getMoppySiteId(offer.url) === "155068") || null;
  }

  if (siteIds.includes("159880") || text.includes("sbifxトレード")) {
    return CANONICAL_MOPPY_OFFERS.find((offer) => getMoppySiteId(offer.url) === "159880") || null;
  }

  if (
    siteIds.includes("141744") ||
    (text.includes("sbi証券") && (text.includes("ideco") || text.includes("確定拠出年金")))
  ) {
    return CANONICAL_MOPPY_OFFERS.find((offer) => getMoppySiteId(offer.url) === "141744") || null;
  }

  if (siteIds.includes("154516") || text.includes("dmmtv")) {
    return CANONICAL_MOPPY_OFFERS.find((offer) => getMoppySiteId(offer.url) === "154516") || null;
  }

  return null;
};

const getMainRewardText = (html: string) => {
  const patterns = [
    /<p[^>]+class=["'][^"']*m-item__point[^"']*["'][\s\S]*?<em[^>]+class=["'][^"']*a-item__point--now[^"']*["'][^>]*>([\s\S]*?)<\/em>/i,
    /<em[^>]+class=["'][^"']*a-item__point--now[^"']*["'][^>]*>([\s\S]*?)<\/em>/i,
    /<p[^>]+class=["'][^"']*m-item__point[^"']*["'][\s\S]*?([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)\s*P[\s\S]*?<\/p>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    const text = match?.[1] ? stripTags(match[1]) : "";
    if (text) return text;
  }

  return "";
};

const getPrimaryDetailReward = (html: string) => {
  const rewardText = getMainRewardText(html);
  if (!/P\s*$/.test(rewardText)) return 0;

  const reward = Number(rewardText.replace(/[^0-9]/g, ""));
  return Number.isFinite(reward) && reward > 0 ? reward : 0;
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
      cache: "no-store",
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; PoikatsuAI/1.0; +https://poikatu-ai.vercel.app)",
      },
    });

    if (!response.ok) return CANONICAL_MOPPY_OFFERS;

    const json = await response.json();
    const offers = Array.isArray(json.data) ? (json.data as MoppyOffer[]) : [];

    return [...CANONICAL_MOPPY_OFFERS, ...offers]
      .map((offer) => ({
        ...offer,
        reward: getRewardOverride(offer.url) || offer.reward,
      }))
      .filter(isVerifiedMoppyOffer)
      .sort((a, b) => Number(b.reward) - Number(a.reward));
  } catch (error) {
    console.error(error);
    return CANONICAL_MOPPY_OFFERS;
  }
};

const fetchMoppyDetailReward = async (url?: string) => {
  if (!url) return 0;

  const overrideReward = getRewardOverride(url);
  if (overrideReward) return overrideReward;

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; PoikatsuAI/1.0; +https://poikatu-ai.vercel.app)",
      },
    });

    if (!response.ok) return 0;

    return getPrimaryDetailReward(await response.text());
  } catch (error) {
    console.error(error);
    return 0;
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
  const canonicalOffer = getCanonicalMoppyOffer(
    item.offer_name,
    item.trend_keyword,
    item.category,
    item.primary_site_url
  );
  if (canonicalOffer) return canonicalOffer;

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
      .map((word) => word.replace(searchKeyword, "").trim())
      .filter(Boolean)
      .filter((word, index, list) => list.indexOf(word) === index);

    return Array.from(new Set([...words, ...fallbackWords])).slice(0, 10);
  } catch (error) {
    console.error(error);
    return fallbackWords;
  }
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

const getSearchKeywordForReason = (item: RankingItem, offerName: string) => {
  const rawTrendKeyword = (item.trend_keyword || "").trim();

  if (rawTrendKeyword && rawTrendKeyword !== BACKFILL_KEYWORD) {
    return toSearchWord(rawTrendKeyword);
  }

  return toSearchWord(offerName) || offerName;
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
  const canonicalOffer = getCanonicalMoppyOffer(offerName, matchedOffer.title, matchedOffer.url);
  const reward = canonicalOffer?.reward || getRewardOverride(matchedOffer.url) || matchedOffer.reward;
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
    reason: getGoogleRelatedReason(offerName, relatedWords),
    image_url: matchedOffer.imageUrl,
    primary_site_name: "モッピー",
    primary_site_url: canonicalOffer?.url || matchedOffer.url,
    secondary_site_name: item.secondary_site_name ?? "ポイントインカム",
    secondary_site_url: item.secondary_site_url ?? "https://pointi.jp/",
    updated_at: item.updated_at,
  };
};

const verifyOffer = async (offer: MoppyOffer) => {
  if (!isVerifiedMoppyOffer(offer)) return null;
  const detailReward = await fetchMoppyDetailReward(offer.url);
  if (!isRewardAvailable(detailReward)) return null;
  return { ...offer, reward: detailReward };
};

export async function GET() {
  try {
    const rankingResult = await supabase
      .from("rankings")
      .select("*")
      .order("updated_at", { ascending: false })
      .order("rank", { ascending: true })
      .limit(RANKING_SOURCE_LIMIT);
    const moppyOffers = await fetchMoppyOffers();

    if (rankingResult.error) {
      console.error(rankingResult.error);
      return Response.json(
        { error: "ランキング取得に失敗しました" },
        { status: 500 }
      );
    }

    const sourceItems = (rankingResult.data || []) as RankingItem[];
    const verifiedPairs = (
      await Promise.all(
        sourceItems.map(async (item) => {
          const matchedOffer = findMoppyOffer(item, moppyOffers);
          if (!matchedOffer) return null;
          const verifiedOffer = await verifyOffer(matchedOffer);
          return verifiedOffer ? { item, matchedOffer: verifiedOffer } : null;
        })
      )
    ).filter(
      (pair): pair is { item: RankingItem; matchedOffer: MoppyOffer } => Boolean(pair)
    );

    const usedUrlKeys = new Set(verifiedPairs.map((pair) => getUrlKey(pair.matchedOffer.url)));
    const latestUpdatedAt = sourceItems.map((item) => item.updated_at).filter(Boolean).sort().reverse()[0];

    for (const offer of moppyOffers) {
      if (verifiedPairs.length >= RANKING_LIMIT) break;
      const urlKey = getUrlKey(offer.url);
      if (!urlKey || usedUrlKeys.has(urlKey)) continue;

      const verifiedOffer = await verifyOffer(offer);
      if (!verifiedOffer) continue;

      usedUrlKeys.add(urlKey);
      verifiedPairs.push({
        item: {
          offer_name: verifiedOffer.title,
          trend_keyword: BACKFILL_KEYWORD,
          category: BACKFILL_KEYWORD,
          updated_at: latestUpdatedAt,
        },
        matchedOffer: verifiedOffer,
      });
    }

    const formatted = await Promise.all(
      verifiedPairs.slice(0, RANKING_LIMIT).map(({ item, matchedOffer }, index) => {
        return formatRankingItem(item, index, matchedOffer);
      })
    );

    return Response.json(
      { data: formatted },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
