import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GOOGLE_TRENDS_RSS_URL = "https://trends.google.com/trending/rss?geo=JP";

const MOPPY_SEARCH_BASE_URL = "https://pc.moppy.jp/search/?q=";

type TrendItem = {
  keyword: string;
  score: number;
};

type OfferItem = {
  id?: string;
  name: string;
  reward?: number | null;
  category?: string | null;
  is_active?: boolean | null;
};

type CandidateItem = {
  offer_name: string;
  trend_keyword: string;
  category: string;
  reward: number | null;
  final_score: number;
  is_registered: boolean;
  confidence_score: number;
  reason: string;
};

function normalizeText(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeName(value: string) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[　\s]/g, "")
    .replace(/[・\-_｜|【】\[\]（）()「」『』]/g, "")
    .replace(/ポイント/g, "pt")
    .replace(/ｐ/g, "p")
    .trim();
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function formatReward(reward: number | null | undefined) {
  if (!reward || reward <= 0) return "報酬情報";
  return `${reward.toLocaleString("ja-JP")}P`;
}

function getCategoryByName(name: string, keyword: string) {
  const text = `${name} ${keyword}`;

  if (
    /カード|クレカ|paypay|楽天カード|三井住友|jcb|visa|master/i.test(text)
  ) {
    return "カード";
  }

  if (/証券|投資|nisa|sbi|楽天証券|口座|fx|暗号資産|仮想通貨/i.test(text)) {
    return "証券・金融";
  }

  if (/回線|wifi|モバイル|スマホ|sim|楽天モバイル|ahamo|povo|uq/i.test(text)) {
    return "通信";
  }

  if (/旅行|ホテル|宿泊|じゃらん|楽天トラベル|一休|航空券/i.test(text)) {
    return "旅行";
  }

  if (/ゲーム|アプリ|漫画|マンガ|電子書籍|動画|u-next|dmm|abema/i.test(text)) {
    return "アプリ・エンタメ";
  }

  if (/ふるさと納税|買い物|ショッピング|楽天市場|yahoo|amazon/i.test(text)) {
    return "ショッピング";
  }

  return "一般";
}

/**
 * AI理由文を自然にばらけさせる関数
 * - カテゴリ別
 * - 短文 / 中文 / 長文
 * - 順位別の温度感
 * - 登録済み / AI自動発見
 */
