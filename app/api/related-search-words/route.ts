import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BACKFILL_KEYWORD = "モッピー確認済み案件";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RankingItem = {
  category: string;
  rank: number;
  trend_keyword: string;
  offer_name?: string;
};

const normalizeText = (text?: string) => {
  return (text || "")
    .toLowerCase()
    .replace(/\u3000/g, "")
    .replace(/\s+/g, "")
    .replace(/\uff08/g, "(")
    .replace(/\uff09/g, ")")
    .replace(/[\u30fb\uff65]/g, "")
    .replace(/[\u30fc\uff70\u2212]/g, "-")
    .trim();
};

const normalizeSpaces = (value: string) => value.replace(/\s+/g, " ").trim();

const OFFER_KEYWORD_RULES: Array<[RegExp, string]> = [
  [/出光カード/i, "出光カード"],
  [/apollostation|アポロステーション/i, "出光カード"],
  [/SBI\s*FX|SBI.*FX/i, "SBI FXトレード"],
  [/SBI.*証券/i, "SBI証券"],
  [/楽天証券/, "楽天証券"],
  [/楽天銀行/, "楽天銀行"],
  [/楽天モバイル/, "楽天モバイル"],
  [/au\s*ひかり|auひかり/i, "auひかり"],
  [/ahamo/i, "ahamo"],
  [/povo/i, "povo"],
  [/U-?NEXT/i, "U-NEXT"],
  [/coin\s*together/i, "coin together"],
  [/JP\s*リターンズ|JPリターンズ/i, "JPリターンズ"],
  [/プロパティエージェント/, "プロパティエージェント"],
  [/CREAL/i, "CREAL"],
  [/チクフル/, "チクフル不動産投資"],
  [/CAMEL/i, "CAMEL"],
  [/モバレコ\s*Air|モバレコAir/i, "モバレコAir"],
  [/ソフトバンク\s*Air|SoftBank\s*Air/i, "ソフトバンクAir"],
  [/ドコモ\s*mini|ドコモミニ/i, "ドコモmini"],
  [/グローバル\s*WiFi|グローバルWiFi/i, "グローバルWiFi"],
  [
    /アメリカン.*エキスプレス.*ゴールド.*プリファード/i,
    "アメリカン・エキスプレス・ゴールド・プリファード・カード",
  ],
];

const BROAD_SEARCH_PREFIXES = [
  "ポイ活",
  "ポイントサイト",
  "モッピー",
  "無料 ポイ活",
  "無料でできる ポイ活",
  "お金をかけない ポイ活",
];

const EXCLUDED_SUGGESTION_WORDS = [
  "ログイン",
  "login",
  "マイページ",
  "会員",
  "電話",
  "問い合わせ",
];

const getOfferName = (item: RankingItem) => {
  return item.offer_name || item.trend_keyword || item.category;
};

const toSearchLikeOfferKeyword = (value?: string) => {
  const original = normalizeSpaces(value || "");
  if (!original) return "";

  const matchedRule = OFFER_KEYWORD_RULES.find(([pattern]) => pattern.test(original));
  if (matchedRule) return matchedRule[1];

  const cleaned = normalizeSpaces(
    original
      .replace(/【[^】]*】/g, " ")
      .replace(/\[[^\]]*\]/g, " ")
      .replace(/（[^）]*）/g, " ")
      .replace(/\([^)]*\)/g, " ")
      .replace(/[「」『』★☆]/g, " ")
      .replace(/[+＋].*$/g, " ")
      .replace(/^[\s_・:：-]*(PR|超還元|高還元|無料|公式)\s*/i, " ")
      .replace(/年収\s*[0-9０-９,，]+\s*万円以上/gi, " ")
      .replace(/[0-9０-９,，]+\s*P/gi, " ")
      .replace(/無料(個別)?(WEB)?面談/gi, " ")
      .replace(/個別面談|WEB面談|ご相談なら|ご相談|投資完了|新規|のみ対象/gi, " ")
      .replace(/^(ポイントサイト|ポイ活|モッピー|moppy|公式)\s*/i, "")
      .replace(/\s*(ポイントサイト|ポイ活|モッピー|moppy|公式)$/i, "")
      .replace(/[＿_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );

  if (!cleaned) return original;

  const firstPhrase = cleaned
    .split(/[｜|／/、。!！?？]/)
    .map((part) => part.trim())
    .find(Boolean);

  return firstPhrase || cleaned;
};

