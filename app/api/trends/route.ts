import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MOPPY_OFFER_URL = "https://poikatu-ai.vercel.app/api/moppy-offer-images";
const TREND_LIMIT = 50;

type MoppyOffer = {
  title: string;
  url: string;
  reward: number;
};

type RankingItem = {
  offer_name?: string | null;
  trend_keyword?: string | null;
  category?: string | null;
};

const normalizeText = (text?: string | null) => {
  return (text || "")
    .toLowerCase()
    .replace(/\u3000/g, "")
    .replace(/\s+/g, "")
    .replace(/\uff08/g, "(")
    .replace(/\uff09/g, ")")
    .replace(/[\u30fb\uff65]/g, "")
    .replace(/[\u30fc\uff70\u2212]/g, "-")
    .replace(/[\[\]\u3010\u3011!\uff01?\uff1f\u3002\u3001\u300c\u300d\u300e\u300f()\uff08\uff09]/g, "")
    .trim();
};

const isRewardAvailable = (reward?: number | null) => {
  return Number.isFinite(Number(reward)) && Number(reward) > 0;
};

const isVerifiedMoppyOffer = (offer?: MoppyOffer | null): offer is MoppyOffer => {
  return Boolean(
    offer?.url &&
      offer.url.includes("pc.moppy.jp/") &&
      !offer.url.includes("/entry/invite.php") &&
      isRewardAvailable(offer.reward)
  );
};

const fetchMoppyOffers = async (): Promise<MoppyOffer[]> => {
  try {
    const response = await fetch(MOPPY_OFFER_URL, {
      next: { revalidate: 3600 },
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; PoikatsuAI/1.0; +https://poikatu-ai.vercel.app)",
      },
    });

    if (!response.ok) return [];

    const json = await response.json();
    const offers = Array.isArray(json.data) ? (json.data as MoppyOffer[]) : [];

    return offers
      .filter(isVerifiedMoppyOffer)
      .sort((a, b) => Number(b.reward) - Number(a.reward));
  } catch (error) {
    console.error(error);
    return [];
  }
};

const findMoppyOffer = (item: RankingItem, offers: MoppyOffer[]) => {
  const names = [item.offer_name, item.trend_keyword, item.category]
    .map((name) => normalizeText(name))
    .filter((name): name is string => Boolean(name));

  if (names.length === 0) return null;

  return (
    offers.find((offer) => {
      const title = normalizeText(offer.title);
      return names.some((name) => title === name);
    }) ||
    offers.find((offer) => {
      const title = normalizeText(offer.title);
      return names.some(
        (name) =>
          name.length >= 3 && (title.includes(name) || name.includes(title))
      );
    }) ||
    null
  );
};

const getTrendWord = (item: RankingItem) => {
  return item.offer_name || item.trend_keyword || item.category || "";
};

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("rankings")
      .select("offer_name, trend_keyword, category, rank")
      .order("updated_at", { ascending: false })
      .order("rank", { ascending: true })
      .limit(TREND_LIMIT);
    const moppyOffers = await fetchMoppyOffers();

    if (error) {
      throw error;
    }

    const words = (data || [])
      .map((item) => {
        const offer = findMoppyOffer(item, moppyOffers);
        return isVerifiedMoppyOffer(offer) ? getTrendWord(item) : "";
      })
      .filter((word): word is string => Boolean(word));
    const usedWords = new Set(words.map((word) => normalizeText(word)));

    for (const offer of moppyOffers) {
      if (words.length >= TREND_LIMIT) break;

      const word = offer.title;
      const normalized = normalizeText(word);
      if (!normalized || usedWords.has(normalized)) continue;

      words.push(word);
      usedWords.add(normalized);
    }

    return NextResponse.json({
      data: words.slice(0, TREND_LIMIT).map((word, index) => ({
        word,
        score: Math.max(100 - index * 2, 10),
        category: "モッピー確認済み",
      })),
    });
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
