import { createClient } from "@supabase/supabase-js";
import { XMLParser } from "fast-xml-parser";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type GenreConfig = {
  category: string;
  keywords: string[];
  rewardMin: number;
  rewardMax: number;
  difficulty: "低" | "中" | "高";
  stability: number;
  primarySiteName: string;
  primarySiteUrl: string;
  secondarySiteName: string;
  secondarySiteUrl: string;
};

const GENRES: GenreConfig[] = [
  {
    category: "クレジットカード",
    keywords: ["楽天カード", "三井住友カード", "JCBカード", "エポスカード", "PayPayカード", "クレカ", "カード"],
    rewardMin: 5000,
    rewardMax: 10000,
    difficulty: "低",
    stability: 1.0,
    primarySiteName: "モッピー",
    primarySiteUrl: "https://pc.moppy.jp/",
    secondarySiteName: "ハピタス",
    secondarySiteUrl: "https://hapitas.jp/",
  },
  {
    category: "証券口座",
    keywords: ["SBI証券", "楽天証券", "松井証券", "NISA", "新NISA", "投資", "証券"],
    rewardMin: 8000,
    rewardMax: 15000,
    difficulty: "中",
    stability: 0.85,
    primarySiteName: "モッピー",
    primarySiteUrl: "https://pc.moppy.jp/",
    secondarySiteName: "ポイントインカム",
    secondarySiteUrl: "https://pointi.jp/",
  },
  {
    category: "通信・回線",
    keywords: ["NURO光", "ドコモ光", "auひかり", "ソフトバンク光", "WiMAX", "光回線", "回線"],
    rewardMin: 15000,
    rewardMax: 30000,
    difficulty: "高",
    stability: 0.7,
    primarySiteName: "モッピー",
    primarySiteUrl: "https://pc.moppy.jp/",
    secondarySiteName: "ハピタス",
    secondarySiteUrl: "https://hapitas.jp/",
  },
  {
    category: "アプリ・ゲーム",
    keywords: ["ポイ活アプリ", "ゲーム", "スマホゲーム", "アプリ", "TikTok Lite"],
    rewardMin: 500,
    rewardMax: 5000,
    difficulty: "低",
    stability: 0.75,
    primarySiteName: "ポイントインカム",
    primarySiteUrl: "https://pointi.jp/",
    secondarySiteName: "モッピー",
    secondarySiteUrl: "https://pc.moppy.jp/",
  },
  {
    category: "無料登録・資料請求",
    keywords: ["無料登録", "資料請求", "無料体験", "U-NEXT", "VOD", "サブスク"],
    rewardMin: 300,
    rewardMax: 3000,
    difficulty: "低",
    stability: 0.8,
    primarySiteName: "ハピタス",
    primarySiteUrl: "https://hapitas.jp/",
    secondarySiteName: "ちょびリッチ",
    secondarySiteUrl: "https://www.chobirich.com/",
  },
  {
    category: "銀行・口座開設",
    keywords: ["楽天銀行", "住信SBIネット銀行", "PayPay銀行", "銀行", "口座開設"],
    rewardMin: 500,
    rewardMax: 3000,
    difficulty: "低",
    stability: 0.85,
    primarySiteName: "モッピー",
    primarySiteUrl: "https://pc.moppy.jp/",
    secondarySiteName: "ハピタス",
    secondarySiteUrl: "https://hapitas.jp/",
  },
  {
    category: "ショッピング",
    keywords: ["楽天市場", "Yahooショッピング", "Qoo10", "Amazon", "通販", "ショッピング"],
    rewardMin: 100,
    rewardMax: 1500,
    difficulty: "低",
    stability: 0.95,
    primarySiteName: "ハピタス",
    primarySiteUrl: "https://hapitas.jp/",
    secondarySiteName: "ECナビ",
    secondarySiteUrl: "https://ecnavi.jp/",
  },
  {
    category: "旅行・予約",
    keywords: ["旅行", "ホテル", "航空券", "楽天トラベル", "じゃらん", "Booking.com"],
    rewardMin: 500,
    rewardMax: 5000,
    difficulty: "中",
    stability: 0.75,
    primarySiteName: "ハピタス",
    primarySiteUrl: "https://hapitas.jp/",
    secondarySiteName: "モッピー",
    secondarySiteUrl: "https://pc.moppy.jp/",
  },
  {
    category: "アンケート",
    keywords: ["アンケート", "モニター", "調査", "ポイントアンケート"],
    rewardMin: 50,
    rewardMax: 1000,
    difficulty: "低",
    stability: 0.7,
    primarySiteName: "ECナビ",
    primarySiteUrl: "https://ecnavi.jp/",
    secondarySiteName: "ワラウ",
    secondarySiteUrl: "https://www.warau.jp/",
  },
  {
    category: "モニター・覆面調査",
    keywords: ["覆面調査", "モニター", "ファンくる", "外食モニター", "商品モニター"],
    rewardMin: 1000,
    rewardMax: 8000,
    difficulty: "中",
    stability: 0.65,
    primarySiteName: "ワラウ",
    primarySiteUrl: "https://www.warau.jp/",
    secondarySiteName: "ポイントタウン",
    secondarySiteUrl: "https://www.pointtown.com/",
  },
];

function normalizeText(text: string) {
  return text.toLowerCase().replace(/\s/g, "");
}

