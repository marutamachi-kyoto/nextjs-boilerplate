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

            <div className="mt-8 w-full rounded-[2rem] bg-white/90 p-4 shadow-[0_25px_60px_rgba(236,72,153,0.12)]
```
