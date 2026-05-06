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

        {/* BG LIGHT */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_20%),radial-gradient(circle_at_80%_10%,white,transparent_20%),radial-gradient(circle_at_50%_80%,#fde68a,transparent_25%)]" />

        <div className="relative mx-auto flex max-w-[1400px] items-center justify-between px-10 py-10">

          {/* LEFT */}
          <div className="w-[620px] shrink-0">

            {/* BADGE */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-lg font-black text-pink-600 shadow-xl">
              🤖 AI分析中
            </div>

            {/* TITLE */}
            <h1 className="mt-8 text-[86px] font-black leading-[0.95] tracking-[-0.05em] text-white drop-shadow-[0_5px_0_rgba(0,0,0,0.14)]">
              ポイ活
              <span className="text-[#FFF3A1]">
                AI
              </span>
              判定
            </h1>

            {/* DESCRIPTION */}
            <div className="mt-10 max-w-[620px]">

              <p className="text-[24px] font-black leading-[1.7] text-[#34151B]">
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

            </div>

            {/* FEATURE BOX */}
            <div className="mt-10 w-[430px] rounded-[2rem] bg-white/95 p-5 shadow-[0_25px_60px_rgba(0,0,0,0.12)]">

              <div className="grid grid-cols-2 gap-4">

                <div className="rounded-2xl bg-pink-100 px-5 py-4 text-center text-lg font-black text-pink-600">
                  ジャンル完全自動判定
                </div>

                <div className="rounded-2xl bg-yellow-100 px-5 py-4 text-center text-lg font-black text-orange-500">
                  クリック計測対応
                </div>

                <div className="rounded-2xl bg-pink-100 px-5 py-4 text-center text-lg font-black text-pink-600">
                  主要サイトへ案内
                </div>

                <div className="rounded-2xl bg-yellow-100 px-5 py-4 text-center text-lg font-black text-orange-500">
                  話題性・報酬レンジ分析
                </div>

              </div>

            </div>

          </div>

          {/* RIGHT */}
          <div className="relative h-[640px] w-[760px] shrink-0">

            {/* TABLET */}
            <div className="absolute right-4 top-8 h-[430px] w-[560px] rounded-[3rem] bg-[#2F3340] shadow-[0_45px_90px_rgba(0,0,0,0.22)]">

              {/* SCREEN */}
              <div className="absolute left-1/2 top-8 h-[340px] w-[470px] -translate-x-1/2 overflow-hidden rounded-[2rem] bg-white">

                {/* HEADER */}
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

                {/* CONTENT */}
                <div className="p-8">

                  {/* TITLE */}
                  <div className="rounded-3xl bg-pink-100 px-6 py-6 text-center text-5xl font-black text-pink-600">
                    今やるべきポイ活
                  </div>

                  {/* CATEGORY */}
                  <div className="mt-8 grid grid-cols-3 gap-4">

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

                  {/* TREND */}
                  <div className="mt-8">

                    <div className="flex items-center gap-3 text-3xl font-black text-pink-600">
                      🔥 急上昇ジャンル
                    </div>

                    <div className="mt-4 flex items-center gap-4">

                      <div className="h-6 w-28 rounded-full bg-pink-100" />

                      <div className="flex items-center gap-2">
                        <div className="h-6 w-24 rounded-full bg-yellow-100" />
                        <span className="text-3xl text-yellow-400">
                          ➜
                        </span>
                      </div>

                      <div className="h-6 w-24 rounded-full bg-orange-100" />

                    </div>

                  </div>

                </div>

              </div>

              {/* STAND */}
              <div className="absolute bottom-[-18px] left-1/2 h-10 w-[300px] -translate-x-1/2 rounded-b-full bg-[#23262E]" />

            </div>

            {/* LEFT COINS */}
            <div className="absolute left-[-10px] top-[300px] text-[95px] rotate-[-8deg]">
              🪙
            </div>

            <div className="absolute bottom-[15px] left-[0px] rotate-[8deg] text-[115px]">
              🪙
            </div>

            <div className="absolute bottom-[-5px] left-[120px] text-[160px]">
              🪙
            </div>

            <div className="absolute bottom-[10px] left-[280px] rotate-[10deg] text-[110px]">
              🪙
            </div>

            {/* RIGHT COINS */}
            <div className="absolute right-[-20px] top-[300px] rotate-[8deg] text-[115px]">
              🪙
            </div>

            <div className="absolute bottom-[40px] right-[30px] rotate-[12deg] text-[120px]">
              🪙
            </div>

            {/* BOX */}
            <div className="absolute bottom-[15px] right-[20px]">

              {/* PINK BOX */}
              <div className="relative h-40 w-56 rounded-[2rem] bg-pink-300 shadow-[0_30px_50px_rgba(0,0,0,0.16)]">

                <div className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-yellow-100 text-5xl">
                  🪙
                </div>

              </div>

              {/* CASH */}
              <div className="absolute bottom-[-20px] left-[-55px] h-20 w-52 rounded-2xl bg-green-200 shadow-2xl">

                <div className="absolute left-1/2 top-1/2 h-6 w-full -translate-x-1/2 -translate-y-1/2 bg-white" />

              </div>

            </div>

            {/* SPARKLES */}
            <div className="absolute left-[120px] top-[360px] text-6xl">
              ✨
            </div>

            <div className="absolute right-[0px] top-[355px] text-7xl">
              ✨
            </div>

            <div className="absolute bottom-[120px] right-[140px] text-5xl">
              ✨
            </div>

          </div>

        </div>

      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-6xl px-4 py-10">

        {/* HEADER */}
        <div className="mb-8 flex items-center justify-between">

          <h2 className="text-4xl font-black text-slate-800">
            🔥 AIランキング
          </h2>

          <div className="flex items-center gap-3">

            <div className="rounded-full bg-pink-100 px-5 py-2 text-sm font-black text-pink-600">
              完全自動更新
            </div>

            <div className="rounded-full bg-white px-5 py-2 text-sm font-bold text-slate-500 shadow">
              最終更新：{updatedAt}
            </div>

          </div>

        </div>

        {/* RANKING */}
        <div className="space-y-5">

          {items.map((item, index) => (
            <article
              key={item.category}
              className="rounded-[2rem] bg-white p-8 shadow-lg ring-1 ring-orange-100"
            >

              <div className="flex items-center justify-between gap-8">

                {/* LEFT */}
                <div className="flex items-start gap-6">

                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-full text-3xl font-black text-white shadow-lg ${
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

                    <h3 className="text-5xl font-black text-slate-800">
                      {item.category}
                    </h3>

                    <p className="mt-2 text-xl font-bold text-pink-500">
                      {item.trend_keyword}
                    </p>

                    <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-500">
                      {item.reason}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3 text-sm font-black">

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
                <div className="min-w-[240px]">

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
                        className="mt-3 w-full rounded-2xl bg-orange-50 px-6 py-4 text-lg font-black text-orange-500 shadow-sm transition hover:scale-105"
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
