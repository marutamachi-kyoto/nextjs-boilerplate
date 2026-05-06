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
  const [updatedAt, setUpdatedAt] = useState("");

  useEffect(() => {
    fetch("/api/score")
      .then((res) => res.json())
      .then((json) => {
        setItems(json.data || []);
        setUpdatedAt(new Date().toLocaleString("ja-JP"));
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
      <header className="relative overflow-hidden bg-gradient-to-r from-pink-500 via-pink-300 to-orange-200">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_20%),radial-gradient(circle_at_80%_10%,white,transparent_20%),radial-gradient(circle_at_50%_80%,#fde68a,transparent_25%)]" />

        <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-10 px-6 py-10 md:flex-row">
          {/* LEFT */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-lg font-black text-pink-600 shadow-lg">
              🤖 AI分析中
            </div>

            <h1 className="mt-8 text-6xl font-black leading-none text-white drop-shadow-[0_5px_0_rgba(0,0,0,0.12)] md:text-8xl">
              ポイ活AI判定
            </h1>

            <p className="mt-10 text-2xl font-black leading-[4rem] text-[#3B141B] md:text-[3rem]">
              いま注目すべきポイ活ジャンルを、
              <br />
              AIが毎日判定。クリックデータ・話題性・
              <br />
              報酬レンジをもとに、
              <span className="text-pink-600">
                今やるべきポイ活
              </span>
              を
              <br />
              ランキング化します。
            </p>

            {/* FEATURES */}
            <div className="mt-10 rounded-[2rem] bg-white/95 p-5 shadow-2xl backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-pink-100 px-5 py-5 text-center text-lg font-black text-pink-600">
                  ジャンル完全自動判定
                </div>

                <div className="rounded-2xl bg-yellow-100 px-5 py-5 text-center text-lg font-black text-orange-500">
                  クリック計測対応
                </div>

                <div className="rounded-2xl bg-pink-100 px-5 py-5 text-center text-lg font-black text-pink-600">
                  主要サイトへ案内
                </div>

                <div className="rounded-2xl bg-yellow-100 px-5 py-5 text-center text-lg font-black text-orange-500">
                  話題性・報酬レンジ分析
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="relative flex w-full max-w-3xl items-end justify-center">
            <div className="relative h-[620px] w-[720px]">
              {/* TABLET */}
              <div className="absolute left-1/2 top-6 h-[430px] w-[560px] -translate-x-1/2 rounded-[3rem] bg-[#2F3340] shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
                <div className="absolute left-1/2 top-8 h-[340px] w-[470px] -translate-x-1/2 rounded-[2rem] bg-white overflow-hidden">
                  {/* TOP BAR */}
                  <div className="flex h-14 items-center justify-between bg-yellow-300 px-6">
                    <div className="flex gap-3">
                      <span className="h-4 w-4 rounded-full bg-white" />
                      <span className="h-4 w-4 rounded-full bg-white" />
                      <span className="h-4 w-4 rounded-full bg-white" />
                    </div>

                    <div className="rounded-full bg-white px-5 py-2 text-sm font-black text-pink-600">
                      AI分析中
                    </div>
                  </div>

                  {/* SCREEN */}
                  <div className="p-7">
                    <div className="rounded-3xl bg-pink-100 px-6 py-6 text-center text-5xl font-black text-pink-600">
                      今やるべきポイ活
                    </div>

                    <div className="mt-7 grid grid-cols-3 gap-4">
                      <div className="rounded-3xl bg-yellow-100 py-6 text-center text-4xl font-black text-orange-500">
                        クレカ
                      </div>

                      <div className="rounded-3xl bg-pink-100 py-6 text-center text-4xl font-black text-pink-500">
                        証券
                      </div>

                      <div className="rounded-3xl bg-orange-100 py-6 text-center text-4xl font-black text-orange-500">
                        回線
                      </div>
                    </div>

                    <div className="mt-8">
                      <div className="flex items-center gap-3 text-3xl font-black text-pink-600">
                        🔥 急上昇ジャンル
                      </div>

                      <div className="mt-4 flex gap-3">
                        <div className="h-6 w-32 rounded-full bg-pink-100" />
                        <div className="h-6 w-28 rounded-full bg-yellow-100" />
                        <div className="h-6 w-24 rounded-full bg-orange-100" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* STAND */}
                <div className="absolute bottom-[-22px] left-1/2 h-10 w-[300px] -translate-x-1/2 rounded-b-full bg-[#23262E]" />
              </div>

              {/* COINS */}
              <div className="absolute bottom-0 left-0 text-[110px]">
                🪙
              </div>

              <div className="absolute bottom-10 left-24 text-[90px]">
                🪙
              </div>

              <div className="absolute bottom-[-10px] left-40 text-[140px]">
                🪙
              </div>

              <div className="absolute bottom-6 left-64 text-[100px]">
                🪙
              </div>

              <div className="absolute bottom-16 right-0 text-[120px]">
                🪙
              </div>

              <div className="absolute bottom-40 right-10 text-[90px]">
                🪙
              </div>

              {/* MONEY */}
              <div className="absolute bottom-0 right-20">
                <div className="relative h-36 w-56 rounded-3xl bg-pink-300 shadow-2xl">
                  <div className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-yellow-100 text-5xl">
                    🪙
                  </div>
                </div>

                <div className="absolute bottom-[-18px] left-[-40px] h-20 w-48 rounded-2xl bg-green-200 shadow-xl">
                  <div className="absolute left-1/2 top-1/2 h-6 w-full -translate-x-1/2 -translate-y-1/2 bg-white" />
                </div>
              </div>

              {/* SPARKLES */}
              <div className="absolute left-[110px] top-[320px] text-6xl">
                ✨
              </div>

              <div className="absolute right-[20px] top-[330px] text-7xl">
                ✨
              </div>

              <div className="absolute right-[120px] bottom-[120px] text-5xl">
                ✨
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-6xl px-4 py-10">
        <section>
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-3xl font-black text-slate-800">
              🔥 AIランキング
            </h2>

            <div className="flex items-center gap-3">
              <div className="rounded-full bg-pink-100 px-4 py-2 text-sm font-black text-pink-600">
                完全自動更新
              </div>

              <div className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-500 shadow">
                最終更新：{updatedAt}
              </div>
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