function generateReason(params: {
  offerName: string;
  category: string;
  reward: number | null;
  rank: number;
  isRegistered: boolean;
  confidenceScore: number;
}) {
  const {
    offerName,
    category,
    reward,
    rank,
    isRegistered,
    confidenceScore,
  } = params;

  const rewardText = formatReward(reward);

  const focusPoints = [
    "検索での注目度",
    "案件としての見つけやすさ",
    "報酬ポイントの目安",
    "初心者でも比較しやすい点",
    "現在の話題性",
    "申し込み前に条件確認しやすい点",
    "ポイ活案件としての相性",
    "短期的な注目度",
    "案件内容の分かりやすさ",
    "ポイント獲得までのイメージしやすさ",
    "ランキング内での安定感",
    "他案件と比較しやすい点",
    "今チェックするタイミング",
    "検索ニーズとの一致度",
    "報酬と話題性のバランス",
  ];

  const focusPoint = pickRandom(focusPoints);

  const rankTone =
    rank <= 3
      ? pickRandom([
          "今回のランキングでも特に注目度が高い案件です。",
          "上位案件として優先的に確認したい候補です。",
          "今のランキングを代表する注目案件として評価しています。",
          "話題性と案件の分かりやすさの両方で強めに評価しています。",
        ])
      : rank <= 10
        ? pickRandom([
            "10位以内の候補として、比較優先度は高めです。",
            "上位圏に入る案件として、今チェックする価値があります。",
            "ランキング上位寄りの案件として、条件確認しておきたい候補です。",
            "検索需要と案件内容のバランスを見て、上位圏に配置しています。",
          ])
        : pickRandom([
            "比較候補のひとつとして確認しておきたい案件です。",
            "条件が合う人にとっては検討しやすい案件です。",
            "他案件と見比べながら候補に入れたい案件です。",
            "大きく目立つ案件ではない場合でも、確認する価値があります。",
          ]);

  const lengthType = pickRandom(["short", "medium", "long"]);

  const categoryPhrases: Record<string, string[]> = {
    カード: [
      "クレジットカード系は高額ポイントを狙いやすい一方で、発行条件や利用条件の確認が大切です。",
      "カード案件は報酬が大きくなりやすく、ポイ活でも比較されやすいジャンルです。",
      "年会費や利用条件を見比べながら選びたいカード系案件です。",
      "カード発行系の中でも、報酬と申し込みやすさのバランスが注目ポイントです。",
    ],
    "証券・金融": [
      "証券・金融系は口座開設や初回取引条件を確認しながら進めたいジャンルです。",
      "金融系案件は報酬が高めになりやすく、条件達成までの手順も重要です。",
      "投資・口座開設系のポイ活として、報酬と条件のバランスを確認したい案件です。",
      "証券系は検索需要が高まりやすく、ポイ活案件としても比較対象に入りやすいジャンルです。",
    ],
    通信: [
      "通信系はスマホ料金や固定費の見直しと相性がよく、ポイ活でも注目されやすいジャンルです。",
      "通信・回線系は乗り換え需要と連動しやすく、条件が合えば大きなメリットを狙えます。",
      "モバイル・回線系案件は、月額料金や契約条件を確認したうえで比較したい案件です。",
      "通信費の見直しを考えている人にとって、ポイ活と相性のよい候補です。",
    ],
    旅行: [
      "旅行系は予約タイミングや利用条件によってお得度が変わりやすいジャンルです。",
      "宿泊・旅行予約系は、予定がある人ほど比較する価値が高い案件です。",
      "旅行系案件は、予約前にポイント還元の対象条件を確認したいジャンルです。",
      "旅行需要と連動しやすく、時期によって注目度が変わりやすい案件です。",
    ],
    "アプリ・エンタメ": [
      "アプリ・エンタメ系は始めやすさが魅力で、初心者でも確認しやすいジャンルです。",
      "動画・ゲーム・アプリ系は、利用条件が合えば手軽に試しやすい案件です。",
      "エンタメ系案件は、日常利用とポイ活を組み合わせやすい点が評価ポイントです。",
      "アプリ系は短期的に注目されやすく、トレンドとの相性も見やすいジャンルです。",
    ],
    ショッピング: [
      "ショッピング系は普段の買い物と組み合わせやすく、初心者にも分かりやすいジャンルです。",
      "買い物・ふるさと納税系は、利用予定がある人ほどポイントを取り逃がしたくない案件です。",
      "ショッピング案件は、購入前に経由条件や対象ショップを確認することが大切です。",
      "普段使いしやすいジャンルなので、無理なくポイ活に取り入れやすい案件です。",
    ],
    一般: [
      "幅広いユーザーが比較しやすい一般案件として評価しています。",
      "カテゴリを問わず、案件内容と話題性のバランスを見て候補に入れています。",
      "申し込み条件を確認しながら、他の案件と比較したい候補です。",
      "検索需要と案件としての分かりやすさをもとに評価しています。",
    ],
  };

  const categoryPhrase = pickRandom(
    categoryPhrases[category] || categoryPhrases["一般"]
  );

  const registeredShortPatterns = [
    `${offerName}は、${category}カテゴリの登録済み案件として確認しやすい候補です。${rankTone}`,
    `${offerName}は、${focusPoint}の面で評価できる登録済み案件です。`,
    `${offerName}は、${rewardText}の目安も含めて比較しやすい案件です。`,
    `${offerName}は、現在のランキング内で安定感のある候補として評価しています。`,
    `${offerName}は、案件内容が分かりやすく、比較対象に入れやすい案件です。`,
  ];

  const registeredMediumPatterns = [
    `${offerName}は、${category}カテゴリの中でもポイ活案件として確認しやすい候補です。${categoryPhrase} ${rankTone}`,
    `${offerName}は、登録済み案件としての安定感があり、${focusPoint}も評価しやすい案件です。${rewardText}の目安とあわせて確認したい候補です。`,
    `${offerName}は、検索需要と案件内容の結びつきが見られるため、ランキングに採用しています。${categoryPhrase}`,
    `${offerName}は、報酬だけでなく案件として探しやすい点も評価しています。${rankTone}`,
    `${offerName}は、ポイ活初心者でも比較しやすい登録済み案件です。申し込み前に条件を確認しながら、他案件と見比べたい候補です。`,
  ];

  const registeredLongPatterns = [
    `${offerName}は、${category}カテゴリの登録済み案件として、案件内容と報酬の目安を確認しやすい点が評価ポイントです。${categoryPhrase} ${rewardText}の目安もあるため、申し込み条件を確認したうえで比較したい案件です。${rankTone}`,
    `${offerName}は、現在の検索動向と案件内容の相性が見られるため、ランキング内で評価しています。${categoryPhrase} 単に報酬が見えるだけでなく、ポイ活ユーザーが比較対象にしやすい点もAIが重視しました。`,
    `${offerName}は、登録済み案件として一定の安定感があり、${focusPoint}の面でも候補に残しやすい案件です。${categoryPhrase} 条件が合うかどうかを確認しながら、他の上位案件と比較する価値があります。`,
    `${offerName}は、案件名とカテゴリの関連性が分かりやすく、現在のランキングでも扱いやすい候補です。${rewardText}の目安に加えて、検索需要や案件の確認しやすさを総合的に見てAIが評価しています。`,
  ];

  const autoShortPatterns = [
    `${offerName}は、トレンド検索から見つかったAI自動発見案件です。`,
    `${offerName}は、現在の話題性をもとにAIが候補として抽出しました。`,
    `${offerName}は、検索動向との関連が見られたためランキングに加えています。`,
    `${offerName}は、登録済み案件ではありませんが、短期的な注目候補として評価しています。`,
    `${offerName}は、トレンドとの相性を見てAIが自動的に採用した候補です。`,
  ];

  const autoMediumPatterns = [
    `${offerName}は、Googleトレンド由来のキーワードから見つかった候補です。登録済み案件ではありませんが、${focusPoint}を踏まえてランキングに加えています。`,
    `${offerName}は、モッピー検索結果と検索トレンドのつながりから検出された案件です。${rewardText}の目安が確認できる場合は、条件を見ながら比較したい候補です。`,
    `${offerName}は、最近の話題ワードとの関連が見られたため、AIが自動的に抽出しました。定番案件と比べると慎重な確認は必要ですが、今チェックする価値があります。`,
    `${offerName}は、通常の登録済み案件とは別に、トレンド検索の流れから浮上した候補です。${categoryPhrase}`,
    `${offerName}は、検索需要の高まりに反応して検出された案件です。掲載状況や報酬条件を確認しながら検討したい候補です。`,
  ];

  const autoLongPatterns = [
    `${offerName}は、Googleトレンド由来のキーワードとモッピー検索結果の関連から検出されたAI自動発見案件です。登録済み案件ではないため確認は必要ですが、${focusPoint}の面で候補に残す価値があると判断しました。${categoryPhrase}`,
    `${offerName}は、通常の登録済み案件とは違い、最近の検索動向からAIが拾い上げた候補です。${rewardText}の目安が確認できる場合は、報酬条件と対象条件を見比べながら検討したい案件です。${rankTone}`,
    `${offerName}は、短期的な話題性を重視してランキングに反映した自動発見案件です。定番案件ほどの安定感はまだ確認しきれませんが、検索需要との一致度や案件としての見つけやすさを見て採用しています。`,
    `${offerName}は、トレンド由来の候補の中でも、案件名と検索ニーズのつながりが見られるためランキングに加えています。登録済み案件より変動の可能性はありますが、今後注目される可能性をAIが評価しました。`,
  ];

  const autoHighConfidenceExtraPatterns = [
    `${offerName}は、AI自動発見案件の中でも関連性と報酬情報が比較的はっきりしている候補です。${rewardText}の目安も含めて、短期的に注目しやすい案件として評価しています。`,
    `${offerName}は、登録済み案件ではありませんが、検索トレンドとの一致度が高めです。話題性と案件としての確認しやすさを見て、AI自動発見枠の中では強めに評価しました。`,
    `${offerName}は、トレンド由来の案件の中でも判断材料が比較的そろっています。${categoryPhrase} 条件確認前提で、今チェックしたい候補として採用しています。`,
  ];

  let selectedPatterns: string[] = [];

  if (isRegistered) {
    if (lengthType === "short") selectedPatterns = registeredShortPatterns;
    if (lengthType === "medium") selectedPatterns = registeredMediumPatterns;
    if (lengthType === "long") selectedPatterns = registeredLongPatterns;
  } else {
    if (lengthType === "short") selectedPatterns = autoShortPatterns;
    if (lengthType === "medium") selectedPatterns = autoMediumPatterns;
    if (lengthType === "long") selectedPatterns = autoLongPatterns;

    if (confidenceScore >= 90) {
      selectedPatterns = [...selectedPatterns, ...autoHighConfidenceExtraPatterns];
    }
  }

  return pickRandom(selectedPatterns);
}

