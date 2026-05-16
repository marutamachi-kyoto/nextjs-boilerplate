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

type RewardHit = {
  value: number;
  index: number;
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
 * AI理由文を80〜110文字前後に抑えて生成する関数
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
    "話題性",
    "検索需要",
    "報酬の目安",
    "比較しやすさ",
    "案件の見つけやすさ",
    "条件確認のしやすさ",
    "ポイ活との相性",
    "短期的な注目度",
  ];

  const focusPoint = pickRandom(focusPoints);

  const rankTone =
    rank <= 3
      ? pickRandom([
          "上位候補として優先的に確認したい案件です。",
          "今回のランキングでも特に注目度が高い案件です。",
          "今チェックしたい代表的な注目案件です。",
        ])
      : rank <= 10
        ? pickRandom([
            "10位以内の候補として比較優先度は高めです。",
            "上位圏の案件として条件確認しておきたい候補です。",
            "今の検索需要と相性がよい案件です。",
          ])
        : pickRandom([
            "比較候補のひとつとして確認したい案件です。",
            "条件が合う人には検討しやすい案件です。",
            "他案件と見比べたい候補として評価しています。",
          ]);

  const categoryPhrases: Record<string, string[]> = {
    カード: [
      "カード系は高額ポイントを狙いやすく、条件確認が大切です。",
      "カード発行系として、報酬と申し込みやすさのバランスを評価しています。",
      "クレカ案件として比較されやすく、報酬面でも注目しやすい候補です。",
    ],
    "証券・金融": [
      "証券・金融系は報酬が高めになりやすく、条件達成の確認が重要です。",
      "口座開設系として、報酬と手順の分かりやすさを評価しています。",
      "金融系ポイ活として、検索需要と報酬面のバランスを見ています。",
    ],
    通信: [
      "通信系は固定費見直しと相性がよく、乗り換え需要でも注目されます。",
      "モバイル・回線系として、料金や契約条件とあわせて比較したい案件です。",
      "通信費を見直したい人にとって、ポイ活と相性のよい候補です。",
    ],
    旅行: [
      "旅行系は予約前に条件を確認すると、ポイントを取り逃がしにくい案件です。",
      "宿泊・旅行予約と相性がよく、予定がある人ほど比較価値があります。",
      "旅行需要と連動しやすく、時期によって注目度が変わりやすい案件です。",
    ],
    "アプリ・エンタメ": [
      "アプリ・エンタメ系は始めやすく、初心者でも確認しやすいジャンルです。",
      "動画・ゲーム・アプリ系として、手軽に試しやすい点を評価しています。",
      "日常利用とポイ活を組み合わせやすい候補として見ています。",
    ],
    ショッピング: [
      "ショッピング系は普段の買い物と組み合わせやすい案件です。",
      "購入前に経由条件を確認すれば、ポイントを取り逃がしにくい候補です。",
      "普段使いしやすく、無理なくポイ活に取り入れやすい案件です。",
    ],
    一般: [
      "案件内容と話題性のバランスを見て候補に入れています。",
      "検索需要と案件としての分かりやすさをもとに評価しています。",
      "申し込み条件を確認しながら比較したい候補です。",
    ],
  };

  const categoryPhrase = pickRandom(
    categoryPhrases[category] || categoryPhrases["一般"]
  );

  const registeredPatterns = [
    `${offerName}は、${category}カテゴリの登録済み案件です。${rankTone}`,
    `${offerName}は、${focusPoint}の面で評価できる登録済み案件です。${categoryPhrase}`,
    `${offerName}は、${rewardText}の目安も含めて比較しやすい案件です。${rankTone}`,
    `${offerName}は、案件内容を確認しやすく、比較対象に入れやすい候補です。${categoryPhrase}`,
    `${offerName}は、登録済み案件として安定感があり、${focusPoint}も評価しやすい案件です。`,
    `${offerName}は、検索需要と案件内容の相性が見られるため、AIが候補として評価しました。`,
    `${offerName}は、報酬だけでなく探しやすさも評価しています。${rankTone}`,
    `${offerName}は、ポイ活初心者でも比較しやすい案件です。申し込み前に条件確認したい候補です。`,
  ];

  const autoPatterns = [
    `${offerName}は、トレンド検索から見つかったAI自動発見案件です。${rankTone}`,
    `${offerName}は、現在の話題性をもとにAIが抽出した候補です。条件確認前提で評価しています。`,
    `${offerName}は、検索動向との関連が見られたためランキングに加えています。${categoryPhrase}`,
    `${offerName}は、登録済み案件ではありませんが、短期的な注目候補として評価しています。`,
    `${offerName}は、モッピー検索結果とトレンドのつながりから検出された候補です。`,
    `${offerName}は、${focusPoint}をもとにAIが自動採用した案件です。掲載条件は確認しておきたい候補です。`,
  ];

  const autoHighConfidencePatterns = [
    `${offerName}は、AI自動発見案件の中でも関連性が高めです。${rewardText}の目安も含めて評価しています。`,
    `${offerName}は、検索トレンドとの一致度が高く、AI自動発見枠の中では強めに評価しています。`,
    `${offerName}は、トレンド由来の候補の中でも判断材料が比較的そろった案件です。${rankTone}`,
  ];

  let reason = "";

  if (isRegistered) {
    reason = pickRandom(registeredPatterns);
  } else if (confidenceScore >= 90) {
    reason = pickRandom([...autoPatterns, ...autoHighConfidencePatterns]);
  } else {
    reason = pickRandom(autoPatterns);
  }

  if (reason.length > 110) {
    const firstSentence = reason.split("。")[0];
    if (firstSentence.length >= 55) {
      return `${firstSentence}。`;
    }

    return `${firstSentence}。${rankTone}`;
  }

  return reason;
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

