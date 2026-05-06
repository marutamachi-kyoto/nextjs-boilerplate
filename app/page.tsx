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
      <header className="overflow-hidden bg-gradient-to-r from-pink-500 via-pink-300 to-orange-200">

        <div className="mx-auto flex max-w-[1400px] flex-col gap-10 px-5 py-8 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-10">

          {/* LEFT */}
          <div className="w-full lg:w-[620px]">

            {/* BADGE */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-black text-pink-600 shadow-xl lg:px-6 lg:py-3 lg:text-lg">
              🤖 AIが毎日自動判定中
            </div>

            {/* TITLE */}
            <h1 className="mt-6 text-[52px] font-black leading-[0.95] tracking-[-0.05em] text-white drop-shadow-[0_5px_0_rgba(0,0,0,0.14)] lg:mt-8 lg:text-[86px]">
              ポイ活
              <span className="text-[#FFF3A1]">AI</span>
              判定
            </h1>

            {/* DESCRIPTION */}
            <div className="mt-6 max-w-[620px] lg:mt-10">

              <p className="text-[30px] font-black leading-[1.8] text-[#34151B] lg:text-[24px]">
                いま注目すべきポイ活ジャンルを、
                AIが判定。
                <br />
                <br />
                <span className="text-[#FFF3A1]">
                  世間での話題性・クリックデータ・報酬レンジ
                </span>
                をもとに、

                <span className="text-[#FFF3A1]">
                  今やるべきポイ活
                </span>
                を、AIが判定し、自動的にランキング化します。
              </p>

            </div>

            {/* FEATURES */}
            <div className="mt-8 w-full rounded-[2rem] bg-white/95 p-4 shadow-[0_25px_60px_rgba(0,0,0,0.12)] lg:mt-10 lg:w-[430px] lg:p-5">

              <div className="grid grid-cols-2 gap-3 lg:gap-4">

                <div className="rounded-2xl bg-pink-100 px-3 py-4 text-center text-sm font-black text-pink-600 lg:px-5 lg:text-lg">
                  ジャンル完全自動判定
                </div>

                <div className="rounded-2xl bg-yellow-100 px-3 py-4 text-center text-sm font-black text-orange-500 lg:px-5 lg:text-lg">
                  クリック計測対応
                </div>

                <div className="rounded-2xl bg-pink-100 px-3 py-4 text-center text-sm font-black text-pink-600 lg:px-5 lg:text-lg">
                  主要サイトへ案内
                </div>

                <div className="rounded-2xl bg-yellow-100 px-3 py-4 text-center text-sm font-black text-orange-500 lg:px-5 lg:text-lg">
                  話題性・報酬レンジ分析
                </div>

              </div>

            </div>

          </div>

          {/* RIGHT ILLUSTRATION */}
          <div className="relative h-[340px] w-full max-w-[760px] lg:h-[620px]">

            {/* TABLET */}
            <div className="absolute right-0 top-4 h-[260px] w-full rounded-[2.5rem] bg-[#2F3340] shadow-[0_45px_90px_rgba(0,0,0,0.22)] lg:right-4 lg:top-8 lg:h-[430px] lg:w-[560px] lg:rounded-[3rem]">

              <div className="absolute left-1/2 top-5 h-[205px] w-[90%] -translate-x-1/2 overflow-hidden rounded-[1.5rem] bg-white lg:top-8 lg:h-[340px] lg:w-[470px] lg:rounded-[2rem]">

                {/* TOP */}
                <div className="flex h-12 items-center justify-between bg-yellow-300 px-4 lg:h-14 lg:px-6">

                  <div className="flex gap-2 lg:gap-3">
                    <span className="h-3 w-3 rounded-full bg-white lg:h-4 lg:w-4" />
                    <span className="h-3 w-3 rounded-full bg-white lg:h-4 lg:w-4" />
                    <span className="h-3 w-3 rounded-full bg-white lg:h-4 lg:w-4" />
                  </div>

                  <div className="rounded-full bg-white px-3 py-1 text-xs font-black text-pink-600 lg:px-5 lg:py-2 lg:text-sm">
                    AI分析中
                  </div>

                </div>

                {/* CONTENT */}
                <div className="p-4 lg:p-8">

                  <div className="rounded-3xl bg-pink-100 px-4 py-4 text-center text-[28px] font-black whitespace-nowrap text-pink-600 lg:px-6 lg:py-6 lg:text-[44px]">
                    今やるべきポイ活
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3 lg:mt-8 lg:gap-4">

                    <div className="rounded-2xl bg-yellow-100 py-4 text-center text-xl font-black text-orange-500 lg:rounded-3xl lg:py-6 lg:text-4xl">
                      クレカ
                    </div>

                    <div className="rounded-2xl bg-pink-100 py-4 text-center text-xl font-black text-pink-500 lg:rounded-3xl lg:py-6 lg:text-4xl">
                      証券
                    </div>

                    <div className="rounded-2xl bg-orange-100 py-4 text-center text-xl font-black text-orange-500 lg:rounded-3xl lg:py-6 lg:text-4xl">
                      回線
                    </div>

                  </div>

                  <div className="mt-5 lg:mt-8">

                    <div className="flex items-center gap-2 text-lg font-black text-pink-600 lg:gap-3 lg:text-3xl">
                      🔥 急上昇ジャンル
                    </div>

                    <div className="mt-3 flex items-center gap-3 lg:mt-4 lg:gap-4">

                      <div className="h-4 w-20 rounded-full bg-pink-100 lg:h-6 lg:w-28" />

                      <div className="h-4 w-20 rounded-full bg-yellow-100 lg:h-6 lg:w-24" />

                      <div className="h-4 w-20 rounded-full bg-orange-100 lg:h-6 lg:w-24" />

                    </div>

                  </div>

                </div>

              </div>

            </div>

            {/* COINS */}
            <div className="absolute left-[0px] top-[180px] flex h-14 w-14 rotate-[-10deg] items-center justify-center rounded-full bg-yellow-300 text-2xl shadow-xl ring-4 ring-yellow-400 lg:left-[10px] lg:top-[310px] lg:h-24 lg:w-24 lg:text-5xl lg:ring-8">
              P
            </div>

            <div className="absolute right-[-5px] top-[170px] flex h-14 w-14 rotate-[12deg] items-center justify-center rounded-full bg-yellow-300 text-2xl shadow-xl ring-4 ring-yellow-400 lg:right-[-10px] lg:top-[285px] lg:h-24 lg:w-24 lg:text-5xl lg:ring-8">
              P
            </div>

            {/* STACK */}
            <div className="absolute bottom-[25px] left-[20px] lg:bottom-[55px] lg:left-[60px]">

              <div className="h-5 w-16 rounded-full bg-yellow-300 shadow-md ring-2 ring-yellow-400 lg:h-8 lg:w-28 lg:ring-4" />
              <div className="-mt-1 h-5 w-16 rounded-full bg-yellow-300 shadow-md ring-2 ring-yellow-400 lg:-mt-2 lg:h-8 lg:w-28 lg:ring-4" />
              <div className="-mt-1 h-5 w-16 rounded-full bg-yellow-300 shadow-md ring-2 ring-yellow-400 lg:-mt-2 lg:h-8 lg:w-28 lg:ring-4" />
              <div className="-mt-1 h-5 w-16 rounded-full bg-yellow-300 shadow-md ring-2 ring-yellow-400 lg:-mt-2 lg:h-8 lg:w-28 lg:ring-4" />

            </div>

            {/* BOX */}
            <div className="absolute bottom-[25px] right-[5px] h-24 w-32 rounded-[1.5rem] bg-pink-300 shadow-2xl lg:bottom-[45px] lg:right-[20px] lg:h-40 lg:w-56 lg:rounded-[2rem]">

              <div className="absolute -top-5 left-3 flex h-10 w-10 rotate-[-12deg] items-center justify-center rounded-full bg-yellow-300 text-2xl font-black text-orange-500 shadow-xl ring-4 ring-yellow-400 lg:-top-8 lg:left-8 lg:h-20 lg:w-20 lg:text-5xl lg:ring-8">
                P
              </div>

              <div className="absolute -top-6 right-3 flex h-10 w-10 rotate-[12deg] items-center justify-center rounded-full bg-yellow-300 text-2xl font-black text-orange-500 shadow-xl ring-4 ring-yellow-400 lg:-top-10 lg:right-8 lg:h-20 lg:w-20 lg:text-5xl lg:ring-8">
                P
              </div>

            </div>

            {/* CASH */}
            <div className="absolute bottom-[10px] right-[90px] h-10 w-24 rounded-xl bg-green-200 shadow-xl lg:bottom-[20px] lg:right-[180px] lg:h-20 lg:w-52 lg:rounded-2xl">
              <div className="absolute left-1/2 top-1/2 h-3 w-full -translate-x-1/2 -translate-y-1/2 bg-white lg:h-6" />
            </div>

          </div>

        </div>

      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-6xl px-4 py-8 lg:py-10">

        {/* TITLE */}
        <div className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-center lg:justify-between">

          <h2 className="text-3xl font-black text-slate-800 lg:text-4xl">
            🔥 AIランキング
          </h2>

          <div className="rounded-full bg-white px-5 py-2 text-sm font-bold text-slate-500 shadow w-fit">
            最終更新：{updatedAt}
          </div>

        </div>

        {/* RANK */}
        <div className="space-y-5">

          {items.map((item, index) => (
            <article
              key={item.category}
              className="rounded-[2rem] bg-white p-5 shadow-lg ring-1 ring-orange-100 lg:p-8"
            >

              <div className="flex flex-col gap-6 lg:flex-row lg:justify-between lg:gap-8">

                {/* LEFT */}
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
                      {item.trend_keyword}
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

                {/* RIGHT BUTTON */}
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
