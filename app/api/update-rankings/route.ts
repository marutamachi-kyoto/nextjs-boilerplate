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

const OFFERS: Offer[] = [
  {
    offer_name: "楽天モバイル",
    category: "通信・回線",
    keywords: ["楽天モバイル", "楽天", "三木谷", "スマホ", "sim"],
    primary_site_name: "モッピー",
    primary_site_url: "https://pc.moppy.jp/",
    secondary_site_name: "ポイントインカム",
    secondary_site_url: "https://pointi.jp/",
    base_score: 92,
  },
  {
    offer_name: "信長の野望 覇道",
    category: "アプリ・ゲーム",
    keywords: ["信長の野望", "信長", "覇道", "ゲーム"],
    primary_site_name: "モッピー",
    primary_site_url: "https://pc.moppy.jp/",
    secondary_site_name: "ワラウ",
    secondary_site_url: "https://www.warau.jp/",
    base_score: 90,
  },
  {
    offer_name: "三井住友カード（NL）",
    category: "クレジットカード",
    keywords: ["三井住友カード", "カード", "クレカ", "visa"],
    primary_site_name: "モッピー",
    primary_site_url: "https://pc.moppy.jp/",
    secondary_site_name: "ハピタス",
    secondary_site_url: "https://hapitas.jp/",
    base_score: 89,
  },
  {
    offer_name: "PayPayカード",
    category: "クレジットカード",
    keywords: ["paypay", "PayPayカード", "カード"],
    primary_site_name: "モッピー",
    primary_site_url: "https://pc.moppy.jp/",
    secondary_site_name: "ハピタス",
    secondary_site_url: "https://hapitas.jp/",
    base_score: 87,
  },
  {
    offer_name: "TikTok Lite",
    category: "アプリ・ゲーム",
    keywords: ["tiktok", "TikTok Lite", "アプリ"],
    primary_site_name: "モッピー",
    primary_site_url: "https://pc.moppy.jp/",
    secondary_site_name: "ワラウ",
    secondary_site_url: "https://www.warau.jp/",
    base_score: 86,
  },
  {
    offer_name: "楽天証券",
    category: "証券・投資",
    keywords: ["楽天証券", "証券", "nisa", "投資"],
    primary_site_name: "ハピタス",
    primary_site_url: "https://hapitas.jp/",
    secondary_site_name: "ポイントインカム",
    secondary_site_url: "https://pointi.jp/",
    base_score: 85,
  },
  {
    offer_name: "楽天市場",
    category: "ショッピング",
    keywords: ["楽天市場", "楽天", "買い物", "セール"],
    primary_site_name: "ポイントインカム",
    primary_site_url: "https://pointi.jp/",
    secondary_site_name: "モッピー",
    secondary_site_url: "https://pc.moppy.jp/",
    base_score: 84,
  },
  {
    offer_name: "住信SBIネット銀行",
    category: "その他",
    keywords: ["住信sbi", "銀行", "口座"],
    primary_site_name: "モッピー",
    primary_site_url: "https://pc.moppy.jp/",
    secondary_site_name: "ワラウ",
    secondary_site_url: "https://www.warau.jp/",
    base_score: 83,
  },
  {
    offer_name: "Amazon Prime",
    category: "サブスク",
    keywords: ["amazon", "prime", "プライム", "サブスク"],
    primary_site_name: "モッピー",
    primary_site_url: "https://pc.moppy.jp/",
    secondary_site_name: "ポイントインカム",
    secondary_site_url: "https://pointi.jp/",
    base_score: 82,
  },
  {
    offer_name: "マージマンション",
    category: "アプリ・ゲーム",
    keywords: ["マージマンション", "ゲーム", "アプリ"],
    primary_site_name: "モッピー",
    primary_site_url: "https://pc.moppy.jp/",
    secondary_site_name: "ワラウ",
    secondary_site_url: "https://www.warau.jp/",
    base_score: 81,
  },
  {
    offer_name: "U-NEXT",
    category: "サブスク",
    keywords: ["u-next", "動画", "配信", "サブスク"],
    primary_site_name: "ハピタス",
    primary_site_url: "https://hapitas.jp/",
    secondary_site_name: "ワラウ",
    secondary_site_url: "https://www.warau.jp/",
    base_score: 80,
  },
];

async function getTrends(): Promise<TrendInfo[]> {
  try {
    const res = await fetch(
      "https://trends.google.com/trends/trendingsearches/daily/rss?geo=JP",
      {
        cache: "no-store",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; PoikatsuAI/1.0; +https://poikatu-ai.vercel.app)",
        },
      }
    );

    if (!res.ok) return [];

    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
　　console.log(xml);
    return items
      .map((match) => {
        const item = match[1];

        const titleMatch = item.match(
          /<title><!\[CDATA\[(.*?)\]\]><\/title>/
        );

        const trafficMatch = item.match(
          /<ht:approx_traffic><!\[CDATA\[(.*?)\]\]><\/ht:approx_traffic>/
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

function getMatchedTrend(offer: Offer, trends: TrendInfo[]) {
  const matched = trends.find((trend) => {
    const text = trend.keyword.toLowerCase();

    return offer.keywords.some((keyword) =>
      text.includes(keyword.toLowerCase())
    );
  });

  return (
    matched ?? {
      keyword: offer.offer_name,
      traffic: "取得中",
    }
  );
}

export async function GET() {
  try {
    const trends = await getTrends();

    const rankingTrendSource =
      trends.length > 0
        ? trends
        : OFFERS.map((offer) => ({
            keyword: offer.offer_name,
            traffic: "取得中",
          }));

    const rankings = OFFERS.map((offer) => {
      const trend = getMatchedTrend(offer, rankingTrendSource);

      const score = Math.min(
        100,
        offer.base_score + getTrafficBonus(trend.traffic)
      );

      return {
        rank: 0,
        offer_name: offer.offer_name,
        category: offer.category,
        score,
        final_score: score,
        trend_keyword: trend.keyword,
        trend_traffic: trend.traffic ?? null,
        reason: `${offer.offer_name} は現在注目度が高く、ポイ活案件として評価されています。`,
        primary_site_name: offer.primary_site_name,
        primary_site_url: offer.primary_site_url,
        secondary_site_name: offer.secondary_site_name,
        secondary_site_url: offer.secondary_site_url,
        updated_at: new Date().toISOString(),
      };
    })
      .sort((a, b) => b.score - a.score)
      .slice(0, 30)
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

    const trendRows = trends.slice(0, 30).map((trend, index) => ({
      word: trend.keyword,
      score: Math.max(100 - index * 3, 40),
      category: "一般",
    }));

    if (trendRows.length > 0) {
      await supabase.from("trends").delete().neq("word", "");
      await supabase.from("trends").insert(trendRows);
    }

    return Response.json({
      message: "ランキング更新完了",
      count: rankings.length,
      trends_count: trendRows.length,
      trends_source: trends.length > 0 ? "google_trends" : "not_updated",
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
