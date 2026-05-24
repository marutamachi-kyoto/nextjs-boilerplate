import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GOOGLE_TRENDS_RSS_URL = "https://trends.google.com/trending/rss?geo=JP";
const GOOGLE_SUGGEST_URL = "https://suggestqueries.google.com/complete/search";
const MOPPY_OFFER_URL = "https://poikatu-ai.vercel.app/api/moppy-offer-images";
const RANKING_LIMIT = 50;
const TREND_CANDIDATE_LIMIT = 200;
const OFFER_SUGGEST_SEED_LIMIT = 80;
const SUGGEST_BATCH_SIZE = 10;

const STATIC_GOOGLE_SUGGEST_SEEDS = [
  "ポイ活",
  "ポイントサイト",
  "モッピー",
  "モッピー 高額案件",
  "モッピー クレジットカード",
  "モッピー 証券",
  "モッピー 銀行",
  "モッピー スマホ",
  "モッピー 無料案件",
  "ポイ活 クレジットカード",
  "ポイ活 証券",
  "ポイ活 銀行",
  "ポイ活 スマホ",
  "ポイ活 アプリ",
  "ポイ活 無料",
  "ポイントサイト クレジットカード",
  "ポイントサイト 証券",
  "ポイントサイト 高額案件",
  "楽天カード ポイ活",
  "PayPayカード ポイ活",
  "SBI証券 ポイ活",
  "楽天銀行 ポイ活",
  "ahamo ポイ活",
  "LINEMO ポイ活",
  "U-NEXT ポイ活",
];

type TrendItem = {
  keyword: string;
  score: number;
};

type MoppyOffer = {
  title: string;
  imageUrl?: string;
  url: string;
  reward: number;
};

type CandidateItem = {
  offer_name: string;
  trend_keyword: string;
  category: string;
  reward: number;
  final_score: number;
  is_registered: boolean;
  confidence_score: number;
  reason: string;
  primary_site_name: string;
  primary_site_url: string;
};

function normalizeText(value?: string | null) {
  return (value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeName(value?: string | null) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[\u3000\s]/g, "")
    .replace(/[\u30fb\uff65\-_\uff5c|\u3010\u3011\[\]\uff08\uff09()\u300c\u300d\u300e\u300f]/g, "")
    .replace(/[\u30fc\uff70\u2212]/g, "-")
    .trim();
}

function isRewardAvailable(reward?: number | null) {
  return Number.isFinite(Number(reward)) && Number(reward) > 0;
}

function isVerifiedMoppyOffer(offer?: MoppyOffer | null): offer is MoppyOffer {
  return Boolean(
    offer?.title &&
      offer?.url &&
      offer.url.includes("pc.moppy.jp/") &&
      !offer.url.includes("/entry/invite.php") &&
      isRewardAvailable(offer.reward)
  );
}

function getCategoryByName(name: string, keyword: string) {
  const text = `${name} ${keyword}`;

  if (/カード|クレカ|クレジット|paypay|楽天カード|三井住友|jcb|visa|master/i.test(text)) {
    return "カード";
  }

  if (/証券|投資|nisa|sbi|楽天証券|口座|fx|暗号資産|仮想通貨|銀行/i.test(text)) {
    return "証券・金融";
  }

  if (/回線|wifi|モバイル|スマホ|sim|楽天モバイル|ahamo|povo|uq|linemo|mineo/i.test(text)) {
    return "通信";
  }

  if (/旅行|ホテル|宿泊|じゃらん|楽天トラベル|一休|航空券/i.test(text)) {
    return "旅行";
  }

  if (/ゲーム|アプリ|漫画|マンガ|電子書籍|動画|u-next|dmm|abema/i.test(text)) {
    return "アプリ・エンタメ";
  }

  if (/ふるさと納税|買い物|ショッピング|楽天市場|yahoo|amazon/i.test(text)) {
    return "ショッピング";
  }

  return "一般";
}

const NG_NON_POIKATSU_WORDS = [
  "対",
  "vs",
  "試合",
  "速報",
  "結果",
  "スタメン",
  "メンバー",
  "ライブ",
  "中継",
  "サッカー",
  "野球",
  "バスケ",
  "ゴルフ",
  "テニス",
  "大相撲",
  "相撲",
  "jリーグ",
  "acl",
  "アル・ナスル",
  "ガンバ大阪",
  "阪神",
  "巨人",
  "ドジャース",
  "大谷",
  "日本代表",
  "芸能",
  "俳優",
  "女優",
  "歌手",
  "アイドル",
  "ドラマ",
  "映画",
  "アニメ",
  "選挙",
  "地震",
  "台風",
  "天気",
];

