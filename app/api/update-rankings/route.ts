import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Category =
  | "アプリ・ゲーム"
  | "通信・回線"
  | "クレジットカード"
  | "証券・投資"
  | "ショッピング"
  | "サブスク"
  | "サービス"
  | "その他";

type TrendInfo = {
  keyword: string;
  traffic?: string;
};

type Offer = {
  offer_name: string;
  category: Category;
  keywords: string[];
  primary_site_name: string;
  primary_site_url: string;
  secondary_site_name: string;
  secondary_site_url: string;
  base_score: number;
};

type MoppySearchResult = {
  trend: TrendInfo;
  offers: string[];
};

type RankingItem = {
  rank: number;
  offer_name: string;
  category: Category;
  score: number;
  final_score: number;
  trend_keyword: string | null;
  trend_traffic: string | null;
  reason: string;
  primary_site_name: string;
  primary_site_url: string;
  secondary_site_name: string;
  secondary_site_url: string;
  updated_at: string;
};

async function getOffers(): Promise<Offer[]> {
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .eq("is_active", true);

  if (error) {
    console.error("offers fetch error", error);
    return [];
  }

  return data.map((item: any) => ({
    offer_name: item.title,

    category:
      item.category?.includes("クレジット")
        ? "クレジットカード"
        : item.category?.includes("証券")
        ? "証券・投資"
        : item.category?.includes("通信")
        ? "通信・回線"
        : item.category?.includes("ゲーム")
        ? "アプリ・ゲーム"
        : item.category?.includes("ショッピング")
        ? "ショッピング"
        : item.category?.includes("サブスク")
        ? "サブスク"
        : "その他",

    keywords: [
      item.title?.toLowerCase() || "",
      ...(item.tags || []),
    ],

    primary_site_name: item.point_site || "モッピー",

    primary_site_url:
      item.url || "https://pc.moppy.jp/",

    secondary_site_name: "ポイントインカム",

    secondary_site_url: "https://pointi.jp/",

    base_score: Math.min(
      100,
      Math.max(
        60,
        Math.floor((item.reward || 1000) / 120)
      )
    ),
  }));
}

async function getTrends(): Promise<TrendInfo[]> {
  try {
    const res = await fetch("https://trends.google.com/trending/rss?geo=JP", {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PoikatsuAI/1.0; +https://poikatu-ai.vercel.app)",
      },
    });

    if (!res.ok) {
      return [];
    }

    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];

    return items
      .map((match) => {
        const item = match[1];

        const titleMatch = item.match(/<title>(.*?)<\/title>/);
        const trafficMatch = item.match(
          /<ht:approx_traffic>(.*?)<\/ht:approx_traffic>/
        );

        return {
          keyword: titleMatch?.[1] ?? "",
          traffic: trafficMatch?.[1],
        };
      })
      .filter((trend) => trend.keyword);
  } catch {
    return [];
  }
}

function extractOfferTitles(html: string): string[] {
  const titlePatterns = [
    /alt="([^"]+)"/g,
    /title="([^"]+)"/g,
    /<h3[^>]*>(.*?)<\/h3>/g,
    /<h2[^>]*>(.*?)<\/h2>/g,
  ];

  const titles = new Set<string>();

  for (const pattern of titlePatterns) {
    const matches = [...html.matchAll(pattern)];

    for (const match of matches) {
      const text = match[1]
        ?.replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();

      if (
        text &&
        text.length >= 2 &&
        text.length <= 60 &&
        !text.includes("モッピー") &&
        !text.includes("ポイント") &&
        !text.includes("広告")
      ) {
        titles.add(text.toLowerCase());
      }
    }
  }

  return [...titles];
}

async function searchMoppyOffers(
  trend: TrendInfo,
  offers: Offer[]
): Promise<MoppySearchResult | null> {
  try {
    const url = `https://pc.moppy.jp/search/?q=${encodeURIComponent(
      trend.keyword
    )}`;

    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PoikatsuAI/1.0; +https://poikatu-ai.vercel.app)",
      },
    });

    if (!res.ok) {
      return null;
    }

    const html = await res.text();

    const noResultTexts = [
      "該当する広告がありません",
      "検索結果がありません",
      "0件",
    ];

    const hasNoResult = noResultTexts.some((text) =>
      html.includes(text)
    );

    if (hasNoResult) {
      return null;
    }

    const extractedTitles = extractOfferTitles(html);

    const matchedOffers = offers
      .filter((offer) => {
        return extractedTitles.some((title) => {
          return (
            title.includes(offer.offer_name.toLowerCase()) ||
            offer.keywords.some((keyword) =>
              title.includes(keyword.toLowerCase())
            )
          );
        });
      })
      .map((offer) => offer.offer_name);

    if (matchedOffers.length === 0) {
      return null;
    }

    return {
      trend,
      offers: matchedOffers,
    };
  } catch {
    return null;
  }
}