function toHalfWidthNumber(value: string) {
  return value
    .replace(/[０-９]/g, (s) =>
      String.fromCharCode(s.charCodeAt(0) - 0xfee0)
    )
    .replace(/[,，]/g, "");
}

function extractRewardHits(text: string, minReward = 100): RewardHit[] {
  const matches = [...text.matchAll(/([0-9０-９,，]+)\s*(?:P|ｐ|ポイント)/gi)];

  return matches
    .map((match) => ({
      value: Number(toHalfWidthNumber(match[1])),
      index: match.index ?? 0,
    }))
    .filter((hit) => Number.isFinite(hit.value) && hit.value >= minReward);
}

function extractUniqueRewardFromText(
  text: string,
  minReward = 100
): number | null {
  const rewards = extractRewardHits(text, minReward).map((hit) => hit.value);
  const uniqueRewards = Array.from(new Set(rewards));

  if (uniqueRewards.length === 1) {
    return uniqueRewards[0];
  }

  return null;
}

function getKeywordVariants(keyword: string): string[] {
  const base = normalizeText(keyword);
  const set = new Set<string>();

  if (base) set.add(base);

  const withoutSpaces = base.replace(/[　\s]/g, "");
  if (withoutSpaces) set.add(withoutSpaces);

  const withoutParentheses = base.replace(/[（(].*?[）)]/g, "").trim();
  if (withoutParentheses) set.add(withoutParentheses);

  const withoutSymbols = base
    .replace(/[・\-_｜|【】\[\]（）()「」『』]/g, "")
    .trim();
  if (withoutSymbols) set.add(withoutSymbols);

  const tokens = base
    .split(/[　\s・\-_｜|【】\[\]（）()「」『』]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

  for (const token of tokens) {
    set.add(token);
  }

  return Array.from(set)
    .filter((v) => v.length >= 2)
    .sort((a, b) => b.length - a.length);
}

/**
 * 案件名の前後600文字を見て、案件名に一番近いPを採用する。
 * 100P未満は除外。
 */
function extractNearestRewardNearKeywordFromText(
  text: string,
  keyword: string,
  minReward = 100
): number | null {
  if (!text || !keyword) return null;

  const lowerText = text.toLowerCase();
  const variants = getKeywordVariants(keyword).map((v) => v.toLowerCase());

  let bestReward: number | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const variant of variants.slice(0, 8)) {
    let startIndex = 0;
    let hitCount = 0;

    while (hitCount < 5) {
      const keywordIndex = lowerText.indexOf(variant, startIndex);
      if (keywordIndex === -1) break;

      hitCount += 1;

      const windowStart = Math.max(0, keywordIndex - 600);
      const windowEnd = Math.min(
        text.length,
        keywordIndex + variant.length + 600
      );

      const snippet = text.slice(windowStart, windowEnd);
      const rewardHits = extractRewardHits(snippet, minReward);

      for (const hit of rewardHits) {
        const absoluteRewardIndex = windowStart + hit.index;
        const distance = Math.abs(absoluteRewardIndex - keywordIndex);

        if (distance < bestDistance) {
          bestDistance = distance;
          bestReward = hit.value;
        }
      }

      startIndex = keywordIndex + variant.length;
    }
  }

  return bestReward;
}

function cleanCandidateName(name: string) {
  return normalizeText(name)
    .replace(/^※+/, "")
    .replace(/^[・\-ー:：\s]+/, "")
    .replace(/([0-9０-９,，]+)\s*(?:P|ｐ|ポイント).*/gi, "")
    .replace(/獲得|還元|ポイント|詳細|広告|PR/g, "")
    .trim();
}

/**
 * 自動発見案件名のノイズ除去。
 * 登録済み offers の名前には使いすぎない。
 */
function isNoiseCandidateName(name: string) {
  const normalized = normalizeText(name);
  const compact = normalizeName(name);

  if (!normalized) return true;
  if (normalized.length < 2 || normalized.length > 42) return true;

  if (/^※/.test(normalized)) return true;

  if (
    /ログイン|会員登録|検索|カテゴリ|ランキング|ヘルプ|無料でポイント|利用規約|プライバシー|お問い合わせ|キャンペーン一覧|広告掲載|友達紹介|マイページ|条件|詳細|もっと見る/.test(
      normalized
    )
  ) {
    return true;
  }

  if (
    /キャンペーン|%off|％off|off|投稿|口コミ|レビュー|レシート|チラシ|ニュース|お知らせ|抽選|当選|プレゼント|ゲット|無料|get/i.test(
      normalized
    )
  ) {
    return true;
  }

  if (/モッピー|moppy|モッピービーンズ/i.test(normalized)) {
    return true;
  }

  if (/[。！？!?]/.test(normalized)) return true;

  const bracketCount =
    (normalized.match(/[【】「」『』]/g) || []).length;
  if (bracketCount >= 2) return true;

  if (compact.length < 2) return true;

  return false;
}

