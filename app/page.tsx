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
      <header className="p-4 text-center">
        <h1 className="font-bold text-2xl">ポイ活AI判定</h1>

        <div className="mt-3 mx-auto max-w-md bg-white border-2 border-red-200 rounded-2xl shadow p-4">
          <p className="text-base font-semibold leading-relaxed text-gray-800">
            いまポイ活で話題の案件は、ここでチェック！
            <br />
            主要なポイントサイトに掲載されている各案件の話題度
            <br />
            を、<span className="text-red-500 font-bold">AI</span>
            が判定し、ランキングしています
          </p>
        </div>
      </header>

      <div className="flex overflow-x-auto px-3 gap-2 mb-4">
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
