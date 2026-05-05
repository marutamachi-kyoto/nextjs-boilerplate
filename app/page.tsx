"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [data, setData] = useState<any>({});
  const [active, setActive] = useState("");

  useEffect(() => {
    fetch("/api/rankings")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        const first = Object.keys(json)[0];
        if (first) setActive(first);
      });
  }, []);

  const categories = Object.keys(data);
  const offers = data[active] || [];
  const top = offers[0];

  return (
    <div className="bg-[#FFF9E6] min-h-screen pb-10">
    <header className="relative overflow-hidden bg-gradient-to-br from-purple-400 via-pink-400 to-orange-300 text-white">
  <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_top_right,#ffffff,transparent_36%),radial-gradient(circle_at_bottom_left,#fde68a,transparent_34%)]" />
  <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
  <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-yellow-300/30 blur-2xl" />

  <div className="relative mx-auto max-w-6xl px-5 py-11 md:py-14">
    <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-black text-white shadow-sm ring-1 ring-white/30 backdrop-blur">
      <span className="h-2 w-2 rounded-full bg-emerald-300" />
      Google Trends連動・自動更新
    </div>

    <h1 className="mt-6 text-4xl font-black tracking-tight drop-shadow-sm md:text-6xl">
      ポイ活AI判定
    </h1>

   <p className="mt-4 max-w-3xl text-base font-medium leading-8 text-white/95 md:text-lg">
      いまポイ活で話題の案件は、ここでチェック。主要ポイントサイトの掲載案件を横断比較し、
      <span className="font-black text-yellow-100">
        AIが話題度と報酬条件を判定
      </span>
      してランキング化します。
    </p>

    <div className="mt-6 flex flex-wrap gap-2">
      {[
        "主要10サイト比較",
        "最高報酬を自動選択",
        "TOP20ランキング",
        "毎日更新対応",
      ].map((label) => (
        <span
          key={label}
          className="rounded-full bg-white/20 px-3 py-2 text-xs font-black text-white shadow-sm ring-1 ring-white/25 backdrop-blur"
        >
          {label}
        </span>
      ))}
    </div>
  </div>
</header>

      <div className="max-w-6xl mx-auto flex overflow-x-auto px-5 gap-2 mt-4 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-3 py-2 rounded-full text-sm whitespace-nowrap font-bold ${
              active === cat
                ? "bg-red-500 text-white"
                : "bg-white text-gray-700 shadow"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <main className="p-4 max-w-md mx-auto">
        {top && (
          <div className="bg-gradient-to-r from-red-100 to-red-200 p-6 rounded-2xl shadow-lg text-center mb-6">
            <p className="font-bold text-red-500">🔥 AIが選んだ最注目案件</p>

            <h2 className="text-xl font-bold mt-2">{top.offer_title}</h2>

            <p className="text-3xl text-red-600 font-bold mt-1">
              {top.reward.toLocaleString()}円
            </p>

            <a
              href={top.url}
              className="block mt-4 bg-red-500 text-white py-3 rounded-xl font-bold"
            >
              {top.point_site}で申し込む
            </a>

            <p className="text-xs text-gray-600 mt-3 leading-relaxed">
              このリンクは、複数のポイントサイトを比較し、
              <br />
              最も高額な報酬がもらえるサイトへ自動で案内しています
            </p>
          </div>
        )}

        <section className="mb-6">
          <h2 className="font-bold mb-3">🏆 {active}ランキング（TOP20）</h2>

          {offers.map((o: any, i: number) => (
            <div
              key={o.id || i}
              className={`p-3 rounded-xl mb-3 shadow ${
                i === 0 ? "bg-yellow-200" : "bg-white"
              }`}
            >
              <div className="flex justify-between gap-2">
                <div className="font-bold">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 text-lg font-bold rounded-full ${
                        i === 0
                          ? "bg-yellow-400 text-white"
                          : i === 1
                          ? "bg-gray-400 text-white"
                          : i === 2
                          ? "bg-orange-400 text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {i + 1}
                    </span>

                    <span>{o.offer_title}</span>
                  </div>
                </div>

                <p className="text-red-500 font-bold whitespace-nowrap">
                  {o.reward.toLocaleString()}円
                </p>
              </div>

              <a
                href={o.url}
                className="block mt-3 bg-red-500 text-white text-center py-2 rounded-xl font-bold"
              >
                {o.point_site}で申し込む
              </a>

              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                このリンクは、複数のポイントサイトを比較し、
                <br />
                最も高額な報酬がもらえるサイトへ自動で案内しています
              </p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
