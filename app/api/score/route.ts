import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MOPPY_OFFER_URL = "https://poikatu-ai.vercel.app/api/moppy-offer-images";

type MoppyOffer = {
  title: string;
  imageUrl?: string;
  url: string;
  reward: number;
};

type RankingItem = {
  rank?: number | null;
  offer_name?: string | null;
  trend_keyword?: string | null;
  category?: string | null;
  reward?: number | null;
  description?: string | null;
  reason?: string | null;
  primary_site_name?: string | null;
  primary_site_url?: string | null;
  secondary_site_name?: string | null;
  secondary_site_url?: string | null;
  updated_at?: string | null;
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

const fetchMoppyOffers = async () => {
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
    return (Array.isArray(json.data) ? json.data : [])
      .filter((offer: MoppyOffer) => offer.title && isRewardAvailable(offer.reward))
      .sort((a: MoppyOffer, b: MoppyOffer) => Number(b.reward) - Number(a.reward));
  } catch (error) {
    console.error(error);
    return [];
  }
};

const findMoppyOffer = (item: RankingItem, offers: MoppyOffer[]) => {
  const names = [item.offer_name, item.trend_keyword, item.category]
    .map((name) => normalizeText(name))
    .filter(Boolean);

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

const getFallbackReason = (offerName: string, trendKeyword?: string | null) => {
  const keyword = trendKeyword || offerName;
  return `${offerName}は、Googleの検索で「${keyword}」も一緒に調べられています。`;
};

const formatRankingItem = (
  item: RankingItem,
  index: number,
  matchedOffer?: MoppyOffer | null,
  fallbackOffer?: MoppyOffer | null
) => {
  const offer = matchedOffer || fallbackOffer || null;
  const offerName =
    offer?.title ||
    item.offer_name ||
    item.trend_keyword ||
    item.category ||
    `おすすめ案件 ${index + 1}`;
  const reward = offer?.reward ?? item.reward ?? 0;

  return {
    rank: item.rank ?? index + 1,

    offer_name: offerName,

    category: fallbackOffer
      ? item.category ?? "モッピー掲載案件"
      : item.category ?? "その他",
    trend_keyword: item.trend_keyword ?? item.offer_name ?? item.category ?? offerName,

    reward,

    reason:
      fallbackOffer && !matchedOffer
        ? getFallbackReason(offerName, item.trend_keyword ?? item.category)
        : item.description ||
          item.reason ||
          getFallbackReason(offerName, item.trend_keyword ?? item.category),

    primary_site_name: item.primary_site_name ?? "モッピー",
    primary_site_url: item.primary_site_url ?? "https://pc.moppy.jp/",

    secondary_site_name: item.secondary_site_name ?? "ポイントインカム",
    secondary_site_url: item.secondary_site_url ?? "https://pointi.jp/",

    updated_at: item.updated_at,
  };
};

export async function GET() {
  try {
    const [{ data, error }, moppyOffers] = await Promise.all([
      supabase
        .from("rankings")
        .select("*")
        .order("updated_at", { ascending: false })
        .order("rank", { ascending: true })
        .limit(50),
      fetchMoppyOffers(),
    ]);

    if (error) {
      console.error(error);
      return Response.json(
        { error: "ランキング取得に失敗しました" },
        { status: 500 }
      );
    }

    const usedOfferTitles = new Set<string>();
    const sourceItems = (data || []) as RankingItem[];

    const formatted = sourceItems.map((item, index) => {
      const matchedOffer = findMoppyOffer(item, moppyOffers);
      if (matchedOffer) usedOfferTitles.add(normalizeText(matchedOffer.title));

      if (matchedOffer || isRewardAvailable(item.reward)) {
        return formatRankingItem(item, index, matchedOffer);
      }

      const fallbackOffer = moppyOffers.find(
        (offer) => !usedOfferTitles.has(normalizeText(offer.title))
      );

      if (fallbackOffer) usedOfferTitles.add(normalizeText(fallbackOffer.title));

      return formatRankingItem(item, index, null, fallbackOffer);
    });

    return Response.json({
      data: formatted,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