const isBroadSearchSeed = (keyword: string) => {
  const normalized = normalizeText(keyword);
  return BROAD_SEARCH_PREFIXES.some((prefix) => normalized.startsWith(normalizeText(prefix)));
};

const shouldUseSuggestion = (word: string, searchKeyword: string) => {
  const normalizedWord = normalizeText(word);
  const normalizedSearchKeyword = normalizeText(searchKeyword);

  if (!word.trim()) return false;
  if (normalizedWord === normalizedSearchKeyword) return false;

  return !EXCLUDED_SUGGESTION_WORDS.some((excluded) =>
    normalizedWord.includes(normalizeText(excluded))
  );
};

const getSearchKeyword = (item: RankingItem) => {
  const keyword = (item.trend_keyword || "").trim();
  const offerKeyword = toSearchLikeOfferKeyword(getOfferName(item));

  if (!keyword || keyword === BACKFILL_KEYWORD) return offerKeyword || getOfferName(item);

  const trendKeyword = toSearchLikeOfferKeyword(keyword);
  if (
    isBroadSearchSeed(keyword) &&
    offerKeyword &&
    !normalizeText(keyword).includes(normalizeText(offerKeyword))
  ) {
    return offerKeyword;
  }

  return trendKeyword || offerKeyword || keyword;
};

const getRelatedSearchWords = async (searchKeyword: string) => {
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
    const response = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&q=${encodeURIComponent(
        searchKeyword
      )}`,
      {
        cache: "no-store",
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; PoikatsuAI/1.0; +https://poikatu-ai.vercel.app)",
        },
      }
    );

    if (!response.ok) return fallbackWords;

    const buffer = await response.arrayBuffer();
    const text = new TextDecoder("shift_jis").decode(buffer);
    const json = JSON.parse(text);
    const suggestions = Array.isArray(json?.[1]) ? (json[1] as string[]) : [];
    const words = suggestions
      .map((word) => word.trim())
      .filter((word) => shouldUseSuggestion(word, searchKeyword));

    return Array.from(new Set([...words, ...fallbackWords])).slice(0, 10);
  } catch (error) {
    console.error("related search words fetch error:", error);
    return fallbackWords;
  }
};

const getRankingItem = async (offer: string) => {
  const { data, error } = await supabase
    .from("rankings")
    .select("category, rank, trend_keyword, offer_name")
    .order("rank", { ascending: true })
    .limit(100);

  if (error || !data) return null;

  return (
    data.find((item) => {
      const offerName = getOfferName(item);
      return (
        normalizeText(offerName) === normalizeText(offer) ||
        normalizeText(item.trend_keyword) === normalizeText(offer) ||
        normalizeText(item.category) === normalizeText(offer)
      );
    }) || null
  );
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const offer = normalizeSpaces(searchParams.get("offer") || "");

  if (!offer || offer.length > 120) {
    return NextResponse.json({ ok: true, offer, searchKeyword: offer, words: [] });
  }

  const item = await getRankingItem(offer);
  const fallbackItem: RankingItem = {
    category: "ポイ活",
    rank: 0,
    trend_keyword: offer,
    offer_name: offer,
  };
  const displayItem = item || fallbackItem;
  const searchKeyword = getSearchKeyword(displayItem);
  const words = await getRelatedSearchWords(searchKeyword);

  return NextResponse.json({
    ok: true,
    offer: getOfferName(displayItem),
    searchKeyword,
    words,
  });
}
