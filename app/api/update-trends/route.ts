import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SERPAPI_KEY = process.env.SERPAPI_KEY!;

function normalizeKeyword(query: string) {
  return query
    .replace(/ポイ\s*活/g, "")
    .replace(/ポイ活/g, "")
    .replace(/\s+/g, "")
    .replace(/[　]/g, "")
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

function extractRelatedQueries(json: any) {
  const relatedQueries =
    json?.related_queries?.rising ||
    json?.related_queries?.top ||
    json?.related_queries ||
    [];

  if (!Array.isArray(relatedQueries)) {
    return [];
  }

  return relatedQueries
    .map((item: any) => {
      const query = item.query || item.title || item.text || "";
      const value = item.extracted_value || item.value || 50;

      return {
        word: normalizeKeyword(query),
        score: Number(value) || 50,
      };
    })
    .filter((item: { word: string; score: number }) => item.word.length > 0)
    .filter((item: { word: string; score: number }) => item.word !== "ポイ活");
}

export async function GET() {
  try {
    const response = await fetch(
      `https://serpapi.com/search.json?engine=google_trends&q=${encodeURIComponent(
        "ポイ活"
      )}&geo=JP&hl=ja&data_type=RELATED_QUERIES&api_key=${SERPAPI_KEY}`,
      { cache: "no-store" }
    );

    const json = await response.json();

    let rows = extractRelatedQueries(json);

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
      .slice(0, 10)
      .map((item, index) => ({
        word: item.word,
        score: Math.max(50, 100 - index * 6),
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
