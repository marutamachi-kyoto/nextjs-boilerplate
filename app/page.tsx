"use client";

import { useEffect, useState } from "react";

type CategoryScore = {
  category: string;
  rank: number;
  trend_keyword: string;
  reward_min: number;
  reward_max: number;
  difficulty_label: string;
  heat_level: number;
  final_score: number;
  rise_rate?: number;
  click_score?: number;
  reason: string;
  primary_site_name: string;
  primary_site_url: string;
  secondary_site_name?: string;
  secondary_site_url?: string;
};

export default function Page() {
  const [items, setItems] = useState<CategoryScore[]>([]);

  useEffect(() => {
    fetch("/api/score")
      .then((res) => res.json())
      .then((json) => {
        setItems(json.data || []);
      });
  }, []);

  const trackClick = async (
    category: string,
    siteName: string,
    url: string
  ) => {
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
    } catch (e) {}

    window.open(url, "_blank");
  };

  const stars = (n: number) => {
    return "★".repeat(n);
  };

  return (
    <div className="min-h-screen bg-[#FFF8F4]">
      {/* HERO */}
      <header className="relative overflow-hidden bg-gradient-to-r from-pink-400 via-pink-300 to-orange-200">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_20%),radial-gradient(circle_at_80%_10%,white,transparent_20%),radial-gradient(circle_at_50%_80%,#fde68a,transparent_25%)]" />

        <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-12 px-6 py-14 md:flex-row">
          {/* LEFT */}
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-5 py-2 text-sm font-black text-pink-600 shadow">
              🤖 AI分析中
            </div>

            <h1 className="mt-6 text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_0_rgba(190,24,93,0.35)] md:text-8xl">
              ポイ活AI判定
            </h1>

            <div className="mt-8 rounded-[2rem] bg-white/85 p-7 shadow-2xl backdrop-blur-sm">
              <p className="text-xl font-black leading-[2.2rem] text-[#4A1F2C]">
                いま注目すべきポイ活ジャンルを、
                <span className="mx-1 text-pink-500">
                  AIが毎日判定
                </span>
                。
                クリックデータ・話題性・報酬レンジをもとに、
                <span className="text-pink-600">
                  今やるべきポイ活
                </span>
                をランキング化します。
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-pink-50 px-5 py-4 text-center text-sm font-black text-pink-600">
                  ジャンル完全自動判定
                </div>

                <div className="rounded-2xl bg-yellow-50 px-5 py-4 text-center text-sm font-black text-orange-500">
                  クリック計測対応
                </div>

                <div className="rounded-2xl bg-pink-50 px-5 py-4 text-center text-sm font-black text-pink-600">
                  主要サイトへ案内
                </div>

                <div className="rounded-2xl bg-yellow-50 px-5 py-4 text-center text-sm font-black text-orange-500">
                  話題性・報酬分析
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT ILLUSTRATION */}
          <div className="relative flex w-full max-w-xl items-end justify-center">
            <div className="relative h-[420px] w-[520px]">
              <div className="absolute inset-0 rounded-full bg-white/20 blur-3xl" />

              {/* TABLET */}
              <div className="absolute left-1/2 top-4 h-[260px] w-[430px] -translate-x-1/2 rounded-[2.5rem] bg-[#363640] shadow-2xl">
                <div className="absolute left-1/2 top-6 h-[205px] w-[360px] -translate-x-1/2 rounded-[2rem] bg-white">
                  {/* TOP BAR */}
                  <div className="flex h-10 items-center justify-between rounded-t-[2rem] bg-yellow-300 px-5">
                    <div className="flex gap-2">
                      <span className="h-3 w-3 rounded-full bg-white/90" />
                      <span className="h-3 w-3 rounded-full bg-white/90" />
                      <span className="h-3 w-3 rounded-full bg-white/90" />
                    </div>

                    <div className="rounded-full bg-white/80 px-4 py-1 text-xs font-black text-pink-500">
                      AI分析中
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="p-5">
                    <div className="rounded-2xl bg-pink-100 px-5 py-4 text-center text-3xl font-black text-pink-600">
                      今やるべきポイ活
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      <div className="rounded-2xl bg-yellow-100 py-4 text-center text-xl font-black text-orange-500">
                        クレカ
                      </div>

                      <div className="rounded-2xl bg-pink-100 py-4 text-center text-xl font-black text-pink-500">
                        証券
                      </div>

                      <div className="rounded-2xl bg-orange-100 py-4 text-center text-xl font-black text-orange-500">
                        回線
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl bg-slate-100 px-5 py-4 text-center">
                      <div className="inline-flex items-center gap-2 rounded-full bg-yellow-200 px-5 py-2 text-sm font-black text-orange-600">
                        🔥 急上昇ジャンル
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-[-18px] left-1/2 h-7 w-[240px] -translate-x-1/2 rounded-b-full bg-[#27272F]" />
              </div>

              {/* MONEY */}
              <div className="absolute bottom-0 right-0">
                <div className="relative h-[170px] w-[230px]">
                  <div className="absolute bottom-0 right-0 h-28 w-36 rounded-2xl bg-pink-300 shadow-xl" />

                  <div className="absolute bottom-0 left-6 h-16 w-32 rounded-xl bg-green-200 shadow-lg">
                    <div className="absolute left-1/2 top-1/2 h-5 w-full -translate-x-1/2 -translate-y-1/2 bg-white" />
                  </div>

                  {/* COINS */}
                  <div className="absolute left-0 bottom-2 text-7xl">
                    🪙
                  </div>

                  <div className="absolute left-14 bottom-12 text-6xl">
                    🪙
                  </div>

                  <div className="absolute right-4 bottom-10 text-7xl">
                    🪙
                  </div>

                  <div className="absolute right-20 top-4 text-5xl">
                    🪙
                  </div>

                  <div className="absolute left-20 top-0 text-4xl">
                    ✨
                  </div>

                  <div className="absolute right-0 top-14 text-4xl">
                    ✨
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-6xl px-4 py-10">
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-black text-slate-800">
              🔥 AIランキング
            </h2>

            <div className="rounded-full bg-pink-100 px-4 py-2 text-sm font-black text-pink-600">
              完全自動更新
            </div>
          </div>

          <div className="space-y-5">
            {items.map((item, index) => (
              <article
                key={item.category}
                className="rounded-[2rem] bg-white p-6 shadow-lg ring-1 ring-orange-100 transition hover:scale-[1.01]"
              >
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-5">
                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl font-black text-white shadow-lg ${
                        index === 0
                          ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                          : index === 1
                          ? "bg-gradient-to-br from-slate-400 to-slate-500"
                          : index === 2
                          ? "bg-gradient-to-br from-orange-300 to-orange-500"
                          : "bg-gradient-to-br from-pink-400 to-pink-500"
                      }`}
                    >
                      {index + 1}
                    </div>

                    <div>
                      <h3 className="text-3xl font-black text-slate-800">
                        {item.category}
                      </h3>

                      <p className="mt-2 text-sm font-bold text-pink-500">
                        {item.trend_keyword}
                      </p>

                      <p className="mt-4 text-base font-medium leading-relaxed text-slate-500">
                        {item.reason}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2 text-sm font-black">
                        <span className="rounded-full bg-orange-50 px-4 py-2 text-orange-500">
                          報酬 {item.reward_min.toLocaleString()}〜
                          {item.reward_max.toLocaleString()}円
                        </span>

                        <span className="rounded-full bg-pink-50 px-4 py-2 text-pink-500">
                          AI注目度 {stars(item.heat_level)}
                        </span>

                        <span className="rounded-full bg-slate-100 px-4 py-2 text-slate-600">
                          難易度 {item.difficulty_label}
                        </span>

                        {(item.rise_rate ?? 0) >= 120 && (
                          <span className="animate-pulse rounded-full bg-red-100 px-4 py-2 text-red-500">
                            🔥 急上昇 +{item.rise_rate ?? 0}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* BUTTONS */}
                  <div className="md:min-w-[240px] md:text-right">
                    <button
                      onClick={() =>
                        trackClick(
                          item.category,
                          item.primary_site_name,
                          item.primary_site_url
                        )
                      }
                      className="block w-full rounded-2xl bg-gradient-to-r from-pink-500 to-orange-400 px-6 py-4 text-center text-lg font-black text-white shadow-lg transition hover:scale-105"
                    >
                      {item.primary_site_name}で探す
                    </button>

                    {item.secondary_site_name &&
                      item.secondary_site_url && (
                        <button
                          onClick={() =>
                            trackClick(
                              item.category,
                              item.secondary_site_name!,
                              item.secondary_site_url!
                            )
                          }
                          className="mt-3 block w-full rounded-2xl bg-orange-50 px-6 py-4 text-center text-lg font-black text-orange-500 shadow-sm transition hover:scale-105"
                        >
                          {item.secondary_site_name}も見る
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
