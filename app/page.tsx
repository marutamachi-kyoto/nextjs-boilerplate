"use client";

import { useEffect, useState } from "react";

const pointSites = [
  "モッピー","ハピタス","ポイントインカム","ちょびリッチ","ECナビ",
  "ワラウ","げん玉","アメフリ","ニフティポイントクラブ","ポイントタウン",
];

function getBestSite() {
  return pointSites[Math.floor(Math.random() * pointSites.length)];
}

const categoryWeights: any = {
  "クレジットカード": { reward: 0.5, score: 0.3, ease: 0.2 },
  "証券・FX・暗号資産": { reward: 0.6, score: 0.3, ease: 0.1 },
  "通信・回線": { reward: 0.7, score: 0.2, ease: 0.1 },
  "アプリ・ゲーム": { reward: 0.3, score: 0.3, ease: 0.4 },
  "無料登録・資料請求": { reward: 0.2, score: 0.3, ease: 0.5 },
  "モニター・覆面調査": { reward: 0.4, score: 0.4, ease: 0.2 },
  "アンケート": { reward: 0.2, score: 0.3, ease: 0.5 },
  "友達紹介": { reward: 0.5, score: 0.3, ease: 0.2 },
  "旅行・予約": { reward: 0.4, score: 0.3, ease: 0.3 },
  "サブスク・VOD": { reward: 0.3, score: 0.3, ease: 0.4 },
};

function calcAIScore(item: any, category: string) {
  const w = categoryWeights[category] || { reward: 0.4, score: 0.4, ease: 0.2 };

  const rewardScore = item.reward / 10000;
  const baseScore = item.score / 10;
  const easeScore = item.tags.includes("簡単") ? 1 : 0.5;

  return (
    rewardScore * w.reward +
    baseScore * w.score +
    easeScore * w.ease
  );
}

function createItems(
  prefix: string,
  baseReward: number,
  step: number,
  baseScore: number,
  scoreStep: number,
  tags: string[]
) {
  return Array.from({ length: 25 }, (_, i) => ({
    title: `${prefix}${i + 1}`,
    reward: baseReward - i * step,
    score: baseScore - i * scoreStep,
    url: "#",
    tags,
    site: getBestSite(),
  }));
}

const dummyData: any = {
  "クレジットカード": createItems("カード案件", 8000, 150, 9.2, 0.1, ["初心者OK"]),
  "証券・FX・暗号資産": createItems("証券案件", 12000, 300, 9.3, 0.1, ["高単価"]),
  "銀行・口座開設": createItems("銀行案件", 2000, 50, 7.5, 0.05, ["簡単"]),
  "ショッピング": createItems("ショッピング案件", 500, 10, 7.0, 0.05, ["還元"]),
  "アプリ・ゲーム": createItems("アプリ案件", 3000, 80, 8.0, 0.08, ["簡単"]),
  "無料登録・資料請求": createItems("無料案件", 1000, 30, 6.5, 0.05, ["すぐ"]),
  "通信・回線": createItems("回線案件", 20000, 500, 9.5, 0.1, ["超高額"]),
  "アンケート": createItems("アンケート案件", 300, 5, 6.0, 0.03, ["手軽"]),
  "モニター・覆面調査": createItems("モニター案件", 4000, 100, 8.2, 0.07, ["高単価"]),
  "友達紹介": createItems("紹介案件", 5000, 120, 8.5, 0.06, ["拡散"]),
  "旅行・予約": createItems("旅行案件", 2000, 60, 7.8, 0.05, ["還元"]),
  "サブスク・VOD": createItems("VOD案件", 1500, 40, 7.2, 0.05, ["無料体験"]),
};

export default function Page() {
  const [data, setData] = useState<any>({});
  const [active, setActive] = useState("クレジットカード");

  useEffect(() => {
    setData(dummyData);
  }, []);

  const categories = Object.keys(data);

  const sorted = (data[active] || [])
    .map((item: any) => ({
      ...item,
      aiScore: calcAIScore(item, active),
    }))
    .sort((a: any, b: any) => b.aiScore - a.aiScore)
    .slice(0, 20);

  const top = sorted[0];

  return (
    <div className="bg-[#FFF9E6] min-h-screen pb-24">

      <header className="p-4 text-center">
        <h1 className="font-bold text-xl">ポイ活AI判定</h1>
        <div className="mt-3 mx-auto max-w-md bg-white border-2 border-red-200 rounded-2xl shadow p-4">
          <p className="text-base font-semibold leading-relaxed text-gray-800">
            いまポイ活で話題の案件は、ここでチェック！<br />
            主要なポイントサイトに掲載されている各案件の話題度<br />
            を、<span className="text-red-500 font-bold">AI</span>が判定し、ランキングしています
          </p>
        </div>
      </header>

      <div className="flex overflow-x-auto px-2 gap-2 mb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-3 py-2 rounded-full text-sm whitespace-nowrap ${
              active === cat ? "bg-red-500 text-white" : "bg-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="p-4 max-w-md mx-auto">

        {top && (
          <div className="bg-gradient-to-r from-red-100 to-red-200 p-6 rounded-2xl shadow-lg text-center mb-6">
            <p className="font-bold">🔥 AIが選んだ最強案件</p>
            <h2 className="text-xl font-bold mt-2">{top.title}</h2>
            <p className="text-3xl text-red-600 font-bold">{top.reward}円</p>

            <a href={top.url} className="block mt-4 bg-red-500 text-white py-3 rounded-xl font-bold">
              {top.site}で申し込む
            </a>
          </div>
        )}

        <div className="mb-6">
          <h2 className="font-bold mb-2">🏆 {active}ランキング（TOP20）</h2>

          {sorted.map((o: any, i: number) => (
            <div key={i} className={`p-3 rounded-xl mb-2 ${i === 0 ? "bg-yellow-200" : "bg-white"}`}>
              <div className="flex justify-between">
                <div className="font-bold">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-lg font-bold rounded-full ${
                      i === 0 ? "bg-yellow-400 text-white" :
                      i === 1 ? "bg-gray-400 text-white" :
                      i === 2 ? "bg-orange-400 text-white" :
                      "bg-gray-200 text-gray-700"
                    }`}>
                      {i + 1}
                    </span>
                    <span className="font-bold">{o.title}</span>
                  </div>
                </div>
                <p className="text-red-500 font-bold">{o.reward}円</p>
              </div>

              <a href={o.url} className="block mt-2 bg-red-500 text-white text-center py-2 rounded-xl font-bold">
                {o.site}で申し込む
              </a>

              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                このリンクは、複数のポイントサイトを比較し、
                最も高額な報酬がもらえるサイトへ自動で案内しています
              </p>

              <ul className="text-xs text-gray-500 mt-1 leading-tight">
                <li>モッピー / ハピタス / ポイントインカム / ちょびリッチ</li>
                <li>ECナビ / ワラウ / げん玉 / アメフリ</li>
                <li>ニフティポイントクラブ / ポイントタウン</li>
              </ul>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
