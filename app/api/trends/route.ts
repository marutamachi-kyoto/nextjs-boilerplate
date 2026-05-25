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

const normalizeKey = (value: string) =>
  normalizeSpaces(value)
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[・･]/g, "")
    .replace(/[ーｰ−]/g, "-")
    .trim();

const BROAD_SEARCH_PREFIXES = [
  "ポイ活",
  "ポイントサイト",
  "モッピー",
  "無料 ポイ活",
  "無料でできる ポイ活",
  "お金をかけない ポイ活",
];

const OFFER_KEYWORD_RULES: Array<[RegExp, string]> = [
  [/出光カード/i, "出光カード"],
  [/apollostation|アポロステーション/i, "出光カード"],
  [/SBI\s*FX|SBI.*FX/i, "SBI FXトレード"],
  [/SBI.*証券/i, "SBI証券"],
  [/楽天証券/, "楽天証券"],
  [/楽天銀行/, "楽天銀行"],
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
  [/セカンドオピニオン|不動産会社で相談中/i, "不動産投資 セカンドオピニオン"],
  [/モバレコ\s*Air|モバレコAir/i, "モバレコAir"],
  [/ソフトバンク\s*Air|SoftBank\s*Air/i, "ソフトバンクAir"],
  [/ドコモ\s*mini|ドコモミニ/i, "ドコモmini"],
  [/グローバル\s*WiFi|グローバルWiFi/i, "グローバルWiFi"],
  [/コミュファ光/i, "コミュファ光"],
  [/ビッグローブ光|BIGLOBE光/i, "ビッグローブ光"],
  [/GMOとくとくBB.*ドコモ光|ドコモ光.*GMOとくとくBB/i, "GMOとくとくBB ドコモ光"],
  [/おてがる光クロス/i, "おてがる光クロス"],
  [/ドコモ光/i, "ドコモ光"],
  [/WiFi革命セット/i, "WiFi革命セット"],
  [/WiMAX.*5G/i, "WiMAX +5G"],
  [/FXブロードネット/i, "FXブロードネット"],
  [/三菱UFJ.*スマート証券.*FX/i, "三菱UFJ eスマート証券 FX"],
  [/みんなのFX/i, "みんなのFX"],
  [/LIGHT\s*FX/i, "LIGHT FX"],
  [/外為どっとコム/i, "外為どっとコム"],
  [/イオンカードセレクト/i, "イオンカードセレクト"],
  [/サクページ/i, "サクページ"],
  [/愛車.*高価買取|車.*買取/i, "車買取"],
  [/アメリカン.*エキスプレス.*ゴールド.*プリファード/i, "アメリカン・エキスプレス・ゴールド・プリファード・カード"],
];

const isBroadSearchSeed = (keyword: string) => {
  const normalized = normalizeKey(keyword);
  return BROAD_SEARCH_PREFIXES.some((prefix) => normalized.startsWith(normalizeKey(prefix)));
};

const looksLikeOfferCopy = (keyword: string) => {
  return /年収|万円以上|無料個別|WEB面談|ご相談|相談中|オススメ|対象|投資完了|高還元|超還元|合計|PR/i.test(
    keyword
  );
};

const looksLikeNoteFragment = (keyword: string) => {
  const text = normalizeSpaces(keyword);
  return /^[※*＊]?\s*[0-9０-９]+$/.test(text) || /^[※*＊]+$/.test(text);
};

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
      .replace(/[+＋].*$/g, " ")
      .replace(/^[\s_・:：-]*(PR|超還元|高還元|無料|公式)\s*/i, " ")
      .replace(/年収\s*[0-9０-９,，]+\s*万円以上/gi, " ")
      .replace(/[0-9０-９,，]+\s*P/gi, " ")
      .replace(/無料(個別)?(WEB)?面談/gi, " ")
      .replace(/個別面談|WEB面談|ご相談なら|ご相談|投資完了|新規|のみ対象/gi, " ")
      .replace(/[＿_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );

  if (!cleaned || looksLikeOfferCopy(cleaned) || looksLikeNoteFragment(cleaned)) return "";

  const firstPhrase = cleaned
    .split(/[｜|／/、。!！?？]/)
    .map((part) => part.trim())
    .find(Boolean);

  const keyword = firstPhrase || cleaned;
  if (looksLikeOfferCopy(keyword) || looksLikeNoteFragment(keyword)) return "";
  if (keyword.length > 28) return "";

  return keyword;
};

const isDisplayableKeyword = (keyword: string) => {
  if (!keyword) return false;
  if (looksLikeNoteFragment(keyword)) return false;
  const key = normalizeKey(keyword);
  if (key.length < 2) return false;
  return /[a-z\u3040-\u30ff\u3400-\u9fff]/i.test(keyword);
};

const toDisplayKeyword = (item: RankingTrendRow) => {
  const trendKeyword = (item.trend_keyword || "").trim();
  const offerName = (item.offer_name || "").trim();
  const offerKeyword = toSearchLikeOfferKeyword(offerName);

  if (!trendKeyword || trendKeyword === BACKFILL_KEYWORD) {
    return offerKeyword;
  }

  if (
    isBroadSearchSeed(trendKeyword) &&
    offerKeyword &&
    !normalizeKey(trendKeyword).includes(normalizeKey(offerKeyword))
  ) {
    return offerKeyword;
  }

  return normalizeSpaces(trendKeyword);
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
      .filter(({ word }) => isDisplayableKeyword(word))
      .filter(({ word }) => {
        const key = normalizeKey(word);
        if (!key || seen.has(key)) return false;
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
