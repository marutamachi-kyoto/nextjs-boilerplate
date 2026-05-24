import { NextResponse } from "next/server";

const BASE_URL = "https://poikatu-ai.vercel.app";

const getTrendWord = (item: {
  offer_name?: string | null;
  trend_keyword?: string | null;
  category?: string | null;
}) => {
  return item.offer_name || item.trend_keyword || item.category || "";
};

export async function GET() {
  try {
    const response = await fetch(`${BASE_URL}/api/score`, {
      cache: "no-store",
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; PoikatsuAI/1.0; +https://poikatu-ai.vercel.app)",
      },
    });

    if (!response.ok) {
      throw new Error(`score fetch failed: ${response.status}`);
    }

    const json = await response.json();
    const data = Array.isArray(json.data) ? json.data : [];

    const words = data
      .slice(0, 50)
      .map((item, index) => ({
        word: getTrendWord(item),
        score: Math.max(100 - index * 2, 10),
        category: item.category,
      }))
      .filter((item) => item.word);

    return NextResponse.json({
      data: words,
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