async function getGoogleTrends(): Promise<TrendItem[]> {
  const res = await fetch(GOOGLE_TRENDS_RSS_URL, {
    cache: "no-store",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; PoikatsuAI/1.0; +https://poikatu-ai.vercel.app)",
    },
  });

  if (!res.ok) {
    throw new Error(`Google Trends RSS fetch failed: ${res.status}`);
  }

  const xml = await res.text();

  const titles = [...xml.matchAll(/<title>([\s\S]*?)<\/title>/g)]
    .map((match) => normalizeText(match[1]))
    .filter(Boolean)
    .filter((title) => !/Daily Search Trends|検索トレンド/i.test(title));

  const unique = Array.from(new Set(titles));

  return unique.slice(0, 50).map((keyword, index) => ({
    keyword,
    score: Math.max(100 - index, 50),
  }));
}

async function fetchMoppySearch(keyword: string) {
  const url = `${MOPPY_SEARCH_BASE_URL}${encodeURIComponent(keyword)}`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
  });

  if (!res.ok) {
    return "";
  }

  return await res.text();
}

function stripHtml(value: string) {
  return normalizeText(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
  );
}

function extractRewardFromText(text: string): number | null {
  const matches = [
    ...text.matchAll(/([0-9０-９,，]+)\s*(?:P|ｐ|ポイント)/gi),
  ];

  const rewards = matches
    .map((match) =>
      Number(
        match[1]
          .replace(/[０-９]/g, (s) =>
            String.fromCharCode(s.charCodeAt(0) - 0xfee0)
          )
          .replace(/[,，]/g, "")
      )
    )
    .filter((num) => Number.isFinite(num) && num > 0);

  const uniqueRewards = Array.from(new Set(rewards));

  if (uniqueRewards.length === 1) {
    return uniqueRewards[0];
  }

  return null;
}

