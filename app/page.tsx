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
  reward?: number;
  reason: string;
  primary_site_name: string;
  primary_site_url: string;
  updated_at?: string;
};

type TrendTag = {
  word: string;
  score: number;
  category?: string;
};

type TrendBadge = {
  icon: string;
  text: string;
  className: string;
};

const normalizeText = (text?: string) => {
  return (text || "")
    .toLowerCase()
    .replace(/　/g, "")
    .replace(/\s+/g, "")
    .replace(/（/g, "(")
    .replace(/）/g, ")")
    .replace(/[・･]/g, "")
    .replace(/[ーｰ−]/g, "-")
    .trim();
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
            new Date(data[0].updated_at).toLocaleString("ja-JP", {
              year: "numeric",
              month: "numeric",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          );
        }
      });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const searchParams = new URLSearchParams(window.location.search);
    const from = searchParams.get("from");
    const hash = window.location.hash
      ? decodeURIComponent(window.location.hash.replace("#", ""))
      : "";

    const targetId = from || hash;

    if (!targetId) return;

    const scrollToTarget = () => {
      const target = document.getElementById(targetId);

      if (!target) return;

      target.scrollIntoView({
        behavior: "auto",
        block: targetId === "ranking-section" ? "start" : "center",
      });
    };

    scrollToTarget();

    const timer1 = window.setTimeout(scrollToTarget, 300);
    const timer2 = window.setTimeout(scrollToTarget, 800);
    const timer3 = window.setTimeout(scrollToTarget, 1200);

    return () => {
      window.clearTimeout(timer1);
      window.clearTimeout(timer2);
      window.clearTimeout(timer3);
    };
  }, [items.length]);

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

  const getReviewPath = (offerName: string) => {
    return `/reviews/${encodeURIComponent(offerName)}`;
  };

  const getReviewPathWithFrom = (
    offerName: string,
    item: CategoryScore,
    index: number
  ) => {
    const from = getRankingId(item, index);
    return `${getReviewPath(offerName)}?from=${encodeURIComponent(from)}`;
  };

  const getRankingId = (item: CategoryScore, index: number) => {
    return `ranking-${index + 1}-${normalizeText(getOfferName(item))}`;
  };

  const findMatchedRanking = (tagWord: string) => {
    const normalizedTagWord = normalizeText(tagWord);

    return items.find((item) => {
      const normalizedOfferName = normalizeText(getOfferName(item));
      const normalizedTrendKeyword = normalizeText(item.trend_keyword);
      const normalizedCategory = normalizeText(item.category);

      return (
        normalizedOfferName === normalizedTagWord ||
        normalizedTrendKeyword === normalizedTagWord ||
        normalizedCategory === normalizedTagWord
      );
    });
  };

  const scrollToRanking = (item: CategoryScore) => {
    const index = items.findIndex((rankingItem) => rankingItem === item);
    const targetId = getRankingId(item, index);
    const target = document.getElementById(targetId);

    if (!target) return;

    target.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const scrollToTrendKeywords = () => {
    document.getElementById("trend-keywords")?.scrollIntoView({
      behavior: "auto",
      block: "start",
    });
  };

  const formatReward = (reward?: number) => {
    if (!reward || reward <= 0) return "データ取得不可";
    return `${reward.toLocaleString()}P`;
  };

  const getTrendBadges = (item: CategoryScore): TrendBadge[] => {
    const category = item.category;

    if (category.includes("通信")) {
      return [
        {
          icon: "🔥",
          text: "急上昇",
          className: "bg-red-50 text-red-500 ring-1 ring-red-100",
        },
        {
          icon: "💰",
          text: "高還元",
          className: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-100",
        },
      ];
    }

    if (category.includes("カード")) {
      return [
        {
          icon: "📈",
          text: "検索急増",
          className: "bg-pink-50 text-pink-500 ring-1 ring-pink-100",
        },
        {
          icon: "💰",
          text: "高単価",
          className: "bg-orange-50 text-orange-600 ring-1 ring-orange-100",
        },
      ];
    }

    if (category.includes("ゲーム") || category.includes("アプリ")) {
      return [
        {
          icon: "🎮",
          text: "人気拡大",
          className: "bg-violet-50 text-violet-600 ring-1 ring-violet-100",
        },
        {
          icon: "🔥",
          text: "SNS話題",
          className: "bg-rose-50 text-rose-500 ring-1 ring-rose-100",
        },
      ];
    }

    return [
      {
        icon: "📈",
        text: "トレンド",
        className: "bg-pink-50 text-pink-500 ring-1 ring-pink-100",
      },
    ];
  };

  const getDynamicReason = (item: CategoryScore) => {
    const category = item.category;
    const offerName = (item.offer_name || "").toLowerCase();

    if (offerName.includes("tiktok")) {
      return "友達招待系キャンペーンとしてSNSで急拡散しており、短期間で利用者が急増しています。";
    }

    if (offerName.includes("楽天市場")) {
      return "買い回り・ポイントアップ需要の増加により、検索数が急上昇しています。";
    }

    if (offerName.includes("amazon")) {
      return "サブスク需要と大型セール時期の影響で、継続的に注目を集めています。";
    }

    if (offerName.includes("u-next")) {
      return "無料トライアル案件として安定した人気があり、動画サブスク需要も拡大しています。";
    }

    if (offerName.includes("paypay")) {
      return "キャッシュレス決済需要の拡大により、検索数と利用者数が増加しています。";
    }

    if (offerName.includes("楽天カード")) {
      return "高還元キャンペーンが継続しており、クレジットカード案件の中でも人気が高い状態です。";
    }

    if (offerName.includes("楽天モバイル")) {
      return "高額ポイント還元と通信費節約需要により、申し込み数が急増しています。";
    }

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
        card: "from-yellow-50 via-white to-amber-50",
      };
    }

    if (index === 1) {
      return {
        crown: "♛",
        badge: "from-slate-300 to-slate-500",
        ring: "ring-slate-100",
        card: "from-slate-50 via-white to-blue-50",
      };
    }

    if (index === 2) {
      return {
        crown: "♛",
        badge: "from-orange-400 to-orange-700",
        ring: "ring-orange-100",
        card: "from-orange-50 via-white to-rose-50",
      };
    }

    const pastelCards = [
      "from-pink-50 via-white to-rose-50",
      "from-emerald-50 via-white to-teal-50",
      "from-violet-50 via-white to-fuchsia-50",
      "from-amber-50 via-white to-yellow-50",
      "from-cyan-50 via-white to-sky-50",
      "from-orange-50 via-white to-pink-50",
    ];

    const pastelBadges = [
      "from-pink-300 to-rose-400",
      "from-emerald-300 to-teal-400",
      "from-violet-300 to-fuchsia-400",
      "from-amber-300 to-orange-400",
      "from-cyan-300 to-sky-400",
      "from-orange-300 to-pink-400",
    ];

    const colorIndex = (index - 3) % pastelCards.length;

    return {
      crown: "",
      badge: pastelBadges[colorIndex],
      ring: "ring-pink-100",
      card: pastelCards[colorIndex],
    };
  };

  const topItems = items.slice(0, 3);
  const listItems = items.slice(3, 50);

  return (
    <div className="min-h-screen bg-[#fff8fb]">
      <header className="overflow-hidden bg-gradient-to-r from-[#FFF2F7] via-[#FFF8FA] to-[#FFF4F7]">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-10 px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-12">
          <div className="w-full lg:w-[680px]">
            <div className="inline-flex items-center gap-3 rounded-full border-2 border-pink-300 bg-white px-6 py-3 text-base font-black text-pink-600 shadow-[0_10px_30px_rgba(236,72,153,0.18)] lg:text-xl">
              <span>🤖</span>
              <span>AIが毎日自動で判定中！</span>
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
        <section
          id="trend-keywords"
          className="scroll-mt-6 mb-10 rounded-[2rem] bg-white p-5 shadow-lg ring-1 ring-pink-100 lg:p-8"
        >
          <div className="mb-6">
            <h2 className="text-3xl font-black text-slate-900 lg:text-5xl">
              🔍 いまGoogleで話題のポイ活関連キーワード
            </h2>

            <div className="mt-4 inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-black text-slate-500 shadow-lg ring-1 ring-slate-100">
              最終更新：
              <span className="ml-2 text-slate-700">{updatedAt}</span>
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-gradient-to-br from-pink-50 via-white to-orange-50 p-5 lg:p-7">
            <div className="flex flex-wrap items-center gap-3">
              {trendTags.map((tag) => {
                const matchedRanking = findMatchedRanking(tag.word);

                const textSizeClass =
                  tag.score >= 90
                    ? "text-3xl"
                    : tag.score >= 70
                    ? "text-2xl"
                    : tag.score >= 50
                    ? "text-xl"
                    : "text-base";

                if (matchedRanking) {
                  return (
                    <button
                      key={tag.word}
                      type="button"
                      onClick={() => scrollToRanking(matchedRanking)}
                      className={`rounded-full bg-pink-100 px-5 py-3 font-black text-pink-600 underline decoration-2 underline-offset-4 transition hover:scale-105 hover:bg-pink-200 active:scale-95 ${textSizeClass}`}
                      title="ランキング内の該当案件へ移動"
                    >
                      {tag.word}
                    </button>
                  );
                }

                return (
                  <div
                    key={tag.word}
                    className={`rounded-full bg-pink-100 px-5 py-3 font-black text-pink-600 transition hover:scale-105 ${textSizeClass}`}
                  >
                    {tag.word}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div id="ranking-section" className="mt-12 mb-6 scroll-mt-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🔥</span>
            <h2 className="text-3xl font-black text-slate-900 lg:text-5xl">
              いま
              <span className="bg-gradient-to-b from-yellow-300 to-orange-500 bg-clip-text text-transparent">
                AI
              </span>
              がおすすめするポイ活ランキング
            </h2>
          </div>

          <div className="mt-4 inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-black text-slate-500 shadow-lg ring-1 ring-slate-100">
            最終更新：
            <span className="ml-2 text-slate-700">{updatedAt}</span>
          </div>
        </div>

        <section className="space-y-4">
          {topItems.map((item, index) => {
            const badges = getTrendBadges(item);
            const offerName = getOfferName(item);
            const rankStyle = getRankStyle(index);

            return (
              <article
                key={`${item.rank}-${item.offer_name}-${index}`}
                id={getRankingId(item, index)}
                className={`scroll-mt-8 rounded-[2rem] bg-gradient-to-r ${rankStyle.card} p-5 shadow-lg ring-1 ${rankStyle.ring} lg:p-7`}
              >
                <div className="grid gap-6 lg:grid-cols-[100px_1fr] lg:items-center xl:grid-cols-[120px_1.5fr_260px_260px]">
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
                      <div className="inline-flex rounded-full bg-white/80 px-5 py-2 text-sm font-black text-pink-500 ring-1 ring-pink-100">
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

                  <div className="rounded-[1.5rem] bg-white/90 px-5 py-5 text-center shadow-sm ring-1 ring-pink-100">
                    <div className="text-base font-black text-slate-600 lg:text-lg">
                      報酬ポイントの目安
                    </div>
                    <div className="mt-2 text-4xl font-black tracking-tight text-pink-500 lg:text-5xl">
                      {formatReward(item.reward)}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3 lg:items-end">
                    <button
                      onClick={() => trackMoppyClick(item.category)}
                      className="flex h-16 w-full max-w-[260px] items-center justify-center rounded-2xl bg-gradient-to-r from-pink-500 to-orange-500 px-6 text-center text-xl font-black text-white shadow-xl transition hover:scale-105"
                    >
                      モッピーで探す
                      <span className="ml-3 text-3xl leading-none">›</span>
                    </button>

                    <Link
                      href={getReviewPathWithFrom(offerName, item, index)}
                      className="flex h-14 w-full max-w-[260px] items-center justify-center rounded-2xl border-2 border-pink-200 bg-white px-5 text-center text-base font-black text-pink-600 shadow-md transition hover:scale-105 hover:bg-pink-50"
                    >
                      口コミ・評判を見る
                      <span className="ml-2 text-xl leading-none">›</span>
                    </Link>
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
              const badges = getTrendBadges(item);
              const offerName = getOfferName(item);
              const rankStyle = getRankStyle(index);

              return (
                <article
                  key={`${item.rank}-${item.offer_name}-${index}`}
                  id={getRankingId(item, index)}
                  className={`scroll-mt-8 grid gap-4 bg-gradient-to-r ${rankStyle.card} p-5 transition hover:scale-[1.01] xl:grid-cols-[58px_170px_1.3fr_220px_210px] xl:items-center xl:gap-5`}
                >
                  <div className="flex items-center gap-3 lg:justify-center">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${rankStyle.badge} text-lg font-black text-white shadow-lg`}
                    >
                      {index + 1}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex rounded-full bg-white/80 px-4 py-1.5 text-sm font-black text-pink-500 ring-1 ring-pink-100">
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

                  <div className="rounded-2xl bg-white/90 px-4 py-4 text-center shadow-sm ring-1 ring-pink-100">
                    <div className="text-sm font-black text-slate-600 lg:text-base">
                      報酬ポイントの目安
                    </div>
                    <div className="mt-1 text-3xl font-black text-pink-500">
                      {formatReward(item.reward)}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2 lg:items-end">
                    <button
                      onClick={() => trackMoppyClick(item.category)}
                      className="flex h-12 w-full max-w-[210px] items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 px-4 text-sm font-black text-white shadow-md transition hover:scale-105"
                    >
                      モッピーで探す
                      <span className="ml-2 text-xl leading-none">›</span>
                    </button>

                    <Link
                      href={getReviewPathWithFrom(offerName, item, index)}
                      className="flex h-11 w-full max-w-[210px] items-center justify-center rounded-xl border-2 border-pink-200 bg-white px-4 text-xs font-black text-pink-600 shadow-sm transition hover:scale-105 hover:bg-pink-50"
                    >
                      口コミ・評判を見る
                      <span className="ml-2 text-base leading-none">›</span>
                    </Link>
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

      <button
        type="button"
        onClick={scrollToTrendKeywords}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 px-5 py-4 text-sm font-black text-white shadow-2xl transition hover:scale-105 active:scale-95 lg:bottom-8 lg:right-8 lg:px-6 lg:text-base"
      >
        🔍 話題キーワードへ
      </button>
    </div>
  );
}
