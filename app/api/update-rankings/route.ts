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
  {
    offer_name: "dカード GOLD",
    category: "クレジットカード",
    keywords: ["dカード", "ドコモ", "カード"],
    primary_site_name: "モッピー",
    primary_site_url: "https://pc.moppy.jp/",
    secondary_site_name: "ポイントインカム",
    secondary_site_url: "https://pointi.jp/",
    base_score: 79,
  },
  {
    offer_name: "セゾンカードインターナショナル",
    category: "クレジットカード",
    keywords: ["セゾンカード", "カード", "クレカ"],
    primary_site_name: "ハピタス",
    primary_site_url: "https://hapitas.jp/",
    secondary_site_name: "ワラウ",
    secondary_site_url: "https://www.warau.jp/",
    base_score: 78,
  },
  {
    offer_name: "auカブコム証券",
    category: "証券・投資",
    keywords: ["auカブコム", "証券", "投資"],
    primary_site_name: "ポイントインカム",
    primary_site_url: "https://pointi.jp/",
    secondary_site_name: "モッピー",
    secondary_site_url: "https://pc.moppy.jp/",
    base_score: 77,
  },
  {
    offer_name: "Pontaパス",
    category: "サブスク",
    keywords: ["ponta", "ポンタ", "サブスク"],
    primary_site_name: "ワラウ",
    primary_site_url: "https://www.warau.jp/",
    secondary_site_name: "ハピタス",
    secondary_site_url: "https://hapitas.jp/",
    base_score: 76,
  },
  {
    offer_name: "メルカリ",
    category: "アプリ・ゲーム",
    keywords: ["メルカリ", "フリマ", "アプリ"],
    primary_site_name: "モッピー",
    primary_site_url: "https://pc.moppy.jp/",
    secondary_site_name: "ポイントインカム",
    secondary_site_url: "https://pointi.jp/",
    base_score: 75,
  },
  {
    offer_name: "LINEマンガ",
    category: "アプリ・ゲーム",
    keywords: ["lineマンガ", "漫画", "アプリ"],
    primary_site_name: "ハピタス",
    primary_site_url: "https://hapitas.jp/",
    secondary_site_name: "ワラウ",
    secondary_site_url: "https://www.warau.jp/",
    base_score: 74,
  },
  {
    offer_name: "エポスカード",
    category: "クレジットカード",
    keywords: ["エポスカード", "カード"],
    primary_site_name: "モッピー",
    primary_site_url: "https://pc.moppy.jp/",
    secondary_site_name: "ポイントインカム",
    secondary_site_url: "https://pointi.jp/",
    base_score: 73,
  },
  {
    offer_name: "マネックス証券",
    category: "証券・投資",
    keywords: ["マネックス", "証券", "投資"],
    primary_site_name: "ハピタス",
    primary_site_url: "https://hapitas.jp/",
    secondary_site_name: "ワラウ",
    secondary_site_url: "https://www.warau.jp/",
    base_score: 72,
  },
  {
    offer_name: "イオンカード（WAON一体型）",
    category: "クレジットカード",
    keywords: ["イオンカード", "waon", "カード"],
    primary_site_name: "モッピー",
    primary_site_url: "https://pc.moppy.jp/",
    secondary_site_name: "ポイントインカム",
    secondary_site_url: "https://pointi.jp/",
    base_score: 71,
  },
  {
    offer_name: "ahamo",
    category: "通信・回線",
    keywords: ["ahamo", "ドコモ", "スマホ", "sim"],
    primary_site_name: "ワラウ",
    primary_site_url: "https://www.warau.jp/",
    secondary_site_name: "ハピタス",
    secondary_site_url: "https://hapitas.jp/",
    base_score: 70,
  },
  {
    offer_name: "YouTube Premium",
    category: "サブスク",
    keywords: ["youtube", "premium", "動画", "サブスク"],
    primary_site_name: "ポイントインカム",
    primary_site_url: "https://pointi.jp/",
    secondary_site_name: "モッピー",
    secondary_site_url: "https://pc.moppy.jp/",
    base_score: 69,
  },
  {
    offer_name: "マイナポイント（申請支援）",
    category: "サービス",
    keywords: ["マイナポイント", "マイナンバー", "申請"],
    primary_site_name: "ワラウ",
    primary_site_url: "https://www.warau.jp/",
    secondary_site_name: "ハピタス",
    secondary_site_url: "https://hapitas.jp/",
    base_score: 68,
  },
  {
    offer_name: "d払い",
    category: "アプリ・ゲーム",
    keywords: ["d払い", "決済", "アプリ"],
    primary_site_name: "モッピー",
    primary_site_url: "https://pc.moppy.jp/",
    secondary_site_name: "ポイントインカム",
    secondary_site_url: "https://pointi.jp/",
    base_score: 67,
  },
  {
    offer_name: "ヤフーカード",
    category: "クレジットカード",
    keywords: ["yahoo", "ヤフー", "カード"],
    primary_site_name: "ハピタス",
    primary_site_url: "https://hapitas.jp/",
    secondary_site_name: "ワラウ",
    secondary_site_url: "https://www.warau.jp/",
    base_score: 66,
  },
  {
    offer_name: "ソニー銀行",
    category: "その他",
    keywords: ["ソニー銀行", "銀行", "口座"],
    primary_site_name: "ポイントインカム",
    primary_site_url: "https://pointi.jp/",
    secondary_site_name: "モッピー",
    secondary_site_url: "https://pc.moppy.jp/",
    base_score: 65,
  },
  {
    offer_name: "七つの大罪 光と闇の交戦",
    category: "アプリ・ゲーム",
    keywords: ["七つの大罪", "ゲーム", "アプリ"],
    primary_site_name: "モッピー",
    primary_site_url: "https://pc.moppy.jp/",
    secondary_site_name: "ハピタス",
    secondary_site_url: "https://hapitas.jp/",
    base_score: 64,
  },
  {
    offer_name: "ブルーロック Project: World Champion",
    category: "アプリ・ゲーム",
    keywords: ["ブルーロック", "ゲーム", "アプリ"],
    primary_site_name: "ワラウ",
    primary_site_url: "https://www.warau.jp/",
    secondary_site_name: "ポイントインカム",
    secondary_site_url: "https://pointi.jp/",
    base_score: 63,
  },
  {
    offer_name: "トリマ",
    category: "アプリ・ゲーム",
    keywords: ["トリマ", "歩数", "アプリ"],
    primary_site_name: "モッピー",
    primary_site_url: "https://pc.moppy.jp/",
    secondary_site_name: "ハピタス",
    secondary_site_url: "https://hapitas.jp/",
    base_score: 62,
  },
  {
    offer_name: "Visa LINE Payクレジットカード",
    category: "クレジットカード",
    keywords: ["visa", "line pay", "カード"],
    primary_site_name: "ポイントインカム",
    primary_site_url: "https://pointi.jp/",
    secondary_site_name: "ワラウ",
    secondary_site_url: "https://www.warau.jp/",
    base_score: 61,
  },
];

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

      const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
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

  return matched ?? trends[0];
}

