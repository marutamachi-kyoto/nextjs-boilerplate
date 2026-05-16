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
  reward: number;
};

type MatchedOffer = {
  name: string;
  reward: number;
  category: Category;
  is_registered: boolean;
  confidence_score: number;
};

type MoppySearchResult = {
  trend: TrendInfo;
  offers: MatchedOffer[];
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
  reward: number;
  updated_at: string;
};

type OfferSyncResult = {
  inserted: number;
  updated: number;
  skipped: number;
};

const MOPPY_URL =
  "https://pc.moppy.jp/entry/invite.php?invite=ut3GA1ce&openExternalBrowser=1";

function normalizeText(text?: string) {
  return (text || "")
    .toLowerCase()
    .replace(/　/g, "")
    .replace(/\s+/g, "")
    .replace(/（/g, "(")
    .replace(/）/g, ")")
    .replace(/[・･]/g, "")
    .replace(/[ーｰ−]/g, "-")
    .trim();
}

function cleanHtmlText(text: string) {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanTitle(text: string) {
  return cleanHtmlText(text)
    .replace(/^【[^】]+】\s*/g, "")
    .replace(/^\[[^\]]+\]\s*/g, "")
    .replace(/^（[^）]+）\s*/g, "")
    .replace(/^\([^)]+\)\s*/g, "")
    .replace(/^PR\s*/i, "")
    .trim();
}

function isNoiseTitle(title: string) {
  const normalized = normalizeText(title);

  if (!normalized) return true;
  if (title.length < 2) return true;
  if (title.length > 70) return true;

  const ngWords = [
    "モッピー",
    "ポイント",
    "広告",
    "検索",
    "検索結果",
    "もっと見る",
    "最近見た広告",
    "お気に入り広告",
    "過去最高還元",
    "キャンペーン",
    "詳しくはこちら",
    "無料会員登録",
    "ログイン",
    "会員登録",
    "条件達成",
    "ポイント獲得",
    "おすすめ",
    "人気",
    "一覧",
    "ヘルプ",
    "問い合わせ",
    "プライバシー",
  ];

  return ngWords.some((word) => normalized.includes(normalizeText(word)));
}

function isSameOfferName(a: string, b: string) {
  const normalizedA = normalizeText(a);
  const normalizedB = normalizeText(b);

  if (!normalizedA || !normalizedB) return false;

  return (
    normalizedA === normalizedB ||
    normalizedA.includes(normalizedB) ||
    normalizedB.includes(normalizedA)
  );
}

function inferCategory(name: string): Category {
  const text = normalizeText(name);

  if (
    text.includes("カード") ||
    text.includes("クレカ") ||
    text.includes("visa") ||
    text.includes("jcb") ||
    text.includes("mastercard") ||
    text.includes("amex") ||
    text.includes("paypayカード") ||
    text.includes("楽天カード")
  ) {
    return "クレジットカード";
  }

  if (
    text.includes("証券") ||
    text.includes("投資") ||
    text.includes("nisa") ||
    text.includes("ニーサ") ||
    text.includes("sbi") ||
    text.includes("楽天証券") ||
    text.includes("松井証券") ||
    text.includes("マネックス")
  ) {
    return "証券・投資";
  }

  if (
    text.includes("モバイル") ||
    text.includes("mobile") ||
    text.includes("回線") ||
    text.includes("wifi") ||
    text.includes("wi-fi") ||
    text.includes("光") ||
    text.includes("ドコモ") ||
    text.includes("docomo") ||
    text.includes("au") ||
    text.includes("softbank") ||
    text.includes("ソフトバンク") ||
    text.includes("楽天モバイル")
  ) {
    return "通信・回線";
  }

  if (
    text.includes("ゲーム") ||
    text.includes("アプリ") ||
    text.includes("rpg") ||
    text.includes("三国志") ||
    text.includes("信長") ||
    text.includes("キングダム") ||
    text.includes("パズル") ||
    text.includes("ウォー") ||
    text.includes("クエスト")
  ) {
    return "アプリ・ゲーム";
  }

  if (
    text.includes("amazon") ||
    text.includes("楽天市場") ||
    text.includes("yahoo") ||
    text.includes("ショッピング") ||
    text.includes("qoo10") ||
    text.includes("temu") ||
    text.includes("aliexpress")
  ) {
    return "ショッピング";
  }

  if (
    text.includes("u-next") ||
    text.includes("unext") ||
    text.includes("netflix") ||
    text.includes("hulu") ||
    text.includes("dmm") ||
    text.includes("abema") ||
    text.includes("disney") ||
    text.includes("サブスク") ||
    text.includes("動画")
  ) {
    return "サブスク";
  }

  return "サービス";
}