function getTrafficBonus(traffic?: string): number {
  if (!traffic) return 0;

  const number = Number(traffic.replace(/[^\d]/g, ""));

  if (number >= 50000) return 10;
  if (number >= 20000) return 8;
  if (number >= 10000) return 6;
  if (number >= 5000) return 4;
  if (number >= 1000) return 2;

  return 0;
}

function applyCategoryBalance(rankings: RankingItem[]): RankingItem[] {
  const categoryCounts: Record<string, number> = {};

  const adjusted = rankings.map((item) => {
    const currentCount = categoryCounts[item.category] ?? 0;

    const penalty = currentCount * 4;

    categoryCounts[item.category] = currentCount + 1;

    return {
      ...item,
      final_score: Math.max(1, item.score - penalty),
    };
  });

  return adjusted.sort((a, b) => b.final_score - a.final_score);
}

export async function GET() {
  try {
    const offers = await getOffers();

    const trends = await getTrends();

    const matchedResults: MoppySearchResult[] = [];

    for (const trend of trends) {
      const result = await searchMoppyOffers(trend, offers);

      if (result) {
        matchedResults.push(result);
      }
    }

    const baseRankings: RankingItem[] = offers.map((offer) => {
      const matchedResult = matchedResults.find((result) =>
        result.offers.includes(offer.offer_name)
      );

      const trend = matchedResult?.trend;

      const isTrendMatched = !!trend;

      const score = Math.max(
        1,
        Math.min(
          100,
          offer.base_score +
            getTrafficBonus(trend?.traffic) +
            (isTrendMatched ? 10 : -12)
        )
      );

      return {
        rank: 0,
        offer_name: offer.offer_name,
        category: offer.category,
        score,
        final_score: score,
        trend_keyword: trend?.keyword ?? null,
        trend_traffic: trend?.traffic ?? null,
        reason: isTrendMatched
          ? `${offer.offer_name} は現在のトレンド検索とモッピー掲載案件の両方に一致しており、特に注目度が高い案件です。`
          : `${offer.offer_name} は定番人気のポイ活案件です。`,
        primary_site_name: offer.primary_site_name,
        primary_site_url: offer.primary_site_url,
        secondary_site_name: offer.secondary_site_name,
        secondary_site_url: offer.secondary_site_url,
        updated_at: new Date().toISOString(),
      };
    });

    const rankings = applyCategoryBalance(baseRankings)
      .slice(0, 50)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));

    await supabase.from("rankings").delete().neq("rank", 0);

    const { error } = await supabase.from("rankings").insert(rankings);

    if (error) {
      return Response.json(
        {
          error: "Supabaseへの保存に失敗しました",
          details: error.message,
        },
        { status: 500 }
      );
    }

    const trendRows = matchedResults
      .flatMap((result) =>
        result.offers.map((offer, offerIndex) => ({
          word: offer,
          score: Math.max(100 - offerIndex * 2, 40),
          category: "ポイ活",
        }))
      )
      .filter(
        (item, index, self) =>
          index === self.findIndex((t) => t.word === item.word)
      )
      .slice(0, 50);

    if (trendRows.length > 0) {
      await supabase.from("trends").delete().neq("word", "");
      await supabase.from("trends").insert(trendRows);
    }

    return Response.json({
      message: "ランキング更新完了",
      count: rankings.length,
      trends_count: trendRows.length,
      trends_source:
        matchedResults.length > 0
          ? "google_trends_precise_moppy_matches"
          : "fallback_offers",
      trends_debug: matchedResults[0]?.trend.keyword ?? null,
      matched_offers_debug: matchedResults[0]?.offers ?? [],
      top_categories: rankings.slice(0, 5).map((r) => r.category),
    });
  } catch {
    return Response.json(
      {
        error: "ランキング更新中にエラーが発生しました",
      },
      { status: 500 }
    );
  }
}
