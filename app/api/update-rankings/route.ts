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
  ];

  const focusPoint = pickRandom(focusPoints);

  const registeredHighRankPatterns = [
    `${offerName}は、${category}カテゴリの中でも話題性と案件の安定感を両方確認しやすい案件です。${rewardText}の目安も含めて、今チェックしておきたい上位候補としてAIが評価しました。`,
    `${offerName}は、登録済み案件の中でも注目度が高く、ポイ活ユーザーが比較対象にしやすい案件です。検索動向と${focusPoint}を踏まえて、今回のランキングでは上位に入れています。`,
    `${offerName}は、掲載の安定感があり、現在のトレンドとも相性がよい案件です。報酬だけでなく、案件として探しやすい点も含めて高めに評価しています。`,
    `${offerName}は、定番寄りの案件でありながら、今の検索需要とも重なっている点が特徴です。条件が合えば優先的に確認したい案件としてAIが判断しました。`,
    `${offerName}は、話題性・報酬・案件の確認しやすさのバランスがよい案件です。上位表示する価値がある候補として、AIが総合的に評価しています。`,
  ];

  const registeredNormalPatterns = [
    `${offerName}は、登録済み案件として確認しやすく、${category}カテゴリの中でも比較対象に入れやすい案件です。${focusPoint}を踏まえてランキングに採用しています。`,
    `${offerName}は、ポイ活案件としての実在性を確認しやすい点が評価ポイントです。報酬条件を確認したうえで、候補のひとつとして検討しやすい案件です。`,
    `${offerName}は、現在の検索動向と案件内容の相性が見られるため、ランキングに入れています。大きく目立つ案件ではない場合でも、比較対象として確認する価値があります。`,
    `${offerName}は、掲載状況を確認しやすい登録済み案件です。${rewardText}の目安と話題性をあわせて、AIが候補として評価しました。`,
    `${offerName}は、案件名とカテゴリの関連性が分かりやすく、初心者でも内容を確認しやすい案件です。申し込み前に条件を見比べたい候補として採用しています。`,
    `${offerName}は、報酬だけでなく案件としての探しやすさも評価しています。現在のトレンドと照らし合わせて、ランキング内に入れる価値があると判断しました。`,
  ];

  const autoHighConfidencePatterns = [
    `${offerName}は、Googleトレンド由来のキーワードとモッピー検索結果の両方から検出された案件です。登録済み案件ではありませんが、関連性と${rewardText}の目安が確認できたため、AI自動発見枠として高めに評価しました。`,
    `${offerName}は、最近の話題ワードから浮上した自動発見案件です。検索トレンドとの一致度が比較的高く、報酬情報も確認できたため、注目候補としてランキングに加えています。`,
    `${offerName}は、通常の登録済み案件とは別に、トレンド検索の流れから見つかった案件です。信頼度が比較的高い候補として、AIが自動的に採用しました。`,
    `${offerName}は、検索需要の高まりに連動して見つかった案件です。まだ定番案件とは言い切れませんが、関連性と報酬面が確認できたため、今チェックする価値があります。`,
    `${offerName}は、AI自動発見案件の中でも、案件名・報酬・トレンドのつながりが比較的はっきりしています。短期的な注目候補としてランキングに反映しました。`,
  ];

  const autoNormalPatterns = [
    `${offerName}は、トレンド検索から検出された新しめの候補です。登録済み案件ではないため確認は必要ですが、現在の話題性を踏まえてAIがランキングに加えています。`,
    `${offerName}は、Googleトレンド由来のキーワードから見つかった案件です。定番案件と比べると慎重な確認が必要ですが、今後注目される可能性があります。`,
    `${offerName}は、検索トレンドとの関連が見られたため、AIが自動的に候補として抽出しました。申し込み前には掲載条件や報酬内容を確認するのがおすすめです。`,
    `${offerName}は、最近の話題ワードとのつながりから見つかった案件です。報酬や条件の確認は必要ですが、短期的な注目候補として採用しています。`,
    `${offerName}は、モッピー検索結果から検出されたAI自動発見案件です。登録済み案件よりは変動の可能性がありますが、トレンドとの相性を見てランキングに反映しました。`,
  ];

  if (isRegistered && rank <= 10) {
    return pickRandom(registeredHighRankPatterns);
  }

  if (isRegistered) {
    return pickRandom(registeredNormalPatterns);
  }

  if (confidenceScore >= 90) {
    return pickRandom(autoHighConfidencePatterns);
  }

  return pickRandom(autoNormalPatterns);
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

  /**
   * 以前決めた方針：
   * カード内のP表記が1個だけなら採用。
   * 複数ある場合は誤取得の可能性があるため採用しない。
   */
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

  /**
   * HTML構造の変化で行単位抽出が弱い場合の保険。
   * キーワードそのものが案件名っぽい場合は候補にする。
   */
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

    /**
     * AI自動発見案件をoffersへ正式追加する条件は厳しめ。
     */
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

  /**
   * rankingsテーブルに is_registered / confidence_score が無い場合の保険。
   * 既存スキーマ差分で落ちないよう、基本カラムだけで再挿入します。
   */
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

    /**
     * 登録済み案件が少なすぎる場合の補強。
     * offers登録済み案件を安定枠として追加します。
     */
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
