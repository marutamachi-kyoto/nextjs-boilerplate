import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const RANKING_LIMIT = 50;
const BACKFILL_KEYWORD = "\u30e2\u30c3\u30d4\u30fc\u78ba\u8a8d\u6e08\u307f\u6848\u4ef6";

const CANONICAL_MOPPY_OFFERS = [
  {
    title: "SBI\u8a3c\u5238\u3010FX\u3011",
    url: "https://pc.moppy.jp/ad/detail.php?site_id=155068&track_ref=ts",
    reward: 17000,
  },
  {
    title: "SBI\u8a3c\u5238 \u78ba\u5b9a\u62e0\u51fa\u5e74\u91d1 iDeCo",
    url: "https://pc.moppy.jp/ad/detail.php?s_id=141744",
    reward: 2500,
  },
  {
    title: "SBI FX\u30c8\u30ec\u30fc\u30c9",
    url: "https://pc.moppy.jp/ad/detail.php?site_id=159880&track_ref=ts",
    reward: 3500,
  },
  {
    title: "\u3010\u8d85\u9084\u5143\u3011DMM TV",
    url: "https://pc.moppy.jp/ad/detail.php?site_id=154516&track_ref=ts",
    reward: 650,
  },
];

type RankingItem = {
  rank?: number | null;
  offer_name?: string | null;
  trend_keyword?: string | null;
  category?: string | null;
  reward?: number | null;
  reason?: string | null;
  image_url?: string | null;
  primary_site_name?: string | null;
  primary_site_url?: string | null;
  secondary_site_name?: string | null;
  secondary_site_url?: string | null;
  updated_at?: string | null;
};

const normalizeText = (text?: string | null) => {
  return (text || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[\u300c\u300d\u300e\u300f\u3010\u3011\[\]\uff08\uff09()\u30fb\uff65]/g, "")
    .replace(/[\u30fc\uff70\u2212]/g, "-")
    .trim();
};

const getCanonicalOffer = (item: RankingItem) => {
  const text = [item.offer_name, item.trend_keyword, item.category, item.primary_site_url]
    .map(normalizeText)
    .join(" ");

  if (text.includes("155068") || text.includes("sbi\u8a3c\u5238fx")) {
    return CANONICAL_MOPPY_OFFERS[0];
  }

  if (
    text.includes("141744") ||
    (text.includes("sbi\u8a3c\u5238") &&
      (text.includes("ideco") || text.includes("\u78ba\u5b9a\u62e0\u51fa\u5e74\u91d1")))
  ) {
    return CANONICAL_MOPPY_OFFERS[1];
  }

  if (text.includes("159880") || text.includes("sbifx\u30c8\u30ec\u30fc\u30c9")) {
    return CANONICAL_MOPPY_OFFERS[2];
  }

  if (text.includes("154516") || text.includes("dmmtv")) {
    return CANONICAL_MOPPY_OFFERS[3];
  }

  return null;
};

const isMoppyDetailUrl = (url?: string | null) => {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return parsed.hostname === "pc.moppy.jp" && parsed.pathname === "/ad/detail.php";
  } catch {
    return false;
  }
};

const toDisplayKeyword = (item: RankingItem, offerName: string) => {
  const trendKeyword = (item.trend_keyword || "").trim();
  if (!trendKeyword || trendKeyword === BACKFILL_KEYWORD) return offerName;
  return trendKeyword.replace(/\s+/g, " ").trim();
};

const buildReason = (item: RankingItem, offerName: string) => {
  if (item.reason) return item.reason;
  const keyword = toDisplayKeyword(item, offerName);
  return `${offerName}\u306f\u3001Google\u306e\u691c\u7d22\u3067\u300c${keyword}\u300d\u3082\u4e00\u7dd2\u306b\u8abf\u3079\u3089\u308c\u3066\u3044\u307e\u3059\u3002`;
};

const formatItem = (item: RankingItem, index: number) => {
  const canonicalOffer = getCanonicalOffer(item);
  const offerName =
    item.offer_name ||
    item.trend_keyword ||
    item.category ||
    canonicalOffer?.title ||
    `\u304a\u3059\u3059\u3081\u6848\u4ef6 ${index + 1}`;
  const directUrl = isMoppyDetailUrl(item.primary_site_url)
    ? item.primary_site_url
    : canonicalOffer?.url;

  return {
    rank: item.rank || index + 1,
    offer_name: offerName,
    category: toDisplayKeyword(item, offerName),
    trend_keyword: toDisplayKeyword(item, offerName),
    reward: canonicalOffer?.reward || item.reward || 0,
    reason: buildReason(item, offerName),
    image_url: item.image_url || null,
    primary_site_name: "\u30e2\u30c3\u30d4\u30fc",
    primary_site_url: directUrl || null,
    secondary_site_name: item.secondary_site_name || "\u30dd\u30a4\u30f3\u30c8\u30a4\u30f3\u30ab\u30e0",
    secondary_site_url: item.secondary_site_url || "https://pointi.jp/",
    updated_at: item.updated_at,
  };
};

export async function GET() {
  try {
    const rankingResult = await supabase
      .from("rankings")
      .select("*")
      .order("rank", { ascending: true })
      .limit(RANKING_LIMIT);

    if (rankingResult.error) {
      console.error(rankingResult.error);
      return Response.json(
        { data: [], error: "\u30e9\u30f3\u30ad\u30f3\u30b0\u53d6\u5f97\u306b\u5931\u6557\u3057\u307e\u3057\u305f" },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          },
        }
      );
    }

    const sourceItems = Array.isArray(rankingResult.data)
      ? (rankingResult.data as RankingItem[])
      : [];

    return Response.json(
      { data: sourceItems.map(formatItem) },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      { data: [], error: "\u30b5\u30fc\u30d0\u30fc\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  }
}