function getMoppySearchUrl(keyword: string) {
  return `https://pc.moppy.jp/search/?q=${encodeURIComponent(keyword)}`;
}

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
    keywords: [item.title?.toLowerCase() || "", ...(item.tags || [])],
    primary_site_name: item.point_site || "モッピー",
    primary_site_url: item.url || "https://pc.moppy.jp/",
    secondary_site_name: "ポイントインカム",
    secondary_site_url: "https://pointi.jp/",
    reward: item.reward || 0,
    base_score: Math.min(
      100,
      Math.max(60, Math.floor((item.reward || 1000) / 120))
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

    if (!res.ok) return [];

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
          keyword: cleanHtmlText(titleMatch?.[1] ?? ""),
          traffic: trafficMatch?.[1],
        };
      })
      .filter((trend) => trend.keyword);
  } catch {
    return [];
  }
}

function extractSearchResultArea(html: string): string {
  const lowerHtml = html.toLowerCase();
  const markers = ["検索結果", "search_result", "search-result", "result"];

  for (const marker of markers) {
    const index = lowerHtml.indexOf(marker.toLowerCase());

    if (index !== -1) {
      return html.slice(index);
    }
  }

  return html;
}

function extractOfferTitles(html: string): string[] {
  const titlePatterns = [
    /alt="([^"]+)"/g,
    /title="([^"]+)"/g,
    /<h3[^>]*>([\s\S]*?)<\/h3>/g,
    /<h2[^>]*>([\s\S]*?)<\/h2>/g,
    /<strong[^>]*>([\s\S]*?)<\/strong>/g,
  ];

  const titles = new Set<string>();

  for (const pattern of titlePatterns) {
    const matches = [...html.matchAll(pattern)];

    for (const match of matches) {
      const text = cleanTitle(match[1] || "");

      if (!isNoiseTitle(text)) {
        titles.add(text.toLowerCase());
      }
    }
  }

  return [...titles];
}

function extractRewardFromCardText(cardText: string): number {
  const rewardMatches = [
    ...cardText.matchAll(
      /([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{3,7})\s*(p|ポイント|pt)/gi
    ),
  ];

  if (rewardMatches.length !== 1) {
    return 0;
  }

  const reward = Number(rewardMatches[0][1].replace(/,/g, ""));

  if (reward > 0 && reward <= 100000) {
    return reward;
  }

  return 0;
}

function extractRewardNearOffer(html: string, offer: Offer): number {
  const searchResultHtml = extractSearchResultArea(html);

  const cleanedHtml = searchResultHtml
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "");

  const targetTitle = cleanTitle(offer.offer_name).toLowerCase();

  const cardCandidates = cleanedHtml
    .split(/(?=<a\s|<article|<li|<div\s)/i)
    .map((card) => card.trim())
    .filter((card) => card.length >= 100 && card.length <= 5000);

  for (const cardHtml of cardCandidates) {
    const cardText = cleanHtmlText(cardHtml).toLowerCase();

    if (
      cardText.includes("最近見た広告") ||
      cardText.includes("お気に入り広告") ||
      cardText.includes("過去最高還元") ||
      cardText.includes("もっと見る")
    ) {
      continue;
    }

    const titleCandidates: string[] = [];

    const titlePatterns = [
      /alt="([^"]+)"/gi,
      /title="([^"]+)"/gi,
      /<h2[^>]*>([\s\S]*?)<\/h2>/gi,
      /<h3[^>]*>([\s\S]*?)<\/h3>/gi,
      /<strong[^>]*>([\s\S]*?)<\/strong>/gi,
    ];

    for (const pattern of titlePatterns) {
      const matches = [...cardHtml.matchAll(pattern)];

      for (const match of matches) {
        if (match[1]) {
          titleCandidates.push(cleanTitle(match[1]).toLowerCase());
        }
      }
    }

    const ngTitleWords = [
      "ideco",
      "ニーサ",
      "nisa",
      "つみたて",
      "積立",
      "投信",
    ];

    const hasExactTitle = titleCandidates.some((title) => {
      const isStrongMatch =
        title === targetTitle ||
        title.startsWith(targetTitle) ||
        title.includes(`${targetTitle} `) ||
        title.includes(`${targetTitle}　`);

      const hasNgWord = ngTitleWords.some((word) =>
        title.includes(word.toLowerCase())
      );

      return isStrongMatch && !hasNgWord;
    });

    if (!hasExactTitle) continue;

    const reward = extractRewardFromCardText(cardText);

    if (reward > 0) {
      return reward;
    }
  }

  return 0;
}

