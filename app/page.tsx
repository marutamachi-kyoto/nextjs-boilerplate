"use client";

import { useEffect, useState } from "react";

type CategoryScore = {
  id?: string;
  category: string;
  rank: number;
  trend_keyword: string;
  reward_min: number;
  reward_max: number;
  difficulty_label: string;
  heat_level: number;
  final_score: number;
  rise_rate?: number;
  reason: string;
  primary_site_name: string;
  primary_site_url: string;
  secondary_site_name?: string | null;
  secondary_site_url?: string | null;
  updated_at?: string;
};

function stars(level: number) {
  const safe = Math.max(1, Math.min(5, Number(level) || 1));
  return "★".repeat(safe) + "☆".repeat(5 - safe);
}

function difficultyStars(label: string) {
  if (label === "低") return "★☆☆";
  if (label === "中") return "★★☆";
  return "★★★";
}

async function trackClick(category: string, siteName: string, url: string) {
  try {
    await fetch("/api/click", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        category,
        site_name: siteName,
      }),
    });
  } catch (error) {
    console.error("click tracking failed:", error);
  }

  window.open(url, "_blank");
}

export default function Page() {
  const [scores, setScores] = useState<CategoryScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/score")
      .then((res) => res.json())
      .then((json) => {
        setScores(json.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const top = scores[0];

  const updatedAt = top?.updated_at
    ? new Date(top.updated_at).toLocaleString("ja-JP")
    : "自動更新中";

  return (
    <div className="min-h-screen bg-[#FFF9E6] text-slate-900">
      <header className="relative overflow-hidden bg-gradient-to-br from-purple-400 via-pink-400 to-orange-300 text-white">
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_top_right,#ffffff,transparent_36%),radial-gradient(circle_at_bottom_left,#fde68a,transparent_34%)]" />
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
        <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-yellow-300/30 blur-2xl" />

        <div className="relative mx-auto max-w-6xl px-5 py-11 md:py-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/25 px-3 py-1 text-xs font-black text-white shadow-sm ring-1 ring-white/35 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            ユーザー行動AI・完全自動更新
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight drop-shadow-md md:text-6xl">
            ポイ活AI判定
          </h1>

          <p className="mt-4 max-w-3xl text-base font-bold leading-8 text-white/95 drop-shadow-md md:text-lg">
            いま注目すべきポイ活ジャンルを、AIが毎日判定。
            クリックデータ・話題性・報酬レンジをもとに、
            <span className="font-black text-yellow-100 drop-shadow">
              今やるべきポイ活
            </span>
            をランキング化します。
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {[
              "案件取得不要",
              "ジャンル完全自動判定",
              "クリック計測対応",
              "主要サイトへ案内",
            ].map((label) => (
              <span
                key={label}
                className="rounded-full bg-white/25 px-3 py-2 text-xs font-black text-white shadow-sm ring-1 ring-white/25 backdrop-blur"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {top && (
          <section className="mb-7 overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-orange-100">
            <div className="bg-gradient-to-r from-pink-500 to-orange-400 px-5 py-3 text-sm font-black text-white">
              🔥 今日のAI最注目ジャンル
            </div>

            <div className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-sm font-black text-pink-500">1位</p>

                <h2 className="mt-1 text-3xl font-black">{top.category}</h2>

                <p className="mt-3 text-sm font-bold leading-relaxed text-slate-600">
                  {top.reason}
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
                  <span className="rounded-full bg-orange-50 px-3 py-2 text-orange-600">
                    報酬目安 {top.reward_min.toLocaleString()}〜
                    {top.reward_max.toLocaleString()}円
                  </span>

                  <span className="rounded-full bg-pink-50 px-3 py-2 text-pink-600">
                    AI注目度 {stars(top.heat_level)}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-2 text-slate-600">
                    難易度 {top.difficulty_label}{" "}
                    {difficultyStars(top.difficulty_label)}
                  </span>
                </div>
              </div>

              <div className="min-w-[220px] rounded-3xl bg-orange-50 p-4 ring-1 ring-orange-100">
                <p className="text-xs font-black text-slate-500">
                  このジャンルを探すなら
                </p>

                <button
                  onClick={() =>
                    trackClick(
                      top.category,
                      top.primary_site_name,
                      top.primary_site_url
                    )
                  }
                  className="mt-3 block w-full rounded-2xl bg-gradient-to-r from-pink-500 to-orange-500 px-5 py-3 text-center text-sm font-black text-white shadow-lg shadow-pink-500/20 transition hover:scale-[1.02]"
                >
                  {top.primary_site_name}で探す
                </button>

                {top.secondary_site_name && top.secondary_site_url && (
                  <button
                    onClick={() =>
                      trackClick(
                        top.category,
                        top.secondary_site_name!,
                        top.secondary_site_url!
                      )
                    }
                    className="mt-2 block w-full rounded-2xl bg-white px-5 py-3 text-center text-sm font-black text-slate-700 shadow-sm ring-1 ring-orange-100 transition hover:bg-orange-50"
                  >
                    {top.secondary_site_name}でも探す
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        <section className="mb-6 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-orange-100">
          <h2 className="text-xl font-black">このランキングについて</h2>

          <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
            このランキングは「この案件が必ず掲載されています」と保証するものではありません。
            話題性データ、ポイ活ジャンルとの関連性、想定報酬レンジ、難易度、
            そしてユーザーのクリック行動をもとに、
            <span className="font-black text-pink-500">
              今チェックすべきポイ活ジャンル
            </span>
            をAIが自動判定しています。
          </p>

          <p className="mt-2 text-xs font-bold text-slate-400">
            最終更新：{updatedAt}
          </p>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-black text-pink-500">
                AI Genre Ranking
              </p>
              <h2 className="text-2xl font-black">
                今やるべきポイ活ランキング
              </h2>
            </div>
          </div>

          {loading && (
            <div className="rounded-[2rem] bg-white p-10 text-center font-black text-slate-500 shadow-sm ring-1 ring-orange-100">
              ランキングを読み込み中...
            </div>
          )}

          <div className="grid gap-4">
            {scores.map((item, i) => (
              <article
                key={item.id || item.category}
                className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-orange-100 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="grid gap-4 p-5 md:grid-cols-[auto_1fr_auto] md:items-center">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-black text-white shadow-sm ${
                      i === 0
                        ? "bg-gradient-to-br from-yellow-300 to-orange-500"
                        : i === 1
                        ? "bg-gradient-to-br from-slate-300 to-slate-500"
                        : i === 2
                        ? "bg-gradient-to-br from-orange-300 to-amber-700"
                        : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    {i + 1}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black">{item.category}</h3>

                      <span className="rounded-full bg-pink-50 px-2 py-1 text-xs font-black text-pink-600">
                        {item.trend_keyword || "AI判定"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
                      {item.reason}
                    </p>

                   <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">

  <span className="rounded-full bg-orange-50 px-3 py-1.5 text-orange-600">
    報酬 {item.reward_min.toLocaleString()}〜
    {item.reward_max.toLocaleString()}円
  </span>

  <span className="rounded-full bg-pink-50 px-3 py-1.5 text-pink-600">
    AI注目度 {stars(item.heat_level)}
  </span>

  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">
    難易度 {item.difficulty_label}
  </span>

{(item.rise_rate ?? 0) >= 120 && (
  <span className="rounded-full bg-red-100 px-3 py-1.5 text-red-500 animate-pulse">
    🔥 急上昇 +{item.rise_rate ?? 0}%
  </span>
)}

</div>
</div>
                  <div className="md:min-w-[210px] md:text-right">
                    <button
                      onClick={() =>
                        trackClick(
                          item.category,
                          item.primary_site_name,
                          item.primary_site_url
                        )
                      }
                      className="block w-full rounded-2xl bg-gradient-to-r from-pink-500 to-orange-500 px-5 py-3 text-center text-sm font-black text-white shadow-lg shadow-pink-500/20 transition hover:scale-[1.02]"
                    >
                      {item.primary_site_name}で探す
                    </button>

                    {item.secondary_site_name && item.secondary_site_url && (
                      <button
                        onClick={() =>
                          trackClick(
                            item.category,
                            item.secondary_site_name!,
                            item.secondary_site_url!
                          )
                        }
                        className="mt-2 block w-full rounded-2xl bg-orange-50 px-5 py-3 text-center text-sm font-black text-orange-600 transition hover:bg-orange-100"
                      >
                        {item.secondary_site_name}で探す
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
