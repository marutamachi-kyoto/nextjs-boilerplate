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

  const stars = (n: number) => "★".repeat(n);

  return (
    <div className="min-h-screen bg-[#fff8fb]">
      {/* HERO */}
      <header className="overflow-hidden bg-gradient-to-r from-[#FFF2F7] via-[#FFF8FA] to-[#FFF4F7]">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-10 px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-12">
          {/* LEFT */}
          <div className="w-full lg:w-[680px]">
            <div className="inline-flex items-center gap-3 rounded-full border-2 border-pink-300 bg-white px-6 py-3 text-base font-black text-pink-600 shadow-[0_10px_30px_rgba(236,72,153,0.18)] lg:text-xl">
              <span>🤖</span>
              <span>AIが１時間ごと（毎時０分）にランキング反映！</span>
            </div>

            <h1 className="mt-8 text-[54px] font-black leading-[0.95] tracking-[-0.05em] text-pink-600 drop-shadow-[0_5px_0_rgba(255,255,255,0.9)] lg:text-[96px]">
              ポイ活
              <span className="bg-gradient-to-b from-yellow-300 to-orange-500 bg-clip-text text-transparent">
                AI
              </span>
              判定
            </h1>

            <div className="mt-8 space-y-6 text-[20px] font-black leading-[1.9] text-[#27313f] lg:text-[28px]">
              <p className="text-pink-600">ポイ活初心者の方向けに</p>

              <p>
                今やるべきポイ活のジャンルを、
                <span className="text-pink-600">AI</span>が判定。
              </p>

              <p>
                <span className="text-pink-600">
                  「世間での話題度」「クリック数」「報酬レンジ」
                </span>
                の
                <br />
                各データをもとに、初心者の方向けのポイ活を
                <br />
                <span className="text-pink-600">AI</span>が判定し、
                <span className="text-pink-600">
                  １時間ごと（毎時０分）
                </span>
                に、
                <br />
                ランキング反映しています。
              </p>
            </div>

            <div className="mt-8 w-full rounded-[2rem] bg-white/90 p-4 shadow-[0_25px_60px_rgba(236,72,153,0.12)] lg:w-[610px] lg:p-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-4 rounded-2xl bg-pink-50 px-4 py-5 text-center text-base font-black text-pink-600 lg:text-xl">
                  <span className="text-4xl">🏆</span>
                  <span>ジャンル完全自動判定</span>
                </div>

                <div className="flex items-center gap-4 rounded-2xl bg-yellow-50 px-4 py-5 text-center text-base font-black text-orange-500 lg:text-xl">
                  <span className="text-4xl">📈</span>
                  <span>クリック計測対応</span>
                </div>

                <div className="flex items-center gap-4 rounded-2xl bg-pink-50 px-4 py-5 text-center text-base font-black text-pink-600 lg:text-xl">
                  <span className="text-4xl">📍</span>
                  <span>主要ポイントサイトへ案内</span>
                </div>

                <div className="flex items-center gap-4 rounded-2xl bg-yellow-50 px-4 py-5 text-center text-base font-black text-orange-500 lg:text-xl">
                  <span className="text-4xl">🟠</span>
                  <span>話題度・報酬レンジ分析</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT ILLUSTRATION */}
          <div className="relative h-[360px] w-full lg:h-[620px] lg:w-[720px]">
            <div className="absolute right-0 top-6 h-[250px] w-full rounded-[2rem] bg-[#303442] shadow-[0_35px_80px_rgba(31,41,55,0.22)] lg:top-20 lg:h-[400px] lg:w-[600px] lg:rounded-[3rem]">
              <div className="absolute left-1/2 top-5 h-[200px] w-[88%] -translate-x-1/2 overflow-hidden rounded-[1.5rem] bg-white lg:top-8 lg:h-[315px] lg:rounded-[2rem]">
                <div className="flex h-12 items-center justify-between bg-gradient-to-r from-pink-300 to-pink-200 px-5 lg:h-16">
                  <div className="flex gap-2">
                    <span className="h-3 w-3 rounded-full bg-white lg:h-4 lg:w-4" />
                    <span className="h-3 w-3 rounded-full bg-white lg:h-4 lg:w-4" />
                    <span className="h-3 w-3 rounded-full bg-white lg:h-4 lg:w-4" />
                  </div>

                  <div className="rounded-full bg-white px-4 py-1 text-xs font-black text-pink-600 lg:text-base">
                    AI分析中
                  </div>
                </div>

                <div className="p-5 lg:p-8">
                  <div className="rounded-3xl bg-pink-50 px-4 py-5 text-center text-[28px] font-black text-pink-600 shadow-sm lg:text-[46px]">
                    今やるべきポイ活
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3 lg:mt-8 lg:gap-5">
                    <div className="rounded-2xl bg-yellow-50 py-4 text-center text-xl font-black text-orange-500 lg:text-4xl">
                      クレカ
                    </div>
                    <div className="rounded-2xl bg-pink-50 py-4 text-center text-xl font-black text-pink-600 lg:text-4xl">
                      証券
                    </div>
                    <div className="rounded-2xl bg-orange-50 py-4 text-center text-xl font-black text-orange-500 lg:text-4xl">
                      回線
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* COINS */}
            <div className="absolute bottom-[80px] left-[40px] hidden h-24 w-24 items-center justify-center rounded-full bg-yellow-300 text-5xl font-black text-orange-500 shadow-xl ring-8 ring-yellow-400 lg:flex">
              P
            </div>

            <div className="absolute bottom-[70px] left-[160px] hidden lg:block">
              <div className="h-8 w-28 rounded-full bg-yellow-300 shadow ring-4 ring-yellow-400" />
              <div className="-mt-2 h-8 w-28 rounded-full bg-yellow-300 shadow ring-4 ring-yellow-400" />
              <div className="-mt-2 h-8 w-28 rounded-full bg-yellow-300 shadow ring-4 ring-yellow-400" />
              <div className="-mt-2 h-8 w-28 rounded-full bg-yellow-300 shadow ring-4 ring-yellow-400" />
            </div>

            <div className="absolute bottom-[40px] right-[10px] h-32 w-44 rounded-[2rem] bg-pink-300 shadow-2xl lg:bottom-[40px] lg:right-[0px] lg:h-48 lg:w-64">
              <div className="absolute -top-9 left-8 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-300 text-5xl font-black text-orange-500 shadow-xl ring-8 ring-yellow-400">
                P
              </div>
              <div className="absolute -top-12 right-10 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-300 text-5xl font-black text-orange-500 shadow-xl ring-8 ring-yellow-400">
                P
              </div>
            </div>

            <div className="absolute bottom-[25px] right-[180px] h-16 w-40 rotate-6 rounded-2xl bg-emerald-200 shadow-xl lg:bottom-[20px] lg:right-[230px] lg:h-24 lg:w-60">
              <div className="absolute left-0 top-1/2 h-6 w-full -translate-y-1/2 bg-white lg:h-8" />
              <div className="absolute bottom-3 left-5 h-2 w-10 rounded bg-white" />
              <div className="absolute bottom-3 left-20 h-2 w-10 rounded bg-white" />
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-6xl px-4 py-8 lg:py-10">
        <div className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-3xl font-black text-slate-800 lg:text-4xl">
            🔥 今日のポイ活おすすめランキング
          </h2>

          <div className="w-fit rounded-full bg-white px-5 py-2 text-sm font-bold text-slate-500 shadow">
            最終更新：{updatedAt}
          </div>
        </div>

        <div className="space-y-5">
          {items.map((item, index) => (
            <article
              key={item.category}
              className="rounded-[2rem] bg-white p-5 shadow-lg ring-1 ring-orange-100 lg:p-8"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:justify-between lg:gap-8">
                <div className="flex gap-4 lg:gap-6">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl font-black text-white shadow-lg lg:h-16 lg:w-16 lg:text-3xl ${
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

                  <div className="min-w-0">
                    <h3 className="text-3xl font-black leading-tight text-slate-800 lg:text-5xl">
                      {item.category}
                    </h3>

                    <p className="mt-2 text-lg font-bold text-pink-500 lg:text-xl">
                      注目案件：{item.trend_keyword}
                    </p>

                    <p className="mt-4 text-base leading-relaxed text-slate-500 lg:mt-6 lg:text-lg">
                      {item.reason}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-black lg:mt-5 lg:gap-3 lg:text-sm">
                      <span className="rounded-full bg-orange-50 px-3 py-2 text-orange-500 lg:px-4">
                        報酬 {item.reward_min.toLocaleString()}〜
                        {item.reward_max.toLocaleString()}円
                      </span>

                      <span className="rounded-full bg-pink-50 px-3 py-2 text-pink-500 lg:px-4">
                        AI注目度 {stars(item.heat_level)}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-2 text-slate-600 lg:px-4">
                        難易度 {item.difficulty_label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex w-full flex-col justify-center gap-3 lg:w-[320px]">
                  <button
                    onClick={() =>
                      trackClick(
                        item.category,
                        item.primary_site_name,
                        item.primary_site_url
                      )
                    }
                    className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-orange-400 px-6 py-4 text-lg font-black text-white shadow-lg transition hover:scale-105"
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
                      className="w-full rounded-2xl bg-orange-50 px-6 py-4 text-lg font-black text-orange-500 shadow-sm transition hover:scale-105"
                    >
                      {item.secondary_site_name}も見る
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