function extractAutoDiscoveredOffers(
  html: string,
  trend: TrendInfo,
  registeredOffers: Offer[]
): MatchedOffer[] {
  const searchResultHtml = extractSearchResultArea(html);

  const cleanedHtml = searchResultHtml
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "");

  const trendText = normalizeText(trend.keyword);

  const cardCandidates = cleanedHtml
    .split(/(?=<a\s|<article|<li|<div\s)/i)
    .map((card) => card.trim())
    .filter((card) => card.length >= 120 && card.length <= 5000);

  const discovered = new Map<string, MatchedOffer>();

  for (const cardHtml of cardCandidates) {
    const cardText = cleanHtmlText(cardHtml);

    if (
      cardText.includes("最近見た広告") ||
      cardText.includes("お気に入り広告") ||
      cardText.includes("過去最高還元") ||
      cardText.includes("もっと見る")
    ) {
      continue;
    }

    const reward = extractRewardFromCardText(cardText);

    if (reward < 500) {
      continue;
    }

    const titleCandidates: string[] = [];
    const titlePatterns = [
      /alt="([^"]+)"/gi,
      /title="([^"]+)"/gi,
      /<h2[^>]*>([\s\S]*?)<\/h2>/gi,
      /<h3[^>]*>([\s\S]*?)<\/h3>/gi,
      /<strong[^>]*>([\s\S]*?)<\/strong>/gi,
    ];

    for (const pattern of titlePatterns) {
      const matches = [...cardHtml.matchAll(pattern)];

      for (const match of matches) {
        const title = cleanTitle(match[1] || "");

        if (!isNoiseTitle(title)) {
          titleCandidates.push(title);
        }
      }
    }

    const bestTitle = titleCandidates
      .map((title) => title.trim())
      .filter((title) => !isNoiseTitle(title))
      .sort((a, b) => a.length - b.length)[0];

    if (!bestTitle) {
      continue;
    }

    const alreadyRegistered = registeredOffers.some((offer) =>
      isSameOfferName(bestTitle, offer.offer_name)
    );

    if (alreadyRegistered) {
      continue;
    }

    const normalizedTitle = normalizeText(bestTitle);

    let confidence = 0;

    confidence += 35;
    confidence += 20;
    confidence += 10;
    confidence += 10;

    if (
      normalizedTitle.includes(trendText) ||
      trendText.includes(normalizedTitle)
    ) {
      confidence += 20;
    }

    if (reward >= 1000) {
      confidence += 5;
    }

    if (confidence < 80) {
      continue;
    }

    const key = normalizeText(bestTitle);

    if (!key) {
      continue;
    }

    const existing = discovered.get(key);

    const candidate: MatchedOffer = {
      name: bestTitle,
      reward,
      category: inferCategory(bestTitle),
      is_registered: false,
      confidence_score: Math.min(confidence, 100),
    };

    if (!existing || candidate.confidence_score > existing.confidence_score) {
      discovered.set(key, candidate);
    }
  }

  return [...discovered.values()];
}

