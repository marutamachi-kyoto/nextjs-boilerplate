import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TREND_LIMIT = 50;
const BACKFILL_KEYWORD = "モッピー確認済み案件";
const MIN_VISIBLE_TRENDS = 8;
const FALLBACK_TREND_SEEDS = [
  "ポイ活",
  "ポイ活 おすすめ",
  "ポイ活 無料",
  "ポイ活 paypay",
  "ポイ活 楽天",
  "ポイ活 クレカ",
  "ポイントサイト",
  "モッピー",
  "ハピタス",
];

type TrendRow = {
  word?: string | null;
  score?: number | null;
  category?: string | null;
};

type RankingRow = {
  offer_name?: string | null;
  trend_keyword?: string | null;
  category?: string | null;
  primary_site_name?: string | null;
};

type VisibleTrend = {
  word: string;
  score: number;
  category: string;
  target_offer_name?: string;
};

const normalizeSpaces = (value: string) => value.replace(/\s+/g, " ").trim();

const normalizeKey = (value: string) =>
  normalizeSpaces(value)
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[・･]/g, "")
    .replace(/[ーｰ−]/g, "-")
    .trim();

const getOfferName = (item: RankingRow) => {
  return (item.offer_name || item.trend_keyword || item.category || "").trim();
};

const isLikelyOfferName = (word: string, rankings: RankingRow[]) => {
  const normalizedWord = normalizeKey(word);
  if (!normalizedWord) return true;

  if (rankings.some((item) => normalizeKey(getOfferName(item)) === normalizedWord)) {
    return true;
  }

  return (
    /[【】※]/.test(word) ||
    /\d{1,3}(,\d{3})*P/i.test(word) ||
    /円以上入金|口座開設後|新規申込専用|無料お試し|会員登録|資料請求/.test(word)
  );
};

const getMatchTerms = (item: RankingRow) => {
  const offerName = getOfferName(item);
  const text = [offerName, item.category, item.primary_site_name]
    .filter(Boolean)
    .join(" ");

  const cleaned = normalizeSpaces(
    text
      .replace(/【[^】]*】/g, " ")
      .replace(/\[[^\]]*\]/g, " ")
      .replace(/（[^）]*）/g, " ")
      .replace(/\([^)]*\)/g, " ")
      .replace(/[「」『』]/g, " ")
  );

  return Array.from(
    new Set(
      [offerName, item.category, cleaned, ...cleaned.split(/[|｜／/、。!！?？\s]+/)]
        .map((value) => normalizeKey(value || ""))
        .filter((value) => value.length >= 2)
    )
  );
};

const TREND_TARGET_RULES = [
  { wordKeys: ["sbi", "nisa"], targetKeys: ["sbi"] },
  { wordKeys: ["amazon"], targetKeys: ["amazon"] },
  { wordKeys: ["u-next", "unext"], targetKeys: ["u-next", "unext"] },
  { wordKeys: ["paypay", "aupay", "au"], targetKeys: ["paypay", "aupay", "au"] },
  { wordKeys: ["moppy", "\u30e2\u30c3\u30d4\u30fc"], targetKeys: ["moppy", "\u30e2\u30c3\u30d4\u30fc"] },
  { wordKeys: ["mercari", "\u30e1\u30eb\u30ab\u30ea", "\u30e1\u30eb\u30ab\u30fc\u30c9"], targetKeys: ["mercari", "\u30e1\u30eb\u30ab\u30ea", "\u30e1\u30eb\u30ab\u30fc\u30c9"] },
  { wordKeys: ["wifi", "wimax"], targetKeys: ["wifi", "wimax"] },
  { wordKeys: ["fx"], targetKeys: ["fx"] },
  { wordKeys: ["jcb"], targetKeys: ["jcb"] },
  { wordKeys: ["dmm"], targetKeys: ["dmm"] },
  { wordKeys: ["rakuten", "\u697d\u5929"], targetKeys: ["rakuten", "\u697d\u5929"] },
  { wordKeys: ["olive"], targetKeys: ["olive"] },
  { wordKeys: ["ahamo"], targetKeys: ["ahamo"] },
  { wordKeys: ["povo"], targetKeys: ["povo"] },
  { wordKeys: ["chocozap"], targetKeys: ["chocozap"] },
];

const findRuleTarget = (word: string, rankings: RankingRow[]) => {
  const trendKey = normalizeKey(word);
  const matchedRule = TREND_TARGET_RULES.find((rule) =>
    rule.wordKeys.some((key) => trendKey.includes(normalizeKey(key)))
  );

  if (!matchedRule) return null;

  return (
    rankings.find((item) => {
      const terms = getMatchTerms(item);
      return matchedRule.targetKeys.some((key) => {
        const targetKey = normalizeKey(key);
        return terms.some((term) => term.includes(targetKey));
      });
    }) || null
  );
};

const findTrendTarget = (word: string, rankings: RankingRow[]) => {
  const trendKey = normalizeKey(word);
  if (trendKey.length < 2) return null;

  const directMatch =
    rankings.find((item) =>
      getMatchTerms(item).some((term) => trendKey.includes(term) || term.includes(trendKey))
    ) || null;

  return directMatch || findRuleTarget(word, rankings);
};

const fetchFallbackTrendRows = async (): Promise<TrendRow[]> => {
  const responses = await Promise.all(
    FALLBACK_TREND_SEEDS.map(async (seed) => {
      try {
        const response = await fetch(
          `https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&gl=jp&q=${encodeURIComponent(
            seed
          )}`,
          { cache: "no-store" }
        );
        const json = await response.json();
        return Array.isArray(json?.[1]) ? (json[1] as string[]) : [];
      } catch {
        return [];
      }
    })
  );

  const seen = new Set<string>();

  return responses
    .flat()
    .map((word) => normalizeSpaces(String(word || "")))
    .filter((word) => {
      const key = normalizeKey(word);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, TREND_LIMIT)
    .map((word, index) => ({
      word,
      score: Math.max(40, 92 - index * 2),
      category: "Google検索候補",
    }));
};

export async function GET() {
  try {
    const [trendResult, rankingResult] = await Promise.all([
      supabase
        .from("trends")
        .select("word, score, category")
        .order("score", { ascending: false })
        .limit(100),
      supabase
        .from("rankings")
        .select("offer_name, trend_keyword, category, primary_site_name")
        .order("rank", { ascending: true })
        .limit(100),
    ]);

    if (trendResult.error) throw trendResult.error;
    if (rankingResult.error) throw rankingResult.error;

    const rankings = (rankingResult.data || []) as RankingRow[];

    const buildVisibleWords = (rows: TrendRow[]) => {
      const seen = new Set<string>();

      return rows
        .map((item) => {
          const word = normalizeSpaces(String(item.word || ""));
          const target = findTrendTarget(word, rankings);

          return {
            word,
            score: Number(item.score || 0),
            category: item.category || "Googleトレンド由来",
            target_offer_name: target ? getOfferName(target) : undefined,
          };
        })
        .filter((item) => item.word && normalizeKey(item.word).length >= 2)
        .filter((item) => !isLikelyOfferName(item.word, rankings))
        .filter((item) => {
          const key = normalizeKey(item.word);
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, TREND_LIMIT) as VisibleTrend[];
    };

    let words = buildVisibleWords((trendResult.data || []) as TrendRow[]);

    if (words.length < MIN_VISIBLE_TRENDS) {
      const fallbackRows = await fetchFallbackTrendRows();
      words = buildVisibleWords([
        ...((trendResult.data || []) as TrendRow[]),
        ...fallbackRows,
      ]);
    }

    return NextResponse.json({ data: words });
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