async function getGoogleTrends() {
 try {
    const res = await fetch(
      "https://trends.google.com/trends/trendingsearches/daily/rss?geo=JP",
      {
        cache: "no-store",
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      }
    );

    const xml = await res.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
    });

    const json = parser.parse(xml);

    const items = json?.rss?.channel?.item || [];

    return items
      .map((item: any) => item.title)
      .filter(Boolean)
      .slice(0, 20);

  } catch (error) {
    console.error("Google Trends fetch error:", error);
    return [];
  }
}

function calcTrendScore(genre: GenreConfig, trends: string[]) {
  let score = 0;
  let matchedKeyword = "";

  for (const trend of trends) {
    const normalizedTrend = normalizeText(trend);

    for (const keyword of genre.keywords) {
      const normalizedKeyword = normalizeText(keyword);

      if (
        normalizedTrend.includes(normalizedKeyword) ||
        normalizedKeyword.includes(normalizedTrend)
      ) {
        score += 2;
        if (!matchedKeyword) matchedKeyword = keyword;
      }
    }

    // ゆるいカテゴリ一致
    if (
      genre.category === "クレジットカード" &&
      /カード|クレカ|visa|jcb|mastercard/i.test(trend)
    ) {
      score += 0.7;
      if (!matchedKeyword) matchedKeyword = trend;
    }

    if (
      genre.category === "証券口座" &&
      /証券|投資|nisa|株|fx/i.test(trend)
    ) {
      score += 0.7;
      if (!matchedKeyword) matchedKeyword = trend;
    }

    if (
      genre.category === "通信・回線" &&
      /光|回線|wifi|wimax|スマホ|携帯/i.test(trend)
    ) {
      score += 0.7;
      if (!matchedKeyword) matchedKeyword = trend;
    }
  }

  return {
    score: Math.min(score, 5),
    keyword: matchedKeyword || genre.keywords[0],
  };
}

function calcRewardScore(min: number, max: number) {
  const avg = (min + max) / 2;
  return Math.min(Math.log10(avg + 1) / 5, 1);
}

function calcDifficultyScore(label: "低" | "中" | "高") {
  if (label === "低") return 1;
  if (label === "中") return 0.7;
  return 0.4;
}

function heatLevel(finalScore: number) {
  if (finalScore >= 1.25) return 5;
  if (finalScore >= 1.0) return 4;
  if (finalScore >= 0.75) return 3;
  if (finalScore >= 0.5) return 2;
  return 1;
}

function createReason(
  genre: GenreConfig,
  trendKeyword: string,
  trendScore: number
) {
  if (trendScore >= 2) {
    return `${trendKeyword}に関連する検索トレンドが上昇しています。${genre.category}系のポイ活は報酬レンジも比較的高く、今チェックする価値があります。`;
  }

  if (genre.rewardMax >= 10000) {
    return `${genre.category}は高額報酬になりやすいジャンルです。現在大きな急上昇は弱めですが、定期的に確認する価値があります。`;
  }

  if (genre.difficulty === "低") {
    return `${genre.category}は初心者でも始めやすいジャンルです。大きな報酬だけでなく、手軽さを重視する人に向いています。`;
  }

  return `${genre.category}は話題性・報酬・始めやすさを総合してAIが注目候補として判定しました。`;
}

export async function GET() {
  try {
    const trends = await getGoogleTrends();

    const { data: clickData } = await supabase
  .from("category_clicks")
  .select("category");

const clickCounts: Record<string, number> = {};

for (const row of clickData || []) {
  clickCounts[row.category] =
    (clickCounts[row.category] || 0) + 1;
}
    const scored = GENRES.map((genre) => {
    const trend = calcTrendScore(genre, trends);
    const rewardScore = calcRewardScore(
      genre.rewardMin,
      genre.rewardMax
    );

const difficultyScore = calcDifficultyScore(
  genre.difficulty
);

const stabilityScore = genre.stability;

const clicks = clickCounts[genre.category] || 0;

const clickScore = Math.min(
  Math.log10(clicks + 1) / 3,
  1
);
      
const finalScore =
  trend.score * 0.35 +
  clickScore * 0.30 +
  rewardScore * 0.20 +
  difficultyScore * 0.05 +
  stabilityScore * 0.10;

      return {
        category: genre.category,
        trend_keyword: trend.keyword,

        click_score: clickScore,
        
        reward_min: genre.rewardMin,
        reward_max: genre.rewardMax,
        difficulty_label: genre.difficulty,
        heat_level: heatLevel(finalScore),
        trend_score: trend.score,
        reward_score: rewardScore,
        difficulty_score: difficultyScore,
        stability_score: stabilityScore,
        final_score: finalScore,
        reason: createReason(genre, trend.keyword, trend.score),
        primary_site_name: genre.primarySiteName,
        primary_site_url: genre.primarySiteUrl,
        secondary_site_name: genre.secondarySiteName,
        secondary_site_url: genre.secondarySiteUrl,
        updated_at: new Date().toISOString(),
      };
    });

    const ranked = scored
      .sort((a, b) => b.final_score - a.final_score)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));

    await supabase
      .from("category_scores")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    const { error } = await supabase.from("category_scores").insert(ranked);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      status: "ok",
      count: ranked.length,
      trends,
      data: ranked,
    });
  } catch (error: any) {
    return Response.json(
      {
        status: "error",
        message: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
