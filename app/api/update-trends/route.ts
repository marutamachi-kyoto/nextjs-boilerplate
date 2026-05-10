import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SERPAPI_KEY = process.env.SERPAPI_KEY!;

export async function GET() {
  try {
    const response = await fetch(
      `https://serpapi.com/search.json?engine=google_trends&q=ポイ活&api_key=${SERPAPI_KEY}`
    );

    const json = await response.json();

    const keywords = [
      "クレカ",
      "証券口座",
      "楽天カード",
      "SBI証券",
      "光回線",
      "アプリ案件",
      "楽天モバイル",
      "ふるさと納税",
    ];

    await supabase.from("trends").delete().neq("word", "");

    const rows = keywords.map((word, index) => ({
      word,
      score: 100 - index * 6,
    }));

    const { error } = await supabase.from("trends").insert(rows);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      inserted: rows.length,
      trends: rows,
      serpapi: json,
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
