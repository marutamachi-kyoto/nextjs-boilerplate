```tsx
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
  const [trendTags, setTrendTags] = useState<
    { word: string; score: number; category?: string }[]
  >([]);

  useEffect(() => {
    fetch("/api/trends")
      .then((res) => res.json())
      .then((json) => {
        setTrendTags(json.data || []);
      });

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
                <span className="text-pink-600">「世間での話題度」</span>
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
              className="h-auto w-full rounded-[2rem] shadow-[0_35px_80px_rgba(31,41,55,0.18)]"
              priority
            />
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-6xl px-4 py-8 lg:py-10">
        <section className="mb-8 rounded-[2rem] bg-white p-5 shadow-lg ring-1 ring-pink-100 lg:p-8">
          <div className="mb-6">
            <p className="text-sm font-black text-pink-500">
              Googleトレンド分析
            </p>

            <h2 className="text-3xl font-black text-slate-800 lg:text-4xl">
              🔍 ただいま話題のポイ活キーワード
            </h2>
          </div>

          <div className="rounded-[1.5rem] bg-gradient-to-br from-pink-50 via-white to-orange-50 p-5 lg:p-7">
            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              {trendTags.map((tag) => (
                <div
                  key={tag.word}
                  className={`flex items-center gap-2 rounded-full font-black shadow-sm transition hover:scale-105 ${
                    tag.score >= 90
                      ? "bg-gradient-to-r from-pink-500 to-orange-400 px-6 py-3 text-xl text-white lg:text-2xl"
                      : tag.score >= 80
                      ? "bg-pink-100 px-5 py-3 text-lg text-pink-600 lg:text-xl"
                      : tag.score >= 70
                      ? "bg-orange-100 px-5 py-2.5 text-lg text-orange-600 lg:text-xl"
                      : tag.score >= 60
                      ? "bg-yellow-50 px-4 py-2 text-base text-orange-500 lg:text-lg"
                      : "bg-slate-100 px-4 py-2 text-sm text-slate-600 lg:text-base"
                  }`}
                >
                  <span>#{tag.word}</span>

                  {tag.category === "ゲーム案件" && (
                    <span className="rounded-full bg-white/80 px-2 py-1 text-xs font-black text-orange-600">
                      GAME
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            <div className="rounded-2xl bg-pink-50 p-4">
              <p className="text-xs font-black text-pink-400">判定基準</p>
              <p className="mt-1 font-bold text-slate-700">
                「ポイ活 × 関連ワード」の検索上昇傾向
              </p>
            </div>

            <div className="rounded-2xl bg-orange-50 p-4">
              <p className="text-xs font-black text-orange-400">表示ルール</p>
              <p className="mt-1 font-bold text-slate-700">
                話題度が高いほど大きく表示
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black text-slate-400">更新頻度</p>
              <p className="mt-1 font-bold text-slate-700">
                1時間ごとにAI判定
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
```
