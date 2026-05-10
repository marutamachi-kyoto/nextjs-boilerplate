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
  | "旅行・予約"
  | "サブスク"
  | "その他";

type TrendInfo = {
  keyword: string;
  traffic?: string;
};

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

// Google Trends取得
async function getTrends(): Promise<TrendInfo[]> {
  const res = await fetch(
    "https://trends.google.com/trends/trendingsearches/daily/rss?geo=JP",
    { cache: "no-store" }
  );

  const xml = await res.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];

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
}

// カテゴリ判定
function detectCategory(keyword: string): Category {
  const text = keyword.toLowerCase();

  if (
    text.includes("ゲーム") ||
    text.includes("アプリ") ||
    text.includes("モンスト") ||
    text.includes("パズドラ") ||
    text.includes("信長") ||
    text.includes("ドラクエ") ||
    text.includes("ポケモン")
  ) {
    return "アプリ・ゲーム";
  }

  if (
    text.includes("ドコモ") ||
    text.includes("au") ||
    text.includes("ソフトバンク") ||
    text.includes("楽天モバイル") ||
    text.includes("sim") ||
    text.includes("光回線") ||
    text.includes("wifi")
  ) {
    return "通信・回線";
  }

  if (
    text.includes("カード") ||
    text.includes("クレカ") ||
    text.includes("visa") ||
    text.includes("mastercard") ||
    text.includes("jcb")
  ) {
    return "クレジットカード";
  }

  if (
    text.includes("証券") ||
    text.includes("投資") ||
    text.includes("nisa") ||
    text.includes("株") ||
    text.includes("fx") ||
    text.includes("仮想通貨") ||
    text.includes("ビットコイン")
  ) {
    return "証券・投資";
  }

  if (
    text.includes("楽天") ||
    text.includes("amazon") ||
    text.includes("セール") ||
    text.includes("買い物") ||
    text.includes("ショッピング")
  ) {
    return "ショッピング";
  }

  if (
    text.includes("旅行") ||
    text.includes("ホテル") ||
    text.includes("航空券") ||
    text.includes("じゃらん") ||
    text.includes("楽天トラベル")
  ) {
    return "旅行・予約";
  }

  if (
    text.includes("netflix") ||
    text.includes("u-next") ||
    text.includes("サブスク") ||
    text.includes("動画") ||
    text.includes("配信")
  ) {
    return "サブスク";
  }

  return "その他";
}

// カテゴリごとの基本スコア
function getBaseScore(category: Category): number {
  const scores: Record<Category, number> = {
    "アプリ・ゲーム": 82,
    "通信・回線": 88,
    "クレジットカード": 90,
    "証券・投資": 86,
    "ショッピング": 76,
    "旅行・予約": 78,
    "サブスク": 74,
    "その他": 65,
  };

  return scores[category];
}

// 検索規模から加点
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

// AI分析用プロフィール
function getRewardProfile(category: string) {
  const profiles: Record<
    string,
    {
      reward: string;
      difficulty: string;
      userIntent: string;
    }
  > = {
    "アプリ・ゲーム": {
      reward: "中〜高単価になりやすい",
      difficulty: "達成条件に差が出やすい",
      userIntent: "短期間でポイントを増やしたいユーザー",
    },
    "通信・回線": {
      reward: "高額還元につながりやすい",
      difficulty: "申込ハードルはやや高め",
      userIntent: "固定費を見直したいユーザー",
    },
    "クレジットカード": {
      reward: "高単価案件が出やすい",
      difficulty: "審査や発行条件の確認が必要",
      userIntent: "まとまったポイントを狙うユーザー",
    },
    "証券・投資": {
      reward: "高額ポイントを狙いやすい",
      difficulty: "口座開設や本人確認が必要",
      userIntent: "資産形成に関心があるユーザー",
    },
    "ショッピング": {
      reward: "少額でも取り組みやすい",
      difficulty: "参加ハードルが低い",
      userIntent: "日常の買い物で得したいユーザー",
    },
    "旅行・予約": {
      reward: "予約金額に応じて還元が伸びやすい",
      difficulty: "利用タイミングに左右されやすい",
      userIntent: "旅行やレジャー予定があるユーザー",
    },
    "サブスク": {
      reward: "無料体験系で狙いやすい",
      difficulty: "解約条件の確認が重要",
      userIntent: "お試し利用でポイントを得たいユーザー",
    },
    "その他": {
      reward: "案件ごとに還元差が大きい",
      difficulty: "条件確認が重要",
      userIntent: "話題性のある案件を探しているユーザー",
    },
  };

  return profiles[category] ?? profiles["その他"];
}

