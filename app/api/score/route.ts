import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("rankings")
      .select("*")
      .order("rank", { ascending: true })
      .limit(50);

    if (error) {
      console.error(error);
      return Response.json(
        { error: "ランキング取得に失敗しました" },
        { status: 500 }
      );
    }

    const formatted = (data || []).map((item, index) => ({
      rank: item.rank ?? index + 1,

      offer_name:
        item.offer_name ||
        item.trend_keyword ||
        item.category ||
        `おすすめ案件 ${index + 1}`,

      category: item.category ?? "その他",
      trend_keyword: item.trend_keyword ?? item.offer_name ?? item.category,

      reason:
        item.description ||
        item.reason ||
        "Googleトレンドや検索動向をもとに、AIが注目度の高い案件として判定しました。",

      primary_site_name: item.primary_site_name ?? "モッピー",
      primary_site_url: item.primary_site_url ?? "https://pc.moppy.jp/",

      secondary_site_name: item.secondary_site_name ?? "ポイントインカム",
      secondary_site_url: item.secondary_site_url ?? "https://pointi.jp/",

      updated_at: item.updated_at,
    }));

    return Response.json({
      data: formatted,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
