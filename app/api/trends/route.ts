import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TREND_LIMIT = 50;
const BACKFILL_KEYWORD = "モッピー確認済み案件";

type RankingTrendRow = {
  trend_keyword?: string | null;
  final_score?: number | null;
  category?: string | null;
};

const toDisplayKeyword = (value?: string | null) => {
  const original = (value || "").trim();
  if (!original || original === BACKFILL_KEYWORD) return "";

  return original.replace(/\s+/g, " ").trim();
};

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("rankings")
      .select("trend_keyword, final_score, category")
      .order("rank", { ascending: true })
      .limit(100);

    if (error) {
      throw error;
    }

    const seen = new Set<string>();
    const words = ((data || []) as RankingTrendRow[])
      .map((item, index) => ({
        item,
        index,
        word: toDisplayKeyword(item.trend_keyword),
      }))
      .filter(({ word }) => Boolean(word))
      .filter(({ word }) => {
        const key = word.toLowerCase().replace(/\s+/g, "");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, TREND_LIMIT)
      .map(({ item, index, word }) => ({
        word,
        score: item.final_score ?? Math.max(100 - index * 2, 10),
        category: item.category ?? "Google検索由来",
      }));

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
