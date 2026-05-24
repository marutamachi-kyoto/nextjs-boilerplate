import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TREND_LIMIT = 50;

type TrendRow = {
  word?: string | null;
  score?: number | null;
  category?: string | null;
};

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("trends")
      .select("word, score, category")
      .order("score", { ascending: false })
      .limit(TREND_LIMIT);

    if (error) {
      throw error;
    }

    const words = ((data || []) as TrendRow[])
      .filter((item) => Boolean(item.word))
      .slice(0, TREND_LIMIT)
      .map((item, index) => ({
        word: item.word,
        score: item.score ?? Math.max(100 - index * 2, 10),
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
