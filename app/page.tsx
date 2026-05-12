"use client";
import Link from "next/link";
import Image from "next/image";

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

type TrendBadge = {
  icon: string;
  text: string;
  className: string;
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
        setItems(data.slice(0, 50));

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
      "信長の野望 覇道": "nobunaga-hadou",
      "三井住友カード（NL）": "smbc-card-nl",
      PayPayカード: "paypay-card",
      "TikTok Lite": "tiktok-lite",
      楽天証券: "rakuten-sec",
      楽天市場: "rakuten-market",
      住信SBIネット銀行: "sbi-sumishin-bank",
      "Amazon Prime": "amazon-prime",
      マージマンション: "merge-mansion",
      "U-NEXT": "u-next",
      "dカード GOLD": "d-card-gold",
      セゾンカードインターナショナル: "saison-card-international",
      auカブコム証券: "au-kabucom-sec",
      Pontaパス: "ponta-pass",
      メルカリ: "mercari",
      LINEマンガ: "line-manga",
      エポスカード: "epos-card",
      マネックス証券: "monex-sec",
      "イオンカード（WAON一体型）": "aeon-card-waon",
      ahamo: "ahamo",
      "YouTube Premium": "youtube-premium",
      "マイナポイント（申請支援）": "mynapoint-support",
      d払い: "dbarai",
      ヤフーカード: "yahoo-card",
      ソニー銀行: "sony-bank",
      "七つの大罪 光と闇の交戦": "nanatsu-grand-cross",
      "ブルーロック Project: World Champion": "bluelock-pwc",
      トリマ: "trima",
      "Visa LINE Payクレジットカード": "visa-line-pay-card",
    };

    return map[name] || "";
  };

  const getAiReasons = (item: CategoryScore): AiReason[] => {
    const category = item.category;

    if (category.includes("通信")) {
      return [
        {
          icon: "📈",
          title: "高額ポイント",
          text: "高還元案件として急上昇中",
        },
        {
          icon: "💗",
          title: "SNS話題化",
          text: "投稿数・検索数が増加",
        },
        {
          icon: "⚡",
          title: "申込増加",
          text: "短期間で人気拡大中",
        },
      ];
    }

    if (category.includes("ゲーム") || category.includes("アプリ")) {
      return [
        {
          icon: "🔥",
          title: "急上昇",
          text: "関連検索が急増中",
        },
        {
          icon: "🎮",
          title: "人気拡大",
          text: "ユーザー流入が増加",
        },
        {
          icon: "⏱",
          title: "達成しやすい",
          text: "短期間攻略が可能",
        },
      ];
    }

    if (category.includes("カード") || category.includes("クレジット")) {
      return [
        {
          icon: "💰",
          title: "高還元",
          text: "大型ポイント案件",
        },
        {
          icon: "📈",
          title: "検索増加",
          text: "比較検討ユーザー増加",
        },
        {
          icon: "👤",
          title: "初心者向け",
          text: "申込条件がわかりやすい",
        },
      ];
    }

    if (category.includes("証券") || category.includes("投資")) {
      return [
        {
          icon: "📊",
          title: "投資人気",
          text: "NISA需要で注目増加",
        },
        {
          icon: "💰",
          title: "高ポイント",
          text: "還元期待値が高い",
        },
        {
          icon: "🔥",
          title: "検索急増",
          text: "口座開設需要が拡大",
        },
      ];
    }

    return [
      {
        icon: "📈",
        title: "検索上昇",
        text: "Google検索で話題化",
      },
      {
        icon: "💗",
        title: "注目案件",
        text: "SNS流入が増加中",
      },
      {
        icon: "🎁",
        title: "人気拡大",
        text: "利用者数が増加傾向",
      },
    ];
  };

  const getTrendBadges = (item: CategoryScore): TrendBadge[] => {
    const category = item.category;

    if (category.includes("通信")) {
      return [
        {
          icon: "🔥",
          text: "急上昇",
          className:
            "bg-red-50 text-red-500 ring-1 ring-red-100",
        },
        {
          icon: "💰",
          text: "高還元",
          className:
            "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-100",
        },
      ];
    }

    if (category.includes("カード")) {
      return [
        {
          icon: "📈",
          text: "検索急増",
          className:
            "bg-pink-50 text-pink-500 ring-1 ring-pink-100",
        },
        {
          icon: "💰",
          text: "高単価",
          className:
            "bg-orange-50 text-orange-600 ring-1 ring-orange-100",
        },
      ];
    }

    if (category.includes("ゲーム") || category.includes("アプリ")) {
      return [
        {
          icon: "🎮",
          text: "人気拡大",
          className:
            "bg-violet-50 text-violet-600 ring-1 ring-violet-100",
        },
        {
          icon: "🔥",
          text: "SNS話題",
          className:
            "bg-rose-50 text-rose-500 ring-1 ring-rose-100",
        },
      ];
    }

    return [
      {
        icon: "📈",
        text: "トレンド",
        className:
          "bg-pink-50 text-pink-500 ring-1 ring-pink-100",
      },
    ];
  };

  const getDynamicReason = (item: CategoryScore) => {
    const category = item.category;

    if (category.includes("通信")) {
      return "高額ポイント案件としてSNS流入が増加しており、短期間で申し込みが伸びています。";
    }

    if (category.includes("カード")) {
      return "比較検索ユーザーが増加しており、高還元案件として注目を集めています。";
    }

    if (category.includes("証券")) {
      return "NISA・投資需要の拡大により、口座開設系案件の人気が急上昇しています。";
    }

    if (category.includes("ゲーム") || category.includes("アプリ")) {
      return "SNSでの拡散が強く、短期間で条件達成しやすい案件として注目されています。";
    }

    return "Google検索とSNS流入の両方で注目度が上昇している案件です。";
  };

  const getRankStyle = (index: number) => {
    if (index === 0) {
      return {
        crown: "👑",
        badge: "from-yellow-300 to-amber-500",
        ring: "ring-yellow-100",
      };
    }

    if (index === 1) {
      return {
        crown: "♛",
        badge: "from-slate-300 to-slate-500",
        ring: "ring-slate-100",
      };
    }

    if (index === 2) {
      return {
        crown: "♛",
        badge: "from-orange-400 to-orange-700",
        ring: "ring-orange-100",
      };
    }

    return {
      crown: "",
      badge: "from-white to-white",
      ring: "ring-slate-100",
    };
  };

  const topItems = items.slice(0, 3);
  const listItems = items.slice(3, 50);

  return (
    <>
      <div className="min-h-screen bg-[#fff8fb]">
        <header className="overflow-hidden bg-gradient-to-r from-[#FFF2F7] via-[#FFF8FA] to-[#FFF4F7]">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-10 px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-12">
            <div className="w-full lg:w-[680px]">
              <div className="inline-flex items-center gap-3 rounded-full border-2 border-pink-300 bg-white px-6 py-3 text-base font-black text-pink-600 shadow-[0_10px_30px_rgba(236,72,153,0.18)] lg:text-xl">
                <span>🤖</span>
                <span>AIが毎日判定！</span>
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
                  のデータを中心に、AIがおすすめのポイ活を判定し、
                  <span className="text-pink-600">毎日（0:00～1:00頃）</span>
                  にランキングに反映しています。
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
              <h2 className="text-3xl font-black text-slate-900 lg:text-5xl">
                🔍 いまGoogleで話題のポイ活関連キーワード
              </h2>
            </div>

            <div className="rounded-[1.5rem] bg-gradient-to-br from-pink-50 via-white to-orange-50 p-5 lg:p-7">
              <div className="flex flex-wrap items-center gap-3">
                {trendTags.map((tag) => (
                  <div
                    key={tag.word}
                    className={`rounded-full bg-pink-100 px-5 py-3 font-black text-pink-600 transition hover:scale-105 ${
                      tag.score >= 90
                        ? "text-3xl"
                        : tag.score >= 70
                        ? "text-2xl"
                        : tag.score >= 50
                        ? "text-xl"
                        : "text-base"
                    }`}
                  >
                    {tag.word}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="mt-12 mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🔥</span>

              <h2 className="text-3xl font-black text-slate-900 lg:text-5xl">
                ただいまのポイ活おすすめランキング
              </h2>
            </div>

            <div className="rounded-full bg-white px-5 py-3 text-sm font-black text-slate-500 shadow-lg ring-1 ring-slate-100">
              最終更新：
              <span className="text-slate-700">{updatedAt}</span>
            </div>
          </div>

          <section className="space-y-4">
            {topItems.map((item, index) => {
              const reasons = getAiReasons(item);
              const badges = getTrendBadges(item);
              const offerName = getOfferName(item);
              
              const rankStyle = getRankStyle(index);

              return (
                <article
                  key={`${item.rank}-${item.offer_name}-${index}`}
                  className={`rounded-[2rem] bg-white p-5 shadow-lg ring-1 ${rankStyle.ring} lg:p-7`}
                >
                  <div className="grid gap-6 lg:grid-cols-[120px_1.5fr_1.2fr_260px] lg:items-center">
                    <div className="flex items-center justify-center lg:block">
                      <div className="text-center">
                        <div className="text-4xl leading-none">
                          {rankStyle.crown}
                        </div>

                        <div
                          className={`mx-auto mt-1 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${rankStyle.badge} text-5xl font-black text-white shadow-xl`}
                        >
                          {index + 1}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <div className="inline-flex rounded-full bg-pink-50 px-5 py-2 text-sm font-black text-pink-500">
                          {item.category}
                        </div>

                        {badges.map((badge) => (
                          <div
                            key={badge.text}
                            className={`inline-flex items-center rounded-full px-4 py-2 text-xs font-black ${badge.className}`}
                          >
                            <span className="mr-1">{badge.icon}</span>
                            {badge.text}
                          </div>
                        ))}
                      </div>

                      <h3 className="text-3xl font-black leading-tight text-slate-900 lg:text-4xl">
  　　　　　　　　　　　　{offerName}
　　　　　　　　　　　　</h3>

                      <p className="mt-4 text-base font-bold leading-8 text-slate-600">
                        {getDynamicReason(item)}
                      </p>
                    </div>

                    <div>
                      <div className="mb-3 text-center text-sm font-black text-pink-500">
                        ー AIが評価した理由 ー
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {reasons.map((reason) => (
                          <div
                            key={reason.title}
                            className="rounded-2xl bg-pink-50/80 px-3 py-4 text-center"
                          >
                            <div className="text-3xl">{reason.icon}</div>

                            <div className="mt-2 text-sm font-black text-slate-900">
                              {reason.title}
                            </div>

                            <div className="mt-1 text-xs font-bold leading-snug text-slate-600">
                              {reason.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-center lg:justify-end">
                      <button
                        onClick={() => trackMoppyClick(item.category)}
                        className="flex h-20 w-full max-w-[260px] items-center justify-center rounded-2xl bg-gradient-to-r from-pink-500 to-orange-500 px-6 text-center text-xl font-black text-white shadow-xl transition hover:scale-105"
                      >
                        モッピーで探す
                        <span className="ml-3 text-3xl leading-none">›</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="mt-6 overflow-hidden rounded-[2rem] bg-white shadow-lg ring-1 ring-pink-100">
            <div className="divide-y divide-pink-100">
              {listItems.map((item, listIndex) => {
                const index = listIndex + 3;
                const reasons = getAiReasons(item);
                const badges = getTrendBadges(item);
                const offerName = getOfferName(item);
                

                return (
                  <article
                    key={`${item.rank}-${item.offer_name}-${index}`}
                    className="grid gap-4 p-5 transition hover:bg-pink-50/40 lg:grid-cols-[58px_170px_1.3fr_1.5fr_210px] lg:items-center lg:gap-5"
                  >
                    <div className="flex items-center gap-3 lg:justify-center">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg font-black text-slate-900 shadow-sm ring-1 ring-slate-200">
                        {index + 1}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex rounded-full bg-pink-50 px-4 py-1.5 text-sm font-black text-pink-500">
                        {item.category}
                      </div>

                      {badges.map((badge) => (
                        <div
                          key={badge.text}
                          className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black ${badge.className}`}
                        >
                          <span className="mr-1">{badge.icon}</span>
                          {badge.text}
                        </div>
                      ))}
                    </div>

                    <div>
                      <h3 className="text-2xl font-black text-slate-900">
  　　　　　　　　　　　　{offerName}
　　　　　　　　　　　　</h3>

                      <p className="mt-2 text-sm font-bold leading-7 text-slate-600">
                        {getDynamicReason(item)}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {reasons.map((reason) => (
                        <div
                          key={reason.title}
                          className="rounded-2xl bg-pink-50/80 px-3 py-3 text-center shadow-sm"
                        >
                          <div className="text-2xl">{reason.icon}</div>

                          <div className="mt-1 text-sm font-black text-slate-900">
                            {reason.title}
                          </div>

                          <div className="mt-1 text-xs font-bold leading-snug text-slate-600">
                            {reason.text}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex lg:justify-end">
                      <button
                        onClick={() => trackMoppyClick(item.category)}
                        className="flex h-12 w-full max-w-[210px] items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 px-4 text-sm font-black text-white shadow-md transition hover:scale-105"
                      >
                        モッピーで探す
                        <span className="ml-2 text-xl leading-none">›</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <p className="mt-8 text-center text-xs font-bold text-slate-400 lg:text-sm">
            ※ 本ランキングはAIによる分析結果をもとに作成しています。実際の成果やポイント獲得を保証するものではありません。
          </p>
        </main>
      </div>
    </>
  );
}