function extractOfferCandidatesFromMoppyHtml(
  html: string,
  keyword: string
): { name: string; reward: number | null }[] {
  const text = stripHtml(html);

  const lines = text
    .split(/\n|。|！|!|\r/)
    .map((line) => normalizeText(line))
    .filter(Boolean);

  const candidates: { name: string; reward: number | null }[] = [];

  for (const line of lines) {
    if (candidates.length >= 5) break;

    const reward = extractRewardFromText(line);

    if (!reward || reward < 500) continue;

    const cleaned = line
      .replace(/([0-9０-９,，]+)\s*(?:P|ｐ|ポイント).*/gi, "")
      .replace(/獲得|還元|ポイント|詳細|広告|PR|キャンペーン/g, "")
      .trim();

    if (cleaned.length < 2 || cleaned.length > 60) continue;

    if (
      /ログイン|会員登録|検索|カテゴリ|ランキング|ヘルプ|無料でポイント|利用規約/.test(
        cleaned
      )
    ) {
      continue;
    }

    candidates.push({
      name: cleaned,
      reward,
    });
  }

  if (candidates.length === 0) {
    const reward = extractRewardFromText(text);
    if (reward && reward >= 500) {
      candidates.push({
        name: keyword,
        reward,
      });
    }
  }

  return candidates;
}

