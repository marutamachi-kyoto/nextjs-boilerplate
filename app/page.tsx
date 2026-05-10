"use client";

import Image from "next/image";
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
              <p>
                <span className="text-pink-600">
                  「世間での話題度」
                </span>
                のデータを中心に、初心者向けのポイ活をAIが判定し、
                <span className="text-pink-600">
                １時間ごと（毎時０分）
                </span>
                にランキング反映しています。
              </p>
            </div>

            <div className="mt-8 w-full rounded-[2rem] bg-white/90 p-4 shadow-[0_25px_60px_rgba(236,72,153,0.12)] lg:w-[610px] lg:p-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-4 rounded-2xl bg-pink-50 px-4 py-5 text-center text-base font-black text-pink-600 lg:text-xl">
                  <span className="text-4xl">🏆</span>
                  <span>世間での話題度を分析</span>
                </div>

                <div className="flex items-center gap-4 rounded-2xl bg-yellow-50 px-4 py-5 text-center text-base font-black text-orange-500 lg:text-xl">
                  <span className="text-4xl">📈</span>
                  <span>クリック数も分析</span>
                </div>

                <div className="flex items-center gap-4 rounded-2xl bg-pink-50 px-4 py-5 text-center text-base font-black text-pink-600 lg:text-xl">
                  <span className="text-4xl">📍</span>
                  <span>主要ポイントサイトへ案内</span>
                </div>

                <div className="flex items-center gap-4 rounded-2xl bg-yellow-50 px-4 py-5 text-center text-base font-black text-orange-500 lg:text-xl">
                  <span className="text-4xl">🟠</span>
                  <span>報酬レンジも分析</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT IMAGE */}
          <div className="w-full lg:w-[720px]">
            <Image
              src="/hero.png.png"
              alt="ポイ活AI判定"
              width={1200}
              height={900}
              className="w-full h-auto rounded-[2rem] shadow-[0_35px_80px_rgba(31,41,55,0.18)]"
              priority
            />
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-6xl px-4 py-8 lg:py-10">
        <div className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-3xl font-black text-slate-800 lg:text-4xl">
            🔥 ただいまのポイ活おすすめランキング
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
  ? "bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 shadow-[0_8px_20px_rgba(255,200,0,0.45)]"
  : index === 1
  ? "bg-gradient-to-br from-slate-300 to-slate-600 shadow-[0_8px_20px_rgba(100,116,139,0.35)]"
  : index === 2
  ? "bg-gradient-to-br from-amber-600 via-orange-700 to-yellow-900 shadow-[0_8px_20px_rgba(180,83,9,0.45)]"
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
                      AI注目ワード：{item.trend_keyword}
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

                <div className="flex w-full flex-col items-end justify-center gap-3 lg:w-[320px]">
  <button
    onClick={() =>
      trackClick(
        item.category,
        item.primary_site_name,
        item.primary_site_url
      )
    }
    className="flex h-16 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-pink-500 to-orange-400 px-6 text-center text-lg font-black text-white shadow-lg transition hover:scale-105 lg:w-[260px]"
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
      className="flex h-16 w-full items-center justify-center rounded-2xl bg-orange-50 px-6 text-center text-lg font-black text-orange-500 shadow-sm transition hover:scale-105 lg:w-[260px]"
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
