import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MOPPY_SEARCH_BASE_URL = "https://pc.moppy.jp/search/?q=";
const MOPPY_ORIGIN = "https://pc.moppy.jp";

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
    .replace(/[・･\-_｜|【】\[\]（）()「」『』]/g, "")
    .replace(/ポイント/g, "pt")
    .replace(/ｐ/g, "p")
    .trim();
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
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    .replace(/[,，]/g, "");
}

function extractRewardHits(text: string, minReward = 100): RewardHit[] {
  const matches = [
    ...text.matchAll(/([0-9０-９,，]+)\s*(?:P|ｐ|ポイント|pt)/gi),
  ];

  return matches
    .map((match) => ({
      value: Number(toHalfWidthNumber(match[1])),
      index: match.index ?? 0,
    }))
    .filter((hit) => Number.isFinite(hit.value) && hit.value >= minReward);
}

function extractUniqueRewardFromText(text: string, minReward = 100): number | null {
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
    .replace(/[・･\-_｜|【】\[\]（）()「」『』]/g, "")
    .trim();
  if (withoutSymbols) set.add(withoutSymbols);

  const tokens = base
    .split(/[　\s・･\-_｜|【】\[\]（）()「」『』:：]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

  for (const token of tokens) {
    set.add(token);
  }

  return Array.from(set)
    .filter((value) => value.length >= 2)
    .sort((a, b) => b.length - a.length);
}

function extractNearestRewardNearKeywordFromText(
  text: string,
  keyword: string,
  minReward = 100,
  windowSize = 1600
): number | null {
  if (!text || !keyword) return null;

  const lowerText = text.toLowerCase();
  const variants = getKeywordVariants(keyword).map((value) => value.toLowerCase());

  let bestReward: number | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const variant of variants.slice(0, 10)) {
    let startIndex = 0;
    let hitCount = 0;

    while (hitCount < 8) {
      const keywordIndex = lowerText.indexOf(variant, startIndex);
      if (keywordIndex === -1) break;

      hitCount += 1;

      const windowStart = Math.max(0, keywordIndex - windowSize);
      const windowEnd = Math.min(text.length, keywordIndex + variant.length + windowSize);
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

async function fetchMoppyPage(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
  });

  if (!response.ok) return "";

  return await response.text();
}

async function fetchMoppySearch(keyword: string) {
  return await fetchMoppyPage(`${MOPPY_SEARCH_BASE_URL}${encodeURIComponent(keyword)}`);
}

function toMoppyUrl(href: string) {
  try {
    const url = new URL(href, MOPPY_ORIGIN);
    if (url.hostname !== "pc.moppy.jp") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function extractMoppyDetailLinks(html: string, keyword: string) {
  const variants = getKeywordVariants(keyword).map(normalizeName);
  const links: string[] = [];
  const seen = new Set<string>();
  const matches = [...html.matchAll(/href=["']([^"']+)["']/gi)];

  for (const match of matches) {
    const href = match[1];
    if (!href || href.startsWith("#") || /^javascript:/i.test(href)) continue;

    const url = toMoppyUrl(href);
    if (!url || seen.has(url)) continue;

    const index = match.index ?? 0;
    const aroundHtml = html.slice(Math.max(0, index - 800), Math.min(html.length, index + 800));
    const aroundText = normalizeName(stripHtml(aroundHtml));
    const urlText = normalizeName(decodeURIComponent(url));
    const looksLikeDetail = /ad|detail|adDetail|service|shopping|card|credit|contents/i.test(url);
    const hasKeywordNearby = variants.some((variant) => {
      return variant && (aroundText.includes(variant) || urlText.includes(variant));
    });

    if (!looksLikeDetail && !hasKeywordNearby) continue;
    if (/login|entry|invite|help|guide|support|faq|inquiry|privacy|rule/i.test(url)) continue;

    seen.add(url);
    links.push(url);

    if (links.length >= 5) break;
  }

  return links;
}

async function getVerifiedMoppyReward(keyword: string): Promise<number | null> {
  if (!keyword) return null;

  try {
    const searchHtml = await fetchMoppySearch(keyword);
    const searchText = stripHtml(searchHtml);

    const nearestReward = extractNearestRewardNearKeywordFromText(searchText, keyword, 100, 1600);
    if (nearestReward) return nearestReward;

    const uniqueSearchReward = extractUniqueRewardFromText(searchText, 100);
    if (uniqueSearchReward) return uniqueSearchReward;

    const detailLinks = extractMoppyDetailLinks(searchHtml, keyword);

    for (const detailUrl of detailLinks.slice(0, 3)) {
      const detailHtml = await fetchMoppyPage(detailUrl);
      const detailText = stripHtml(detailHtml);

      const nearestDetailReward = extractNearestRewardNearKeywordFromText(
        detailText,
        keyword,
        100,
        2200
      );
      if (nearestDetailReward) return nearestDetailReward;

      const uniqueDetailReward = extractUniqueRewardFromText(detailText, 100);
      if (uniqueDetailReward) return uniqueDetailReward;
    }

    return null;
  } catch (error) {
    console.error(`Moppy reward verification failed: ${keyword}`, error);
    return null;
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>
) {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("rankings")
      .select("*")
      .order("updated_at", { ascending: false })
      .order("rank", { ascending: true })
      .limit(50);

    if (error) {
      console.error(error);
      return Response.json(
        { error: "ランキング取得に失敗しました" },
        { status: 500 }
      );
    }

    const formatted = await mapWithConcurrency(data || [], 4, async (item, index) => {
      const offerName =
        item.offer_name ||
        item.trend_keyword ||
        item.category ||
        `おすすめ案件 ${index + 1}`;

      const storedReward = item.reward ?? 0;
      const verifiedReward =
        !storedReward || storedReward <= 0
          ? await getVerifiedMoppyReward(offerName)
          : null;

      return {
        rank: item.rank ?? index + 1,

        offer_name: offerName,

        category: item.category ?? "その他",
        trend_keyword: item.trend_keyword ?? item.offer_name ?? item.category,

        reward: storedReward && storedReward > 0 ? storedReward : verifiedReward ?? 0,

        reason:
          item.description ||
          item.reason ||
          "Googleトレンドや検索動向をもとに、AIが注目度の高い案件として判定しました。",

        primary_site_name: item.primary_site_name ?? "モッピー",
        primary_site_url: item.primary_site_url ?? "https://pc.moppy.jp/",

        secondary_site_name: item.secondary_site_name ?? "ポイントインカム",
        secondary_site_url: item.secondary_site_url ?? "https://pointi.jp/",

        updated_at: item.updated_at,
      };
    });

    return Response.json({
      data: formatted,
      reward_source: "stored_or_verified_moppy",
      reward_missing_backfill_enabled: true,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