async function getOffers(): Promise<OfferItem[]> {
  const { data, error } = await supabase.from("offers").select("*");

  if (error) {
    console.error("offers fetch error:", error);
    return [];
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    name:
      item.offer_name ||
      item.name ||
      item.title ||
      item.trend_keyword ||
      item.category ||
      "",
    reward: typeof item.reward === "number" ? item.reward : null,
    category: item.category || null,
    is_active: item.is_active ?? true,
  }));
}

function findRegisteredOffer(
  offerName: string,
  keyword: string,
  offers: OfferItem[]
) {
  const normalizedOfferName = normalizeName(offerName);
  const normalizedKeyword = normalizeName(keyword);

  return offers.find((offer) => {
    const registeredName = normalizeName(offer.name);

    if (!registeredName) return false;

    return (
      registeredName === normalizedOfferName ||
      registeredName.includes(normalizedOfferName) ||
      normalizedOfferName.includes(registeredName) ||
      registeredName.includes(normalizedKeyword) ||
      normalizedKeyword.includes(registeredName)
    );
  });
}

function calculateScore(params: {
  trendScore: number;
  reward: number | null;
  isRegistered: boolean;
  confidenceScore: number;
  index: number;
}) {
  const { trendScore, reward, isRegistered, confidenceScore, index } = params;

  const rewardScore = reward ? Math.min(reward / 100, 40) : 0;
  const registeredBonus = isRegistered ? 25 : 0;
  const confidenceBonus = confidenceScore / 5;
  const freshnessPenalty = index * 0.3;

  return Math.round(
    trendScore + rewardScore + registeredBonus + confidenceBonus - freshnessPenalty
  );
}

function adjustCategoryBalance(candidates: CandidateItem[]) {
  const categoryCounts = new Map<string, number>();

  return candidates.map((item) => {
    const count = categoryCounts.get(item.category) || 0;
    categoryCounts.set(item.category, count + 1);

    const penalty = count >= 3 ? count * 4 : 0;

    return {
      ...item,
      final_score: Math.max(item.final_score - penalty, 1),
    };
  });
}

