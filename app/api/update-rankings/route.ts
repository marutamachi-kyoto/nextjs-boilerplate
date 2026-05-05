import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// トレンド取得
async function getTrends() {
  const res = await fetch(
    "https://trends.google.com/trends/trendingsearches/daily/rss?geo=JP",
    { cache: "no-store" }
  );
  const xml = await res.text();

  return [...xml.matchAll(/<title><!\[CDATA\[(.*?)\]\]><\/title>/g)]
    .map((m) => m[1])
    .slice(1);
}

// 最高報酬だけ抽出
function getBestOffers(offers: any[]) {
  const map = new Map();

  for (const o of offers) {
    const key = `${o.category}-${o.title}`;
    const current = map.get(key);

    if (!current || o.reward > current.reward) {
      map.set(key, o);
    }
  }

  return Array.from(map.values());
}

// スコア計算
function calcScore(offer: any, trends: string[]) {
  let trendScore = 0;

  for (const t of trends) {
    if (t.includes(offer.title)) {
      trendScore += 1.5;
    }
  }

  const rewardScore = offer.reward / 30000;
  const easeScore = (6 - (offer.difficulty || 3)) / 5;

  return rewardScore * 0.6 + trendScore * 0.3 + easeScore * 0.1;
}

export async function GET() {
  // DB取得
  const { data: offers, error } = await supabase
    .from("offers")
    .select("*");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // トレンド
  const trends = await getTrends();

  // 比較
  const best = getBestOffers(offers || []);

  // スコア付け
const ranked = best
  .map((o) => ({
    offer_title: o.title,
    category: o.category,
    point_site: o.point_site,
    reward: o.reward,
    url: o.url,
    tags: o.tags || [],
    reward_score: o.reward / 30000,
    trend_score: 0,
    ease_score: (6 - (o.difficulty || 3)) / 5,
    final_score: calcScore(o, trends),
  }))
  .sort((a, b) => b.final_score - a.final_score)
  .map((o, i) => ({
    ...o,
    rank: i + 1,
  }));

  // 全削除 → 再登録
  await supabase.from("rankings").delete().neq("id", "0");

  const { error: insertError } = await supabase
    .from("rankings")
    .insert(ranked);

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 });
  }

  return Response.json({
    status: "ok",
    count: ranked.length,
  });
}
