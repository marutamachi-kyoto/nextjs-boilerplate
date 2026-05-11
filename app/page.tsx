# app/page.tsx（全文コピペ用）

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const MOPPY_URL =
  "https://pc.moppy.jp/entry/invite.php?invite=ut3GA1ce&openExternalBrowser=1";

type CategoryScore = {
  category: string;
  rank: number;
  trend_keyword: string;
  offer_name?: string;
  reason: string;
  primary_site_name: string;
  primary_site_url: string;
  secondary_site_name?: string;
  secondary_site_url?: string;
  updated_at?: string;
};

type TrendTag = {
  word: string;
  score: number;
  category?: string;
};

type AiReason = {
  icon: string;
  title: string;
  text: string;
};

export default function Page() {
  const [items, setItems] = useState<CategoryScore[]>([]);
  const [updatedAt, setUpdatedAt] = useState("-");
  const [trendTags, setTrendTags] = useState<TrendTag[]>([]);

  useEffect(() => {
    fetch("/api/trends")
      .then((res) => res.json())
      .then((json) => setTrendTags(json.data || []));

    fetch("/api/score")
      .then((res) => res.json())
      .then((json) => {
        const data = json.data || [];
        setItems(data.slice(0, 30));

        if (data[0]?.updated_at) {
          setUpdatedAt(
            new Date(data[0].updated_at).toLocaleDateString("ja-JP")
          );
        }
      });
  }, []);

  const trackMoppyClick = async (category: string) => {
    try {
      await fetch("/api/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          site_name: "モッピー",
        }),
      });
    } catch (e) {}

    window.open(MOPPY_URL, "_blank");
  };

  const getOfferName = (item: CategoryScore) => {
    return item.offer_name || item.trend_keyword || item.category;
  };

  const getOfferSlug = (name: string) => {
    const map: Record<string, string> = {
      楽天モバイル: "rakuten-mobile",
      "U-NEXT": "u-next",
      PayPayカード: "paypay-card",
      楽天証券: "rakuten-sec",
      楽天市場: "rakuten-market",
      メルカリ: "mercari",
      ahamo: "ahamo",
      トリマ: "trima",
    };

    return map[name] || "";
  };

  const getAiReasons = (item: CategoryScore): AiReason[] => {
    const category = item.category;

    if (category.includes("通信")) {
      return [
        { icon: "📈", title: "高額ポイント", text: "還元期待値が高い" },
        { icon: "💗", title: "SNSで話題", text: "検索・投稿が増加" },
        { icon: "🎁", title: "条件が明確", text: "比較しやすい案件" },
      ];
    }

    if (category.includes("カード")) {
      return [
        { icon: "¥", title: "高額還元", text: "ポイント単価が高い" },
        { icon: "⚡", title: "即効性あり", text: "成果につながりやすい" },
        { icon: "👤", title: "初心者向け", text: "申込がシンプル" },
      ];
    }

    return [
      { icon: "📈", title: "検索上昇", text: "話題性が高い" },
      { icon: "💗", title: "注目度あり", text: "関心が増加中" },
      { icon: "🎁", title: "案件向き", text: "ポイ活と相性良好" },
    ];
  };

  return (
    <>
      <div className="min-h-screen bg-[#fff8fb]">
        <header className="overflow-hidden bg-gradient-to-r from-[#FFF2F7] via-[#FFF8FA] to-[#FFF4F7]">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-10 px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-12">
            <div className="w-full lg:w-[680px]">
              <div className="inline-flex items-center gap-3 rounded-full border-2 border-pink-300 bg-white px-6 py-3 text-base font-black text-pink-600 shadow-[0_10px_30px_rgba(236,72,153,0.18)] lg:text-xl">
                <span>🤖</span>
                <span>AIが毎日（0:00）更新！</span>
              </div>

              <h1 className="mt-8 text-[54px] font-black leading-[0.95] tracking-[-0.05em] text-pink-600 lg:text-[96px]">
                ポイ活
                <span className="bg-gradient-to-b from-yellow-300 to-orange-500 bg-clip-text text-transparent">
                  AI
                </span>
                判定
              </h1>

              <div className="mt-8 text-[20px] font-black leading-[1.9] text-[#27313f] lg:text-[28px]">
                <p>
                  <span className="text-pink-600">「Googleでの話題度」</span>
                  のデータを中心に、おすすめのポイ活をAIが判定し、
                  <span className="text-pink-600">毎日（0:00）</span>
                  にランキング反映しています。
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-6">
                <div className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-black text-slate-500 shadow-lg ring-1 ring-slate-100">
                  最終更新：
                  <span className="ml-2 text-base text-slate-600">
                    {updatedAt}
                  </span>
                </div>

                <Link
                  href="/about-poikatsu"
                  className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-black text-green-600 shadow-lg ring-2 ring-green-200 transition hover:scale-105 hover:bg-green-50 lg:text-base"
                >
                  <span className="mr-2 text-xl">🔰</span>
                  ポイ活とは？
                </Link>
              </div>
            </div>

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

        <main className="mx-auto max-w-[1500px] px-4 py-8 lg:px-8 lg:py-10">
          <section className="mb-10 rounded-[2rem] bg-white p-5 shadow-lg ring-1 ring-pink-100 lg:p-8">
            <div className="mb-6">
              <p className="text-sm font-black text-pink-500">
                Googleトレンド分析
              </p>

              <h2 className="text-3xl font-black text-slate-800 lg:text-4xl">
                🔍 いまGoogleで話題のポイ活関連キーワード
              </h2>
            </div>

            <div className="rounded-[1.5rem] bg-gradient-to-br from-pink-50 via-white to-orange-50 p-5 lg:p-7">
              <div className="flex flex-wrap items-center gap-3">
                {trendTags.map((tag) => (
                  <div
                    key={tag.word}
                    className="rounded-full bg-pink-100 px-5 py-3 text-lg font-black text-pink-600"
                  >
                    {tag.word}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="mb-6 flex items-center gap-3">
            <span className="text-4xl">🔥</span>

            <h2 className="text-3xl font-black text-slate-900 lg:text-5xl">
              いまおすすめのポイ活ランキング
            </h2>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => {
              const reasons = getAiReasons(item);
              const offerName = getOfferName(item);
              const offerSlug = getOfferSlug(offerName);

              return (
                <article
                  key={`${item.rank}-${item.offer_name}-${index}`}
                  className="rounded-[2rem] bg-white p-4 shadow-lg ring-1 ring-pink-100 lg:p-6"
                >
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-[120px_1.4fr_1.2fr_290px] lg:items-center">
                    <div className="flex items-center justify-center">
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-pink-500 text-5xl font-black text-white shadow-lg">
                        {index + 1}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 inline-flex rounded-full bg-pink-50 px-3 py-1 text-xs font-black text-pink-500">
                        {item.category}
                      </div>

                      {offerSlug ? (
                        <Link
                          href={`/offers/${offerSlug}`}
                          className="block transition hover:opacity-80"
                        >
                          <h3 className="text-3xl font-black leading-tight text-slate-900 hover:text-pink-500 lg:text-5xl">
                            {offerName}
                          </h3>
                        </Link>
                      ) : (
                        <h3 className="text-3xl font-black leading-tight text-slate-900 lg:text-5xl">
                          {offerName}
                        </h3>
                      )}

                      <p className="mt-2 text-sm font-bold text-pink-500 lg:text-base">
                        AI注目ワード：{item.trend_keyword}
                      </p>

                      <p className="mt-3 text-sm leading-relaxed text-slate-600 lg:text-base">
                        {item.reason}
                      </p>
                    </div>

                    <div>
                      <div className="mb-3 text-center text-sm font-black text-pink-500">
                        ー AIが評価した理由 ー
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {reasons.map((reason) => (
                          <div
                            key={reason.title}
                            className="rounded-2xl bg-pink-50/70 px-3 py-3 text-center"
                          >
                            <div className="text-3xl">{reason.icon}</div>

                            <div className="mt-1 text-sm font-black text-slate-900">
                              {reason.title}
                            </div>

                            <div className="mt-1 text-xs font-bold leading-snug text-slate-600">
                              {reason.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => trackMoppyClick(item.category)}
                        className="group flex h-24 w-full max-w-[270px] flex-col items-center justify-center rounded-[1.5rem] bg-gradient-to-r from-pink-500 to-orange-500 px-6 text-center font-black text-white shadow-xl ring-8 ring-pink-50 transition hover:scale-105 lg:h-28"
                      >
                        <span className="text-2xl leading-none tracking-wide">
                          moppy
                        </span>
                        <span className="mt-2 flex items-center text-2xl text-yellow-100">
                          モッピーで探す
                        </span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </main>
      </div>
    </>
  );
}
```