const POIKATSU_LIKE_WORDS = [
  "カード",
  "クレカ",
  "クレジット",
  "paypay",
  "楽天",
  "sbi",
  "証券",
  "投資",
  "nisa",
  "銀行",
  "口座",
  "fx",
  "仮想通貨",
  "暗号資産",
  "モバイル",
  "スマホ",
  "sim",
  "回線",
  "wifi",
  "光回線",
  "アプリ",
  "ゲーム",
  "漫画",
  "マンガ",
  "電子書籍",
  "動画",
  "vod",
  "u-next",
  "dmm",
  "abema",
  "amazon",
  "yahoo",
  "ショッピング",
  "買い物",
  "旅行",
  "ホテル",
  "宿泊",
  "ふるさと納税",
  "保険",
  "資料請求",
  "買取",
  "査定",
  "ポイ活",
  "ポイント",
  "モッピー",
];

function hasNgNonPoikatsuWord(text: string) {
  const normalized = normalizeText(text).toLowerCase();
  return NG_NON_POIKATSU_WORDS.some((word) => normalized.includes(word.toLowerCase()));
}

function hasPoikatsuLikeWord(text: string) {
  const normalized = normalizeText(text).toLowerCase();
  return POIKATSU_LIKE_WORDS.some((word) => normalized.includes(word.toLowerCase()));
}

function isSafeTrendKeyword(keyword: string) {
  const normalized = normalizeText(keyword);
  if (!normalized) return false;
  if (hasNgNonPoikatsuWord(normalized)) return false;
  return true;
}

function getKeywordTokens(value: string) {
  return normalizeText(value)
    .split(/[\u3000\s\u30fb\uff65\-_\uff5c|\u3010\u3011\[\]\uff08\uff09()\u300c\u300d\u300e\u300f]+/)
    .map((token) => normalizeName(token))
    .filter((token) => token.length >= 3);
}

function isTrendRelatedOffer(trendKeyword: string, offerTitle: string) {
  const trend = normalizeName(trendKeyword);
  const offer = normalizeName(offerTitle);

  if (!trend || !offer) return false;
  if (trend.includes(offer) || offer.includes(trend)) return true;

  const offerTokens = getKeywordTokens(offerTitle);
  if (offerTokens.length === 0) return false;

  const matchedTokens = offerTokens.filter((token) => trend.includes(token));
  if (matchedTokens.length >= 1 && hasPoikatsuLikeWord(`${trendKeyword} ${offerTitle}`)) {
    return true;
  }

  return false;
}

async function getGoogleRssTrends(): Promise<string[]> {
  const res = await fetch(GOOGLE_TRENDS_RSS_URL, {
    cache: "no-store",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; PoikatsuAI/1.0; +https://poikatu-ai.vercel.app)",
    },
  });

  if (!res.ok) return [];

  const xml = await res.text();
  return [...xml.matchAll(/<title>([\s\S]*?)<\/title>/g)]
    .map((match) => normalizeText(match[1]))
    .filter(Boolean)
    .filter((title) => !/Daily Search Trends|検索トレンド/i.test(title))
    .filter(isSafeTrendKeyword);
}

