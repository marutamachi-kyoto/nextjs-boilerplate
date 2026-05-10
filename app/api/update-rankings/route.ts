import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type TrendRow = {
  word: string;
  score: number;
  category?: string;
};

const CATEGORY_RULES: Record<string, string[]> = {
  クレジットカード: [
    "カード",
    "クレカ",
    "楽天カード",
    "dカード",
    "PayPay",
    "メルカード",
    "三井住友",
    "JCB",
  ],
  証券口座: [
    "証券",
    "SBI",
    "楽天証券",
    "NISA",
    "投資",
    "株",
    "口座",
  ],
  "通信・回線": [
    "回線",
    "光回線",
    "ドコモ",
    "docomo",
    "ahamo",
    "楽天モバイル",
    "UQ",
    "ワイモバイル",
  ],
  ゲーム案件: [
    "ゲーム",
    "信長",
    "三国志",
    "キングダム",
    "ウォー",
    "英雄",
    "伝説",
    "育成",
    "マージ",
    "ディフェンス",
  ],
};

const FALLBACK_KEYWORDS: Record<string, string> = {
  クレジットカード: "楽天カード",
  証券口座: "SBI証券",
  "通信・回線": "楽天モバイル",
  ゲーム案件: "ゲーム案件",
};

async function getTrendRows() {
  const { data, error } = await supabase
    .from("trends")
    .select("word, score, category")
    .order("score", { ascending: false })
    .limit(100);

  if (error) {
    throw error;
  }

  return (data || []) as TrendRow[];
}

function findTrendKeyword(category: string, trends: TrendRow[]) {
  const rules = CATEGORY_RULES[category] || [category];

  const found = trends.find((trend) =>
    rules.some((rule) =>
      trend.word.toLowerCase().includes(rule.toLowerCase())
    )
  );

  return found?.word || FALLBACK_KEYWORDS[category] || category;
}

function getBestOffers(offers: any[]) {
  const map = new Map();

  for (const offer of offers) {
    const key = `${offer.category}-${offer.title}`;
    const current = map.get(key);

    if (!current || offer.reward > current.reward) {
      map.set(key, offer);
    }
  }

  return Array.from(map.values());
}

function calcTrendScore(category: string, trends: TrendRow[]) {
  const rules = CATEGORY_RULES[category] || [category];

  const matched = trends.find((trend) =>
    rules.some((rule) =>
      trend.word.toLowerCase().includes(rule.toLowerCase())
    )
  );

  if (!matched) return 0.3;

  return Math.min(1, matched.score / 100);
}

function calcScore(offer: any, trends: TrendRow[]) {
  const rewardScore = Math.min(1, offer.reward / 30000);
  const trendScore = calcTrendScore(offer.category, trends);
  const easeScore = (6 - (offer.difficulty || 3)) / 5;

  return rewardScore * 0.5 + trendScore * 0.4 + easeScore * 0.1;
}

export async function GET() {
  try {
    const { data: offers, error } = await supabase
      .from("offers")
      .select("*");

    if (error) {
      throw error;
    }

    const trends = await getTrendRows();
    const bestOffers = getBestOffers(offers || []);

    const ranked = bestOffers
      .map((offer) => {
        const trendKeyword = findTrendKeyword(offer.category, trends);

        return {
          offer_title: offer.title,
          category: offer.category,
          point_site: offer.point_site,
          reward: offer.reward,
          url: offer.url,
          tags: offer.tags || [],
          trend_keyword: trendKeyword,
          reward_score: Math.min(1, offer.reward / 30000),
          trend_score: calcTrendScore(offer.category, trends),
          ease_score: (6 - (offer.difficulty || 3)) / 5,
          final_score: calcScore(offer, trends),
        };
      })
      .sort((a, b) => b.final_score - a.final_score)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));

    await supabase.from("rankings").delete().neq("id", "0");

    const { error: insertError } = await supabase
      .from("rankings")
      .insert(ranked);

    if (insertError) {
      throw insertError;
    }

    return Response.json({
      status: "ok",
      count: ranked.length,
      trends_used: trends.length,
      rankings: ranked,
    });
  } catch (e: any) {
    return Response.json(
      {
        status: "error",
        error: e.message,
      },
      { status: 500 }
    );
  }
}
