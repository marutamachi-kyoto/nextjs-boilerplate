import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SUGGEST_URL = "https://suggestqueries.google.com/complete/search";

const BLOCK_WORDS = [
  "とは",
  "ドリームキャンペーン",
  "キャンペーンコード",
  "問い合わせ",
  "電話",
  "住所",
  "採用",
  "求人",
  "株価",
  "ニュース",
  "事件",
  "炎上",
];

function normalizeText(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/　/g, " ")
    .trim();
}

function isSafeSuggestion(value: string, query: string) {
  const text = normalizeText(value);
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  if (!text) return false;
  if (text.length < 2 || text.length > 48) return false;
  if (!lowerText.includes(lowerQuery) && !lowerQuery.includes(lowerText)) {
    const firstQueryToken = lowerQuery.split(/[\s　]+/)[0];
    if (firstQueryToken && !lowerText.includes(firstQueryToken)) return false;
  }

  return !BLOCK_WORDS.some((word) => lowerText.includes(word.toLowerCase()));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = normalizeText(searchParams.get("q") || "");

  if (!query || query.length > 40) {
    return NextResponse.json({ ok: true, query, suggestions: [] });
  }

  try {
    const url = new URL(SUGGEST_URL);
    url.searchParams.set("client", "firefox");
    url.searchParams.set("hl", "ja");
    url.searchParams.set("q", query);

    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PoikatsuAI/1.0; +https://poikatu-ai.vercel.app)",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ ok: true, query, suggestions: [] });
    }

    const data = await response.json();
    const rawSuggestions = Array.isArray(data?.[1]) ? data[1] : [];
    const suggestions = Array.from(
      new Set(
        rawSuggestions
          .filter((item: unknown): item is string => typeof item === "string")
          .map(normalizeText)
          .filter((item: string) => isSafeSuggestion(item, query))
      )
    ).slice(0, 8);

    return NextResponse.json({ ok: true, query, suggestions });
  } catch (error) {
    console.error("search suggest fetch error:", error);
    return NextResponse.json({ ok: true, query, suggestions: [] });
  }
}