async function getGoogleSuggestKeywords(query: string): Promise<string[]> {
  try {
    const url = `${GOOGLE_SUGGEST_URL}?client=firefox&hl=ja&gl=jp&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PoikatsuAI/1.0; +https://poikatu-ai.vercel.app)",
      },
    });

    if (!res.ok) return [];

    const json = await res.json();
    const suggestions = Array.isArray(json?.[1]) ? (json[1] as string[]) : [];

    return suggestions.map(normalizeText).filter(Boolean).filter(isSafeTrendKeyword);
  } catch (error) {
    console.error(`google suggest fetch error: ${query}`, error);
    return [];
  }
}

async function getGoogleSuggestsInBatches(seeds: string[]) {
  const results: string[] = [];

  for (let i = 0; i < seeds.length; i += SUGGEST_BATCH_SIZE) {
    const batch = seeds.slice(i, i + SUGGEST_BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(getGoogleSuggestKeywords));
    results.push(...batchResults.flat());
  }

  return results;
}

async function getGoogleSearchCandidates(offers: MoppyOffer[]): Promise<TrendItem[]> {
  const rssKeywords = await getGoogleRssTrends();
  const offerSeeds = offers
    .slice()
    .sort((a, b) => Number(b.reward) - Number(a.reward))
    .slice(0, OFFER_SUGGEST_SEED_LIMIT)
    .flatMap((offer) => [offer.title, `${offer.title} ポイ活`, `${offer.title} モッピー`]);
  const seeds = Array.from(new Set([...STATIC_GOOGLE_SUGGEST_SEEDS, ...offerSeeds]));
  const suggestKeywords = await getGoogleSuggestsInBatches(seeds);
  const unique = Array.from(new Set([...rssKeywords, ...suggestKeywords]))
    .filter(isSafeTrendKeyword)
    .slice(0, TREND_CANDIDATE_LIMIT);

  return unique.map((keyword, index) => ({
    keyword,
    score: Math.max(100 - index, 50),
  }));
}

async function getMoppyOffers(): Promise<MoppyOffer[]> {
  try {
    const response = await fetch(MOPPY_OFFER_URL, {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PoikatsuAI/1.0; +https://poikatu-ai.vercel.app)",
      },
    });

    if (!response.ok) return [];

    const json = await response.json();
    const offers = Array.isArray(json.data) ? (json.data as MoppyOffer[]) : [];

    return offers.filter(isVerifiedMoppyOffer);
  } catch (error) {
    console.error("moppy offers fetch error:", error);
    return [];
  }
}

function calculateScore(params: {
  trendScore: number;
  reward: number;
  trendIndex: number;
}) {
  const { trendScore, reward, trendIndex } = params;
  const rewardScore = Math.min(reward / 100, 40);
  const freshnessPenalty = trendIndex * 0.3;

  return Math.round(trendScore + rewardScore + 30 - freshnessPenalty);
}

function generateReason(offerName: string, trendKeyword: string) {
  if (normalizeName(offerName) === normalizeName(trendKeyword)) {
    return `${offerName}は、Google検索で注目されており、モッピーで案件ページと報酬ポイントが確認できた案件です。`;
  }

  return `${offerName}は、Google検索で「${trendKeyword}」と一緒に調べられており、モッピーで案件ページと報酬ポイントが確認できた案件です。`;
}

function buildCandidates(trends: TrendItem[], offers: MoppyOffer[]) {
  const candidates: CandidateItem[] = [];
  const seen = new Set<string>();

  trends.forEach((trend, trendIndex) => {
    const relatedOffers = offers.filter((offer) =>
      isTrendRelatedOffer(trend.keyword, offer.title)
    );

    relatedOffers.forEach((offer) => {
      const key = normalizeName(offer.title);
      if (!key || seen.has(key)) return;
      seen.add(key);

      candidates.push({
        offer_name: offer.title,
        trend_keyword: trend.keyword,
        category: getCategoryByName(offer.title, trend.keyword),
        reward: offer.reward,
        final_score: calculateScore({
          trendScore: trend.score,
          reward: offer.reward,
          trendIndex,
        }),
        is_registered: true,
        confidence_score: 100,
        reason: generateReason(offer.title, trend.keyword),
        primary_site_name: "モッピー",
        primary_site_url: offer.url,
      });
    });
  });

  return candidates
    .sort((a, b) => b.final_score - a.final_score)
    .slice(0, RANKING_LIMIT);
}

async function updateRankings(rows: CandidateItem[]) {
  if (rows.length === 0) return;

  const now = new Date().toISOString();

  await supabase.from("rankings").delete().gte("rank", 0);

  const insertRows = rows.map((item, index) => ({
    rank: index + 1,
    offer_name: item.offer_name,
    trend_keyword: item.trend_keyword,
    category: item.category,
    reward: item.reward,
    final_score: item.final_score,
    reason: item.reason,
    is_registered: item.is_registered,
    confidence_score: item.confidence_score,
    primary_site_name: item.primary_site_name,
    primary_site_url: item.primary_site_url,
    updated_at: now,
  }));

  const { error } = await supabase.from("rankings").insert(insertRows);

  if (error) {
    throw error;
  }
}

async function updateTrends(rows: CandidateItem[]) {
  if (rows.length === 0) return;

  await supabase.from("trends").delete().gte("score", 0);

  const trendRows = rows.slice(0, RANKING_LIMIT).map((item, index) => ({
    word: item.offer_name,
    score: Math.max(100 - index * 2, 10),
    category: item.category,
  }));

  const { error } = await supabase.from("trends").insert(trendRows);

  if (error) {
    throw error;
  }
}

export async function GET() {
  try {
    const offers = await getMoppyOffers();
    const trends = await getGoogleSearchCandidates(offers);
    const candidates = buildCandidates(trends, offers);

    await updateRankings(candidates);
    await updateTrends(candidates);

    return NextResponse.json({
      ok: true,
      message: "rankings and trends updated",
      count: candidates.length,
      trends_count: trends.length,
      moppy_offers_count: offers.length,
      trend_candidate_limit: TREND_CANDIDATE_LIMIT,
      offer_suggest_seed_limit: OFFER_SUGGEST_SEED_LIMIT,
      ranking_limit: RANKING_LIMIT,
      google_trend_rss_and_search_suggest_enabled: true,
      google_trend_only: true,
      moppy_url_and_reward_required: true,
      empty_result_keeps_previous_rankings: true,
      moppy_url_saved_in_rankings: true,
      offers_backfill_enabled: false,
      sample: candidates.slice(0, 5),
    });
  } catch (error: any) {
    console.error("update-rankings error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "unknown error",
      },
      { status: 500 }
    );
  }
}