/**
 * trends表示用のキーワードとして安全かどうか。
 */
function isSafeTrendWord(word: string) {
  const normalized = normalizeText(word);

  if (!normalized) return false;
  if (normalized.length < 2 || normalized.length > 28) return false;
  if (/^※/.test(normalized)) return false;

  if (
    /キャンペーン|%off|％off|off|投稿|口コミ|レビュー|レシート|チラシ|ニュース|お知らせ|抽選|当選|プレゼント|ゲット|無料|get|モッピー|moppy|ログイン|会員登録|利用規約|詳細/i.test(
      normalized
    )
  ) {
    return false;
  }

  if (/[。！？!?]/.test(normalized)) return false;

  const bracketCount =
    (normalized.match(/[【】「」『』]/g) || []).length;
  if (bracketCount >= 2) return false;

  return true;
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
  const seen = new Set<string>();

  for (const line of lines) {
    if (candidates.length >= 5) break;

    const cleaned = cleanCandidateName(line);

    if (isNoiseCandidateName(cleaned)) continue;

    let reward = extractUniqueRewardFromText(line, 100);

    if (!reward) {
      reward = extractNearestRewardNearKeywordFromText(text, cleaned, 100);
    }

    if (!reward) continue;

    const key = normalizeName(cleaned);
    if (seen.has(key)) continue;
    seen.add(key);

    candidates.push({
      name: cleaned,
      reward,
    });
  }

  /**
   * トレンド検索語そのものを候補化する場合も、
   * ノイズ判定を通したものだけ採用。
   */
  if (candidates.length === 0) {
    const cleanedKeyword = cleanCandidateName(keyword);

    if (!isNoiseCandidateName(cleanedKeyword)) {
      const rewardNearKeyword = extractNearestRewardNearKeywordFromText(
        text,
        cleanedKeyword,
        100
      );

      if (rewardNearKeyword) {
        candidates.push({
          name: cleanedKeyword,
          reward: rewardNearKeyword,
        });
      }
    }
  }

  return candidates;
}

async function getMoppyRewardForKeyword(keyword: string): Promise<number | null> {
  try {
    const html = await fetchMoppySearch(keyword);
    const text = stripHtml(html);

    const nearestReward = extractNearestRewardNearKeywordFromText(
      text,
      keyword,
      100
    );

    if (nearestReward) return nearestReward;

    const uniquePageReward = extractUniqueRewardFromText(text, 100);
    if (uniquePageReward) return uniquePageReward;

    return null;
  } catch (error) {
    console.error(`Moppy reward fetch failed: ${keyword}`, error);
    return null;
  }
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
      if (candidate.reward && candidate.reward > 0) {
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

  const trendRows = rows
    .filter((item) => isSafeTrendWord(item.offer_name))
    .slice(0, 50)
    .map((item, index) => ({
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

    /**
     * 1. Googleトレンド由来キーワードでモッピー検索
     *    自動発見候補はノイズ除去を強める。
     */
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
          const offerName = moppyCandidate.name;
          const reward = moppyCandidate.reward;

          const category =
            registeredOffer?.category ||
            getCategoryByName(offerName, trend.keyword);

          const confidenceScore = isRegistered ? 100 : 90;

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
     * 2. offers 登録案件で補強
     *    offers.reward は表示に使わない。
     */
    for (const offer of offers) {
      if (candidates.length >= 50) break;
      if (!offer.name) continue;

      const duplicate = candidates.some(
        (item) => normalizeName(item.offer_name) === normalizeName(offer.name)
      );

      if (duplicate) continue;

      const rewardFromMoppy = await getMoppyRewardForKeyword(offer.name);
      const category = offer.category || getCategoryByName(offer.name, offer.name);

      candidates.push({
        offer_name: offer.name,
        trend_keyword: offer.name,
        category,
        reward: rewardFromMoppy,
        final_score: calculateScore({
          trendScore: 60,
          reward: rewardFromMoppy,
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
      trends_saved_count: balancedCandidates.filter((item) =>
        isSafeTrendWord(item.offer_name)
      ).length,
      registered_count: balancedCandidates.filter((item) => item.is_registered)
        .length,
      auto_discovered_count: balancedCandidates.filter(
        (item) => !item.is_registered
      ).length,
      balance_mode: true,
      rewards_from_moppy_only: true,
      offers_backfill_enabled: true,
      offers_reward_used_for_display: false,
      reward_extraction_mode: "nearest_p_within_600_chars",
      noise_filter_enabled: true,
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