async function searchMoppyOffers(
  trend: TrendInfo,
  offers: Offer[]
): Promise<MoppySearchResult | null> {
  try {
    const url = getMoppySearchUrl(trend.keyword);

    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PoikatsuAI/1.0; +https://poikatu-ai.vercel.app)",
      },
    });

    if (!res.ok) return null;

    const html = await res.text();

    const noResultTexts = [
      "該当する広告がありません",
      "検索結果がありません",
      "0件",
    ];

    if (noResultTexts.some((text) => html.includes(text))) {
      return null;
    }

    const extractedTitles = extractOfferTitles(html);

    const registeredMatches: MatchedOffer[] = offers
      .filter((offer) => {
        return extractedTitles.some((title) => {
          return (
            isSameOfferName(title, offer.offer_name) ||
            offer.keywords.some((keyword) => isSameOfferName(title, keyword))
          );
        });
      })
      .map((offer) => {
        const extractedReward = extractRewardNearOffer(html, offer);

        return {
          name: offer.offer_name,
          reward: extractedReward > 0 ? extractedReward : offer.reward || 0,
          category: offer.category,
          is_registered: true,
          confidence_score: 100,
        };
      });

    const autoDiscoveredMatches = extractAutoDiscoveredOffers(
      html,
      trend,
      offers
    );

    const merged = [...registeredMatches];

    for (const autoOffer of autoDiscoveredMatches) {
      const alreadyExists = merged.some((item) =>
        isSameOfferName(item.name, autoOffer.name)
      );

      if (!alreadyExists) {
        merged.push(autoOffer);
      }
    }

    if (merged.length === 0) return null;

    return {
      trend,
      offers: merged,
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

function dedupeRankings(rankings: RankingItem[]) {
  const seen = new Set<string>();
  const result: RankingItem[] = [];

  for (const item of rankings) {
    const key = normalizeText(item.offer_name);

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
}

async function syncOffersFromAutoDiscovery(
  matchedResults: MoppySearchResult[],
  registeredOffers: Offer[]
): Promise<OfferSyncResult> {
  const existingKeys = new Set(
    registeredOffers.map((offer) => normalizeText(offer.offer_name))
  );

  const autoCandidates = new Map<
    string,
    {
      name: string;
      reward: number;
      category: Category;
      confidence_score: number;
      trend_keyword: string;
    }
  >();

  for (const result of matchedResults) {
    for (const offer of result.offers) {
      if (offer.is_registered) {
        continue;
      }

      if (offer.confidence_score < 90) {
        continue;
      }

      if (offer.reward < 500) {
        continue;
      }

      const key = normalizeText(offer.name);

      if (!key || existingKeys.has(key)) {
        continue;
      }

      const existingCandidate = autoCandidates.get(key);

      if (
        !existingCandidate ||
        offer.confidence_score > existingCandidate.confidence_score
      ) {
        autoCandidates.set(key, {
          name: offer.name,
          reward: offer.reward,
          category: offer.category,
          confidence_score: offer.confidence_score,
          trend_keyword: result.trend.keyword,
        });
      }
    }
  }

  const insertRows = [...autoCandidates.values()].map((offer) => ({
    title: offer.name,
    category: offer.category,
    tags: [
      "AI自動発見",
      "Googleトレンド",
      offer.trend_keyword,
      offer.category,
    ],
    point_site: "モッピー",
    url: getMoppySearchUrl(offer.name),
    reward: offer.reward,
    is_active: true,
  }));

  if (insertRows.length === 0) {
    return {
      inserted: 0,
      updated: 0,
      skipped: 0,
    };
  }

  const { error } = await supabase.from("offers").insert(insertRows);

  if (error) {
    console.error("auto offers insert error", error);

    return {
      inserted: 0,
      updated: 0,
      skipped: insertRows.length,
    };
  }

  return {
    inserted: insertRows.length,
    updated: 0,
    skipped: 0,
  };
}

async function updateRegisteredOfferRewards(
  matchedResults: MoppySearchResult[],
  registeredOffers: Offer[]
): Promise<OfferSyncResult> {
  let updated = 0;
  let skipped = 0;

  const rewardUpdates = new Map<
    string,
    {
      title: string;
      reward: number;
    }
  >();

  for (const result of matchedResults) {
    for (const matchedOffer of result.offers) {
      if (!matchedOffer.is_registered) {
        continue;
      }

      if (matchedOffer.reward <= 0) {
        continue;
      }

      const registeredOffer = registeredOffers.find((offer) =>
        isSameOfferName(offer.offer_name, matchedOffer.name)
      );

      if (!registeredOffer) {
        continue;
      }

      if (registeredOffer.reward === matchedOffer.reward) {
        skipped += 1;
        continue;
      }

      const key = normalizeText(registeredOffer.offer_name);

      rewardUpdates.set(key, {
        title: registeredOffer.offer_name,
        reward: matchedOffer.reward,
      });
    }
  }

  for (const update of rewardUpdates.values()) {
    const { error } = await supabase
      .from("offers")
      .update({
        reward: update.reward,
        is_active: true,
      })
      .eq("title", update.title);

    if (error) {
      console.error("offer reward update error", error);
      skipped += 1;
      continue;
    }

    updated += 1;
  }

  return {
    inserted: 0,
    updated,
    skipped,
  };
}

async function syncOffers(
  matchedResults: MoppySearchResult[],
  registeredOffers: Offer[]
): Promise<OfferSyncResult> {
  try {
    const autoInsertResult = await syncOffersFromAutoDiscovery(
      matchedResults,
      registeredOffers
    );

    const rewardUpdateResult = await updateRegisteredOfferRewards(
      matchedResults,
      registeredOffers
    );

    return {
      inserted: autoInsertResult.inserted,
      updated: rewardUpdateResult.updated,
      skipped: autoInsertResult.skipped + rewardUpdateResult.skipped,
    };
  } catch (error) {
    console.error("offers sync error", error);

    return {
      inserted: 0,
      updated: 0,
      skipped: 0,
    };
  }
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

    const now = new Date().toISOString();

    const registeredRankings: RankingItem[] = offers.map((offer) => {
      const matchedResult = matchedResults.find((result) =>
        result.offers.some(
          (matchedOffer) =>
            matchedOffer.is_registered &&
            isSameOfferName(matchedOffer.name, offer.offer_name)
        )
      );

      const matchedOffer = matchedResult?.offers.find(
        (matchedOffer) =>
          matchedOffer.is_registered &&
          isSameOfferName(matchedOffer.name, offer.offer_name)
      );

      const trend = matchedResult?.trend;
      const isTrendMatched = !!trend;
      const reward = matchedOffer?.reward || offer.reward || 0;

      const rewardScore = Math.min(20, Math.floor(reward / 1000));

      const score = Math.max(
        1,
        Math.min(
          100,
          offer.base_score +
            rewardScore +
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
        reward,
        reason: isTrendMatched
          ? `${offer.offer_name} は現在のGoogleトレンド検索とモッピー掲載案件の両方に一致しており、特に注目度が高い案件です。`
          : `${offer.offer_name} は定番人気のポイ活案件です。`,
        primary_site_name: offer.primary_site_name,
        primary_site_url: offer.primary_site_url,
        secondary_site_name: offer.secondary_site_name,
        secondary_site_url: offer.secondary_site_url,
        updated_at: now,
      };
    });

    const autoDiscoveredRankings: RankingItem[] = matchedResults
      .flatMap((result) =>
        result.offers
          .filter((offer) => !offer.is_registered)
          .map((offer) => {
            const rewardScore = Math.min(20, Math.floor(offer.reward / 1000));
            const confidenceBonus = Math.floor(
              Math.max(0, offer.confidence_score - 60) / 2
            );

            const score = Math.max(
              1,
              Math.min(
                100,
                62 +
                  rewardScore +
                  confidenceBonus +
                  getTrafficBonus(result.trend.traffic) +
                  12
              )
            );

            return {
              rank: 0,
              offer_name: offer.name,
              category: offer.category,
              score,
              final_score: score,
              trend_keyword: result.trend.keyword,
              trend_traffic: result.trend.traffic ?? null,
              reward: offer.reward,
              reason: `${offer.name} はGoogleトレンドで話題の「${result.trend.keyword}」から検出され、モッピー検索結果でも報酬ポイントが確認できたAI自動発見案件です。`,
              primary_site_name: "モッピー",
              primary_site_url: getMoppySearchUrl(offer.name),
              secondary_site_name: "モッピー",
              secondary_site_url: MOPPY_URL,
              updated_at: now,
            };
          })
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);

    const baseRankings = dedupeRankings([
      ...autoDiscoveredRankings,
      ...registeredRankings,
    ]);

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

    const offerSyncResult = await syncOffers(matchedResults, offers);

    const trendRows = rankings
      .map((ranking, index) => ({
        word: ranking.offer_name,
        score: Math.max(100 - index * 2, 40),
        category: ranking.category || "ポイ活",
      }))
      .filter(
        (item, index, self) =>
          index ===
          self.findIndex(
            (t) => normalizeText(t.word) === normalizeText(item.word)
          )
      )
      .slice(0, 50);

    if (trendRows.length > 0) {
      await supabase.from("trends").delete().neq("word", "");
      await supabase.from("trends").insert(trendRows);
    }

    const autoDiscoveredCount = rankings.filter((ranking) =>
      autoDiscoveredRankings.some((autoRanking) =>
        isSameOfferName(autoRanking.offer_name, ranking.offer_name)
      )
    ).length;

    return Response.json({
      message: "ランキング更新完了",
      count: rankings.length,
      trends_count: trendRows.length,
      auto_discovered_count: autoDiscoveredCount,
      registered_count: rankings.length - autoDiscoveredCount,
      offers_inserted_count: offerSyncResult.inserted,
      offers_updated_count: offerSyncResult.updated,
      offers_sync_skipped_count: offerSyncResult.skipped,
      trends_source:
        matchedResults.length > 0
          ? "google_trends_moppy_auto_discovery"
          : "fallback_offers",
      trends_debug: matchedResults[0]?.trend.keyword ?? null,
      matched_offers_debug:
        matchedResults[0]?.offers.map((offer) => ({
          name: offer.name,
          reward: offer.reward,
          category: offer.category,
          is_registered: offer.is_registered,
          confidence_score: offer.confidence_score,
        })) ?? [],
      top_categories: rankings.slice(0, 5).map((r) => r.category),
    });
  } catch (error) {
    console.error("update rankings error", error);

    return Response.json(
      {
        error: "ランキング更新中にエラーが発生しました",
      },
      { status: 500 }
    );
  }
}
