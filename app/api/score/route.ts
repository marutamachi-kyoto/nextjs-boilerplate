import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const RANKING_LIMIT = 50;
const BACKFILL_KEYWORD = "モッピー確認済み案件";

const CANONICAL_MOPPY_OFFERS = [
  {
    title: "SBI証券【FX】",
    url: "https://pc.moppy.jp/ad/detail.php?site_id=155068&track_ref=ts",
    reward: 17000,
  },
  {
    title: "SBI証券 確定拠出年金 iDeCo",
    url: "https://pc.moppy.jp/ad/detail.php?s_id=141744",
    reward: 2500,
  },
  {
    title: "SBI FXトレード",
    url: "https://pc.moppy.jp/ad/detail.php?site_id=159880&track_ref=ts",
    reward: 3500,
  },
  {
    title: "【超還元】DMM TV",
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
    .replace(/[「」『』【】\[\]（）()・･]/g, "")
    .replace(/[ーｰ−]/g, "-")
    .trim();
};

const getCanonicalOffer = (item: RankingItem) => {
  const text = [item.offer_name, item.trend_keyword, item.category, item.primary_site_url]
    .map(normalizeText)
    .join(" ");

  if (text.includes("155068") || text.includes("sbi証券fx")) {
    return CANONICAL_MOPPY_OFFERS[0];
  }

  if (
    text.includes("141744") ||
    (text.includes("sbi証券") &&
      (text.includes("ideco") || text.includes("確定拠出年金")))
  ) {
    return CANONICAL_MOPPY_OFFERS[1];
  }

  if (text.includes("159880") || text.includes("sbifxトレード")) {
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
  const keyword = toDisplayKeyword(item, offerName);
  return `Googleの検索で「${keyword}」も一緒に調べられています。`;
};

const formatItem = (item: RankingItem, index: number) => {
  const canonicalOffer = getCanonicalOffer(item);
  const offerName =
    item.offer_name ||
    item.trend_keyword ||
    item.category ||
    canonicalOffer?.title ||
    `おすすめ案件 ${index + 1}`;
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
    primary_site_name: "モッピー",
    primary_site_url: directUrl || null,
    secondary_site_name: item.secondary_site_name || "ポイントインカム",
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
        { data: [], error: "ランキング取得に失敗しました" },
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
      { data: [], error: "サーバーエラーが発生しました" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  }
}