// AI解析文生成
function generateAiDescription(params: {
  category: Category;
  trend: TrendInfo;
  score: number;
  rank: number;
}) {
  const { category, trend, score, rank } = params;
  const profile = getRewardProfile(category);

  const trafficText = trend.traffic
    ? `検索規模は「${trend.traffic}」として観測されており、`
    : "";

  const openings = [
    `AI分析：Google Trendsでは「${trend.keyword}」関連の検索関心が上昇しています。`,
    `AI分析：直近のGoogle Trends上で「${trend.keyword}」が急上昇ワードとして検出されています。`,
    `AI分析：「${trend.keyword}」周辺の検索需要が伸びており、関連ジャンルへの関心が高まっています。`,
  ];

  const trendAnalysis = [
    `${trafficText}短期的な話題性だけでなく、関連カテゴリへの流入増加も期待できる状態です。`,
    `${trafficText}一時的なバズにとどまらず、比較・申込・利用検討につながる検索行動が発生しやすい局面です。`,
    `${trafficText}検索ユーザーの関心が具体的な行動に移りやすく、ポイ活案件との相性が高いと判断しました。`,
  ];

  const categoryAnalysis = [
    `${category}カテゴリは${profile.reward}一方で、${profile.difficulty}という特徴があります。`,
    `${category}案件は${profile.userIntent}との相性がよく、現在の検索トレンドと結びつきやすいジャンルです。`,
    `${category}ジャンルでは、話題化したキーワードをきっかけに案件参加率が上がりやすい傾向があります。`,
  ];

  const scoreAnalysis = [
    `今回は検索上昇度、案件単価、参加ハードル、獲得期待値を総合し、AIスコア${score}点として評価しました。`,
    `AIは「話題性」「収益性」「参加しやすさ」のバランスを重視し、スコア${score}点で判定しています。`,
    `短期トレンドと還元期待値の両面を評価した結果、ランキング${rank}位相当の注目カテゴリと判断しました。`,
  ];

  const closing = [
    `今チェックする価値が高いカテゴリです。`,
    `条件が合えば、効率よくポイント獲得を狙えるタイミングです。`,
    `特に今週は優先的に確認したいジャンルです。`,
  ];

  return [
    pickRandom(openings),
    pickRandom(trendAnalysis),
    pickRandom(categoryAnalysis),
    pickRandom(scoreAnalysis),
    pickRandom(closing),
  ].join("");
}

export async function GET() {
  try {
    const trends = await getTrends();

    if (trends.length === 0) {
      return Response.json(
        { error: "Google Trendsの取得に失敗しました" },
        { status: 500 }
      );
    }

    const categoryMap = new Map<
      Category,
      {
        category: Category;
        trend: TrendInfo;
        score: number;
      }
    >();

    for (const trend of trends) {
      const category = detectCategory(trend.keyword);
      const baseScore = getBaseScore(category);
      const trafficBonus = getTrafficBonus(trend.traffic);

      const score = Math.min(100, baseScore + trafficBonus);

      const existing = categoryMap.get(category);

      if (!existing || score > existing.score) {
        categoryMap.set(category, {
          category,
          trend,
          score,
        });
      }
    }

    const rankings = [...categoryMap.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((item, index) => {
        const rank = index + 1;

        return {
          rank,
          category: item.category,
          score: item.score,
          trend_keyword: item.trend.keyword,
          trend_traffic: item.trend.traffic ?? null,
          description: generateAiDescription({
            category: item.category,
            trend: item.trend,
            score: item.score,
            rank,
          }),
          updated_at: new Date().toISOString(),
        };
      });

    const { error } = await supabase.from("rankings").upsert(rankings, {
      onConflict: "category",
    });

    if (error) {
      console.error(error);
      return Response.json(
        { error: "Supabaseへの保存に失敗しました" },
        { status: 500 }
      );
    }

    return Response.json({
      message: "ランキングを更新しました",
      count: rankings.length,
      rankings,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "ランキング更新中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
