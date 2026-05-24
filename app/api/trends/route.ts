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

const toDisplayKeyword = (value?: string | null) => {
  const original = (value || "").trim();
  if (!original) return "";

  let text = original
    .replace(/【[^】]*】/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/（[^）]*）/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[「」『』]/g, " ")
    .replace(/[+＋].*$/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  text = text
    .replace(/^(ポイントサイト|ポイ活|モッピー|moppy|公式)\s*/i, "")
    .replace(/\s*(ポイントサイト|ポイ活|モッピー|moppy|公式)$/i, "")
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

    const seen = new Set<string>();
    const words = ((data || []) as TrendRow[])
      .map((item, index) => ({ item, index, word: toDisplayKeyword(item.word) }))
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