async function syncOffersFromCandidates(candidates: CandidateItem[]) {
  let offersInsertedCount = 0;
  let offersUpdatedCount = 0;
  let offersSyncSkippedCount = 0;

  const { data: offersData } = await supabase.from("offers").select("*");
  const currentOffers = offersData || [];

  for (const candidate of candidates) {
    const existing = currentOffers.find((offer: any) => {
      const offerName =
        offer.offer_name || offer.name || offer.title || offer.trend_keyword || "";

      return normalizeName(offerName) === normalizeName(candidate.offer_name);
    });

    if (existing) {
      if (
        candidate.reward &&
        typeof existing.reward === "number" &&
        candidate.reward !== existing.reward
      ) {
        const { error } = await supabase
          .from("offers")
          .update({
            reward: candidate.reward,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (!error) {
          offersUpdatedCount++;
        } else {
          offersSyncSkippedCount++;
        }
      } else {
        offersSyncSkippedCount++;
      }

      continue;
    }

    if (
      !candidate.is_registered &&
      candidate.confidence_score >= 90 &&
      candidate.reward &&
      candidate.reward >= 500
    ) {
      const { error } = await supabase.from("offers").insert({
        offer_name: candidate.offer_name,
        category: candidate.category,
        reward: candidate.reward,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (!error) {
        offersInsertedCount++;
      } else {
        offersSyncSkippedCount++;
      }
    } else {
      offersSyncSkippedCount++;
    }
  }

  return {
    offers_inserted_count: offersInsertedCount,
    offers_updated_count: offersUpdatedCount,
    offers_sync_skipped_count: offersSyncSkippedCount,
  };
}

async function updateRankings(rows: CandidateItem[]) {
  const now = new Date().toISOString();

  await supabase.from("rankings").delete().gte("rank", 0);

  const insertRows = rows.map((item, index) => ({
    rank: index + 1,
    offer_name: item.offer_name,
    trend_keyword: item.trend_keyword,
    category: item.category,
    reward: item.reward,
    final_score: item.final_score,
    reason: item.reason,
    is_registered: item.is_registered,
    confidence_score: item.confidence_score,
    updated_at: now,
  }));

  const { error } = await supabase.from("rankings").insert(insertRows);

  if (error) {
    console.error("rankings insert error:", error);

    const fallbackRows = rows.map((item, index) => ({
      rank: index + 1,
      offer_name: item.offer_name,
      trend_keyword: item.trend_keyword,
      category: item.category,
      reward: item.reward,
      final_score: item.final_score,
      reason: item.reason,
      updated_at: now,
    }));

    const fallback = await supabase.from("rankings").insert(fallbackRows);

    if (fallback.error) {
      throw fallback.error;
    }
  }
}

async function updateTrends(rows: CandidateItem[]) {
  await supabase.from("trends").delete().gte("score", 0);

  const trendRows = rows.slice(0, 50).map((item, index) => ({
    word: item.offer_name,
    score: Math.max(100 - index * 2, 10),
    category: item.category,
  }));

  const { error } = await supabase.from("trends").insert(trendRows);

  if (error) {
    throw error;
  }
}

export async function GET() {
  try {
    const trends = await getGoogleTrends();
    const offers = await getOffers();

    const candidates: CandidateItem[] = [];

    for (let i = 0; i < trends.length; i++) {
      const trend = trends[i];

      try {
        const html = await fetchMoppySearch(trend.keyword);
        const moppyCandidates = extractOfferCandidatesFromMoppyHtml(
          html,
          trend.keyword
        );

        for (const moppyCandidate of moppyCandidates) {
          const registeredOffer = findRegisteredOffer(
            moppyCandidate.name,
            trend.keyword,
            offers
          );

          const isRegistered = Boolean(registeredOffer);

          const offerName = registeredOffer?.name || moppyCandidate.name;

          const reward = moppyCandidate.reward || registeredOffer?.reward || null;

          const category =
            registeredOffer?.category ||
            getCategoryByName(offerName, trend.keyword);

          const confidenceScore = isRegistered
            ? 100
            : reward && reward >= 500
              ? 90
              : 80;

          const finalScore = calculateScore({
            trendScore: trend.score,
            reward,
            isRegistered,
            confidenceScore,
            index: i,
          });

          const duplicate = candidates.some(
            (item) => normalizeName(item.offer_name) === normalizeName(offerName)
          );

          if (duplicate) continue;

          candidates.push({
            offer_name: offerName,
            trend_keyword: trend.keyword,
            category,
            reward,
            final_score: finalScore,
            is_registered: isRegistered,
            confidence_score: confidenceScore,
            reason: "",
          });
        }
      } catch (error) {
        console.error(`Moppy search failed: ${trend.keyword}`, error);
      }
    }

    for (const offer of offers) {
      if (candidates.length >= 50) break;

      if (!offer.name) continue;

      const duplicate = candidates.some(
        (item) => normalizeName(item.offer_name) === normalizeName(offer.name)
      );

      if (duplicate) continue;

      const category = offer.category || getCategoryByName(offer.name, offer.name);

      candidates.push({
        offer_name: offer.name,
        trend_keyword: offer.name,
        category,
        reward: offer.reward || null,
        final_score: calculateScore({
          trendScore: 60,
          reward: offer.reward || null,
          isRegistered: true,
          confidenceScore: 100,
          index: candidates.length,
        }),
        is_registered: true,
        confidence_score: 100,
        reason: "",
      });
    }

    const balancedCandidates = adjustCategoryBalance(candidates)
      .sort((a, b) => b.final_score - a.final_score)
      .slice(0, 50)
      .map((item, index) => ({
        ...item,
        reason: generateReason({
          offerName: item.offer_name,
          category: item.category,
          reward: item.reward,
          rank: index + 1,
          isRegistered: item.is_registered,
          confidenceScore: item.confidence_score,
        }),
      }));

    const offersSyncResult = await syncOffersFromCandidates(balancedCandidates);

    await updateRankings(balancedCandidates);
    await updateTrends(balancedCandidates);

    return NextResponse.json({
      ok: true,
      message: "rankings and trends updated",
      count: balancedCandidates.length,
      trends_count: trends.length,
      registered_count: balancedCandidates.filter((item) => item.is_registered)
        .length,
      auto_discovered_count: balancedCandidates.filter(
        (item) => !item.is_registered
      ).length,
      ...offersSyncResult,
      sample: balancedCandidates.slice(0, 5),
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
