import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TREND_LIMIT = 50;
const BACKFILL_KEYWORD = "モッピー確認済み案件";

type RankingTrendRow = {
  trend_keyword?: string | null;
  offer_name?: string | null;
  final_score?: number | null;
  category?: string | null;
};

const normalizeSpaces = (value: string) => value.replace(/\s+/g, " ").trim();

const OFFER_KEYWORD_RULES: Array<[RegExp, string]> = [
  [/SBI\s*FX|SBI.*FX/i, "SBI FXトレード"],
  [/SBI.*証券/i, "SBI証券"],
  [/楽天証券/, "楽天証券"],
  [/楽天銀行/, "楽天銀行 口座開設"],
  [/楽天モバイル/, "楽天モバイル"],
  [/au\s*ひかり|auひかり/i, "auひかり"],
  [/ahamo/i, "ahamo"],
  [/povo/i, "povo"],
  [/U-?NEXT/i, "U-NEXT"],
  [/coin\s*together/i, "coin together"],
  [/JP\s*リターンズ|JPリターンズ/i, "JPリターンズ"],
  [/プロパティエージェント/, "プロパティエージェント"],
  [/CREAL/i, "CREAL"],
  [/チクフル/, "チクフル不動産投資"],
  [/CAMEL/i, "CAMEL"],
  [/モバレコ\s*Air|モバレコAir/i, "モバレコAir"],
  [/ソフトバンク\s*Air|SoftBank\s*Air/i, "ソフトバンクAir"],
  [/ドコモ\s*mini|ドコモミニ/i, "ドコモmini"],
  [/グローバル\s*WiFi|グローバルWiFi/i, "グローバルWiFi"],
  [/apollostation|アポロステーション/i, "apollostation THE PLATINUM"],
  [/アメリカン.*エキスプレス.*ゴールド.*プリファード/i, "アメリカン・エキスプレス・ゴールド・プリファード・カード"],
];

const toSearchLikeOfferKeyword = (offerName: string) => {
  const normalizedOfferName = normalizeSpaces(offerName);
  if (!normalizedOfferName) return "";

  const matchedRule = OFFER_KEYWORD_RULES.find(([pattern]) =>
    pattern.test(normalizedOfferName)
  );
  if (matchedRule) return matchedRule[1];

  const cleaned = normalizeSpaces(
    normalizedOfferName
      .replace(/【[^】]*】/g, " ")
      .replace(/\[[^\]]*\]/g, " ")
      .replace(/（[^）]*）/g, " ")
      .replace(/\([^)]*\)/g, " ")
      .replace(/[「」『』★☆]/g, " ")
      .replace(/^[\s_・:：-]*(PR|超還元|高還元|無料|公式)\s*/i, " ")
      .replace(/年収\s*[0-9０-９,，]+\s*万円以上/gi, " ")
      .replace(/[0-9０-９,，]+\s*P/gi, " ")
      .replace(/無料(個別)?(WEB)?面談/gi, " ")
      .replace(/個別面談|WEB面談|ご相談なら|ご相談|投資完了|新規|のみ対象/gi, " ")
      .replace(/[＿_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );

  if (!cleaned) return normalizedOfferName;

  const firstPhrase = cleaned
    .split(/[｜|／/、。!！?？]/)
    .map((part) => part.trim())
    .find(Boolean);

  return firstPhrase || cleaned;
};

const toDisplayKeyword = (item: RankingTrendRow) => {
  const trendKeyword = (item.trend_keyword || "").trim();
  const offerName = (item.offer_name || "").trim();

  if (trendKeyword && trendKeyword !== BACKFILL_KEYWORD) {
    return normalizeSpaces(trendKeyword);
  }

  return toSearchLikeOfferKeyword(offerName);
};

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("rankings")
      .select("trend_keyword, offer_name, final_score, category")
      .order("rank", { ascending: true })
      .limit(100);

    if (error) {
      throw error;
    }

    const seen = new Set<string>();
    const words = ((data || []) as RankingTrendRow[])
      .map((item, index) => ({
        item,
        index,
        word: toDisplayKeyword(item),
      }))
      .filter(({ word }) => Boolean(word))
      .filter(({ word }) => {
        const key = word.toLowerCase().replace(/\s+/g, "");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, TREND_LIMIT)
      .map(({ item, index, word }) => ({
        word,
        score: item.final_score ?? Math.max(100 - index * 2, 10),
        category: item.category ?? "Google検索由来",
      }));

    return NextResponse.json({ data: words });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 }
    );
  }
}