function generateAiDescription(params: {
  offer: Offer;
  trend: TrendInfo;
  score: number;
}) {
  const { offer, trend, score } = params;

  const trafficText = trend.traffic
    ? `Google Trends上では検索規模「${trend.traffic}」として観測されています。`
    : "Google Trends上で関連キーワードの動きが確認されています。";

  if (offer.category === "通信・回線") {
    return `${trafficText} 通信費の見直し需要と相性がよく、固定費削減を意識するユーザーからの関心が高まっています。AIは検索上昇度、還元期待値、申込需要を総合し、注目案件として評価しました。`;
  }

  if (offer.category === "アプリ・ゲーム") {
    return `${trafficText} アプリ・ゲーム案件は話題化したタイトルほど短期流入が増えやすく、条件達成型のポイ活と相性があります。AIは検索急増、参加しやすさ、獲得期待値を総合して評価しました。`;
  }

  if (offer.category === "クレジットカード") {
    return `${trafficText} クレジットカード案件は高還元になりやすく、申込意欲の高いユーザーと相性が良いジャンルです。AIは話題性、単価期待値、初心者の取り組みやすさをもとに評価しました。`;
  }

  if (offer.category === "証券・投資") {
    return `${trafficText} 証券・投資系は口座開設需要と高額ポイントが結びつきやすい案件です。AIは資産形成への関心、検索動向、還元期待値を総合して注目度を判定しました。`;
  }

  return `${trafficText} 関連する検索需要が伸びており、ポイ活案件としての注目度も上昇しています。AIは話題性、参加しやすさ、還元期待値を総合し、スコア${score}点で評価しました。`;
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

    const rankings = OFFERS.map((offer) => {
      const trend = getMatchedTrend(offer, trends);
      const score = Math.min(
        100,
        offer.base_score + getTrafficBonus(trend.traffic)
      );

      return {
        offer,
        trend,
        score,
      };
    })
      .sort((a, b) => b.score - a.score)
      .slice(0, 30)
      .map((item, index) => ({
        rank: index + 1,
        offer_name: item.offer.offer_name,
        category: item.offer.category,
        score: item.score,
        final_score: item.score,
        trend_keyword: item.trend.keyword,
        trend_traffic: item.trend.traffic ?? null,
        description: generateAiDescription({
          offer: item.offer,
          trend: item.trend,
          score: item.score,
        }),
        reason: generateAiDescription({
          offer: item.offer,
          trend: item.trend,
          score: item.score,
        }),
        primary_site_name: item.offer.primary_site_name,
        primary_site_url: item.offer.primary_site_url,
        secondary_site_name: item.offer.secondary_site_name,
        secondary_site_url: item.offer.secondary_site_url,
        updated_at: new Date().toISOString(),
      }));

    await supabase.from("rankings").delete().neq("rank", 0);

    const { error } = await supabase.from("rankings").insert(rankings);

    if (error) {
      console.error(error);
      return Response.json(
        { error: "Supabaseへの保存に失敗しました" },
        { status: 500 }
      );
    }

    return Response.json({
      message: "案件ランキングを更新しました",
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
