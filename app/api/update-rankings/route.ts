import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MOPPY_OFFERS_URL = "https://poikatu-ai.vercel.app/api/moppy-offer-images";
const RANKING_LIMIT = 50;

type MoppyOffer = {
  title: string;
  imageUrl?: string;
  url: string;
  reward: number;
};

type RankingRow = {
  category: string;
  rank: number;
  trend_keyword: string;
  offer_name: string;
  reward: number;
  image_url: string | null;
  final_score: number;
  reason: string;
  primary_site_name: string;
  primary_site_url: string;
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function normalizeText(value?: string | null) {
  return (value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function isFreeOffer(title: string) {
  const text = title.toLowerCase();
  return (
    text.includes("無料") ||
    text.includes("トライアル") ||
    text.includes("資料請求") ||
    text.includes("会員登録") ||
    text.includes("アプリ") ||
    text.includes("インストール") ||
    text.includes("povo")
  );
}

function isEasyOffer(title: string) {
  const text = title.toLowerCase();
  return (
    text.includes("口座") ||
    text.includes("カード") ||
    text.includes("証券") ||
    text.includes("申込") ||
    text.includes("新規") ||
    text.includes("登録") ||
    isFreeOffer(title)
  );
}

function getCategory(offer: MoppyOffer) {
  if (offer.reward >= 3000) return "高額報酬";
  if (isFreeOffer(offer.title)) return "無料でできる";
  if (isEasyOffer(offer.title)) return "申し込むだけでOK";
  return "申し込むだけでOK";
}

function getReason(offer: MoppyOffer) {
  const labels = [
    isEasyOffer(offer.title) ? "申し込むだけでOK" : "",
    isFreeOffer(offer.title) ? "無料でできる" : "",
    offer.reward >= 3000 ? "高額報酬" : "",
  ].filter(Boolean);

  return labels.length > 0 ? labels.join(" / ") : "申し込むだけでOK";
}

function getScore(offer: MoppyOffer) {
  const rewardScore = Math.min(offer.reward / 100, 70);
  const freeScore = isFreeOffer(offer.title) ? 24 : 0;
  const easyScore = isEasyOffer(offer.title) ? 18 : 0;
  const imageScore = offer.imageUrl ? 8 : 0;

  return Math.round(rewardScore + freeScore + easyScore + imageScore);
}

async function fetchMoppyOffers() {
  const response = await fetch(`${MOPPY_OFFERS_URL}?refresh=${Date.now()}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`moppy offers fetch failed: ${response.status}`);

  const json = await response.json();
  return (Array.isArray(json.data) ? json.data : [])
    .map((offer: MoppyOffer) => ({
      title: normalizeText(offer.title),
      imageUrl: offer.imageUrl,
      url: offer.url,
      reward: Number(offer.reward || 0),
    }))
    .filter((offer: MoppyOffer) => offer.title && offer.url && offer.reward > 0);
}

function buildRows(offers: MoppyOffer[]): RankingRow[] {
  const seen = new Set<string>();

  return offers
    .map((offer) => ({ offer, score: getScore(offer) }))
    .sort((a, b) => b.score - a.score || b.offer.reward - a.offer.reward)
    .filter(({ offer }) => {
      const key = offer.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, RANKING_LIMIT)
    .map(({ offer, score }, index) => ({
      category: getCategory(offer),
      rank: index + 1,
      trend_keyword: getReason(offer),
      offer_name: offer.title,
      reward: offer.reward,
      image_url: offer.imageUrl || null,
      final_score: score,
      reason: getReason(offer),
      primary_site_name: "モッピー",
      primary_site_url: offer.url,
    }));
}

export async function GET() {
  try {
    const offers = await fetchMoppyOffers();
    const rows = buildRows(offers);

    if (rows.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "no moppy offers found; existing rankings were kept",
        },
        { status: 502 }
      );
    }

    const supabase = getSupabase();
    await supabase.from("rankings").delete().gte("rank", 0);

    const { error } = await supabase.from("rankings").insert(rows);
    if (error) throw error;

    return NextResponse.json({
      ok: true,
      message: "rankings updated from moppy offers",
      count: rows.length,
      google_trends_removed: true,
      criteria: ["申し込むだけでOK", "無料でできる", "高額報酬"],
    });
  } catch (error: any) {
    console.error("update-rankings error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "unknown error",
      },
      { status: 500 }
    );
  }
}
