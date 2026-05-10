import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SERPAPI_KEY = process.env.SERPAPI_KEY!;

type TrendRow = {
  word: string;
  score: number;
  category?: string;
};

function normalizeKeyword(query: string) {
  return query
    .replace(/ポイ\s*活/g, "")
    .replace(/ポイ活/g, "")
    .replace(/\s+/g, "")
    .replace(
      /[^\p{L}\p{N}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー]/gu,
      ""
    .trim();
}

function classifyKeyword(word: string) {
  const gameWords = [
    "ゲーム",
    "戦",
    "三国志",
    "信長",
    "キングダム",
    "ウォー",
    "英雄",
    "伝説",
    "育成",
    "マージ",
    "ディフェンス",
    "ブラウザ",
    "フェイト",
    "トップウォー",
    "グルメジャーニー",
    "モーマンタイム",
    "天地英雄伝",
    "神剣",
    "大江戸",
  ];

  if (gameWords.some((keyword) => word.includes(keyword))) {
    return "ゲーム案件";
  }

  return "一般";
}

function extractRelatedQueries(json: any): TrendRow[] {
  const relatedQueries =
    json?.related_queries?.rising ||
    json?.related_queries?.top ||
    [];

  if (!Array.isArray(relatedQueries)) {
    return [];
  }

  return relatedQueries
    .map((item: any, index: number) => {
      const query = item.query || item.title || item.text || "";
      const value = item.extracted_value || item.value || 100 - index * 3;

      return {
        word: normalizeKeyword(query),
        score: Math.max(70, Math.min(100, Number(value) || 70)),
      };
    })
    .filter((item) => item.word.length > 0);
}

async function fetchAutocomplete(query: string): Promise<TrendRow[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&q=${encodeURIComponent(
      query
    )}`;

    const res = await fetch(url, { cache: "no-store" });
    const json = await res.json();

    const suggestions = Array.isArray(json?.[1]) ? json[1] : [];

    return suggestions
      .map((text: string, index: number) => ({
        word: normalizeKeyword(text),
        score: Math.max(40, 76 - index * 2),
      }))
      .filter((item: TrendRow) => item.word.length > 0);
  } catch {
    return [];
  }
}

function mergeRows(rows: TrendRow[]) {
  const map = new Map<string, TrendRow>();

  for (const row of rows) {
    if (!row.word) continue;

    const existing = map.get(row.word);

    if (!existing || row.score > existing.score) {
      map.set(row.word, row);
    }
  }

  return Array.from(map.values());
}

export async function GET() {
  try {
    const trendsResponse = await fetch(
      `https://serpapi.com/search.json?engine=google_trends&q=${encodeURIComponent(
        "ポイ活"
      )}&geo=JP&hl=ja&data_type=RELATED_QUERIES&api_key=${SERPAPI_KEY}`,
      { cache: "no-store" }
    );

    const trendsJson = await trendsResponse.json();

    const relatedRows = extractRelatedQueries(trendsJson);

    const autocompleteQueries = [
      "ポイ活",
      "ポイ活 おすすめ",
      "ポイ活 アプリ",
      "ポイ活 ゲーム",
      "ポイ活 paypay",
      "ポイ活 楽天",
      "ポイ活 クレカ",
      "ポイントサイト",
      "モッピー",
      "ハピタス",
    ];

    const autocompleteResults = await Promise.all(
      autocompleteQueries.map((query) => fetchAutocomplete(query))
    );

    const autocompleteRows = autocompleteResults.flat();

    let rows = mergeRows([...relatedRows, ...autocompleteRows]);

    if (rows.length === 0) {
      rows = [
        { word: "クレカ", score: 100 },
        { word: "証券口座", score: 94 },
        { word: "楽天カード", score: 88 },
        { word: "SBI証券", score: 82 },
        { word: "光回線", score: 76 },
        { word: "アプリ案件", score: 70 },
        { word: "楽天モバイル", score: 64 },
        { word: "ふるさと納税", score: 58 },
      ];
    }

    rows = rows
      .sort((a, b) => b.score - a.score)
      .slice(0, 30)
      .map((item, index) => ({
        word: item.word,
        score: Math.max(40, 100 - index * 3),
        category: classifyKeyword(item.word),
      }));

    await supabase.from("trends").delete().neq("word", "");

    const { error } = await supabase.from("trends").insert(rows);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      inserted: rows.length,
      trends: rows,
      sources: {
        related_queries: relatedRows.length,
        autocomplete: autocompleteRows.length,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: e.message,
      },
      { status: 500 }
    );
  }
}
