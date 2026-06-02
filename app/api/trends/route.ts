import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TREND_LIMIT = 50;
const BACKFILL_KEYWORD = "モッピー確認済み案件";

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

const getMatchTerms = (item: RankingRow) => {
  const offerName = getOfferName(item);
  const trendKeyword =
    item.trend_keyword && item.trend_keyword !== BACKFILL_KEYWORD
      ? item.trend_keyword
      : "";
  const text = [offerName, trendKeyword, item.category, item.primary_site_name]
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
      [offerName, trendKeyword, item.category, cleaned, ...cleaned.split(/[|｜／/、。!！?？\s]+/)]
        .map((value) => normalizeKey(value || ""))
        .filter((value) => value.length >= 2)
    )
  );
};

const findTrendTarget = (word: string, rankings: RankingRow[]) => {
  const trendKey = normalizeKey(word);
  if (trendKey.length < 2) return null;

  return (
    rankings.find((item) =>
      getMatchTerms(item).some((term) => trendKey.includes(term) || term.includes(trendKey))
    ) || null
  );
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
    const seen = new Set<string>();

    const words = ((trendResult.data || []) as TrendRow[])
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
      .filter((item) => item.target_offer_name)
      .filter((item) => item.word && normalizeKey(item.word).length >= 2)
      .filter((item) => {
        const key = normalizeKey(item.word);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, TREND_LIMIT);

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
