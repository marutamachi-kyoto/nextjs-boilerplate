"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const MOPPY_URL =
  "https://pc.moppy.jp/entry/invite.php?invite=ut3GA1ce&openExternalBrowser=1";

type CategoryScore = {
  category: string;
  rank: number;
  trend_keyword: string;
  offer_name?: string;
  reward?: number | null;
  reason?: string;
  image_url?: string;
  primary_site_name?: string;
  primary_site_url?: string;
  updated_at?: string;
};

type TrendTag = {
  word: string;
  score: number;
  category?: string;
};

type TopPageClientProps = {
  initialItems?: CategoryScore[];
  initialTrendTags?: TrendTag[];
  initialUpdatedAt?: string;
};

const normalizeText = (text?: string) => {
  return (text || "")
    .toLowerCase()
    .replace(/\u3000/g, "")
    .replace(/\s+/g, "")
    .replace(/\uff08/g, "(")
    .replace(/\uff09/g, ")")
    .replace(/[\u30fb\uff65]/g, "")
    .replace(/[\u30fc\uff70\u2212]/g, "-")
    .replace(/[\[\]\u3010\u3011!\uff01?\uff1f\u3002\u3001\u300c\u300d\u300e\u300f()\uff08\uff09]/g, "")
    .trim();
};

const getStorageKey = (offerName: string, likeDate?: string) => {
  return `poikatu-liked:${likeDate || "today"}:${offerName}`;
};

const isDirectMoppyUrl = (url?: string) => {
  return Boolean(
    url && url.includes("pc.moppy.jp/") && !url.includes("/entry/invite.php")
  );
};

const getRankStyle = (index: number) => {
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

  const colorIndex = index % pastelCards.length;

  return {
    badge: pastelBadges[colorIndex],
    card: pastelCards[colorIndex],
  };
};

export default function Page({
  initialItems = [],
  initialTrendTags = [],
  initialUpdatedAt = "-",
}: TopPageClientProps) {
  const [items, setItems] = useState<CategoryScore[]>(initialItems);
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [trendTags, setTrendTags] = useState<TrendTag[]>(initialTrendTags);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [likeDate, setLikeDate] = useState("");
  const [likedOffers, setLikedOffers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialTrendTags.length === 0) {
      fetch("/api/trends", { cache: "no-store" })
        .then((res) => res.json())
        .then((json) => setTrendTags(json.data || []))
        .catch(() => {});
    }

    if (initialItems.length === 0) {
      fetch("/api/score", { cache: "no-store" })
        .then((res) => res.json())
        .then((json) => {
          const data = json.data || [];
          setItems(data.slice(0, 50));

          const latestUpdatedAt = data
            .map((item: CategoryScore) => item.updated_at)
            .filter(Boolean)
            .sort()
            .reverse()[0];

          if (latestUpdatedAt) {
            setUpdatedAt(
              new Date(latestUpdatedAt).toLocaleString("ja-JP", {
                year: "numeric",
                month: "numeric",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            );
          }
        })
        .catch(() => {});
    }

    fetch("/api/likes", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { counts: {}, likeDate: "" }))
      .then((json) => {
        setLikeCounts(json.counts || {});
        setLikeDate(json.likeDate || "");
      })
      .catch(() => {});
  }, [initialItems.length, initialTrendTags.length]);

  useEffect(() => {
    if (typeof window === "undefined" || items.length === 0) return;

    const nextLiked: Record<string, boolean> = {};
    items.forEach((item) => {
      const offerName = getOfferName(item);
      nextLiked[offerName] =
        window.localStorage.getItem(getStorageKey(offerName, likeDate)) === "1";
    });
    setLikedOffers(nextLiked);
  }, [items, likeDate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#ranking-section") return;

    const scrollToRankingSection = () => {
      document.getElementById("ranking-section")?.scrollIntoView({
        behavior: "auto",
        block: "start",
      });
    };

    scrollToRankingSection();

    const timer1 = window.setTimeout(scrollToRankingSection, 300);
    const timer2 = window.setTimeout(scrollToRankingSection, 800);

    return () => {
      window.clearTimeout(timer1);
      window.clearTimeout(timer2);
    };
  }, [items.length]);

  const getOfferName = (item: CategoryScore) => {
    return item.offer_name || item.trend_keyword || item.category;
  };

  const getReviewPath = (offerName: string) => {
    return `/reviews/${encodeURIComponent(offerName)}`;
  };

  const getRankingId = (item: CategoryScore, index: number) => {
    return `ranking-${index + 1}-${normalizeText(getOfferName(item))}`;
  };

  const findMatchedRanking = (tagWord: string) => {
    const normalizedTagWord = normalizeText(tagWord);

    return items.find((item) => {
      const candidates = [getOfferName(item), item.trend_keyword, item.category]
        .map((value) => normalizeText(value))
        .filter(Boolean);

      return candidates.some(
        (candidate) =>
          candidate === normalizedTagWord ||
          (candidate.length >= 3 &&
            normalizedTagWord.length >= 3 &&
            (candidate.includes(normalizedTagWord) ||
              normalizedTagWord.includes(candidate)))
      );
    });
  };

  const scrollToRanking = (item: CategoryScore) => {
    const index = items.findIndex((rankingItem) => rankingItem === item);
    const targetId = getRankingId(item, index);
    document.getElementById(targetId)?.scrollIntoView({
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

  const trackMoppyClick = async (item: CategoryScore) => {
    const url = isDirectMoppyUrl(item.primary_site_url)
      ? item.primary_site_url!
      : MOPPY_URL;

    try {
      await fetch("/api/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: item.category,
          site_name: "モッピー",
        }),
      });
    } catch (e) {}

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const toggleLike = async (offerName: string) => {
    const isLiked = Boolean(likedOffers[offerName]);
    const nextLiked = !isLiked;
    const currentCount = Number(likeCounts[offerName] || 0);
    const nextCount = nextLiked ? currentCount + 1 : Math.max(0, currentCount - 1);

    setLikedOffers((current) => ({ ...current, [offerName]: nextLiked }));
    setLikeCounts((current) => ({ ...current, [offerName]: nextCount }));

    try {
      if (nextLiked) {
        window.localStorage.setItem(getStorageKey(offerName, likeDate), "1");
      } else {
        window.localStorage.removeItem(getStorageKey(offerName, likeDate));
      }
    } catch (e) {}

    try {
      const response = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offer_name: offerName,
          action: nextLiked ? "like" : "unlike",
        }),
      });
      const json = await response.json();

      if (json.likeDate) setLikeDate(json.likeDate);
      if (Number.isFinite(Number(json.count))) {
        setLikeCounts((current) => ({
          ...current,
          [offerName]: Number(json.count),
        }));
      }
    } catch (e) {}
  };

  const isRewardMissing = (reward?: number | null) => {
    return !reward || reward <= 0;
  };

  const formatReward = (reward?: number | null) => {
    if (isRewardMissing(reward)) return "データが取れませんでした";
    return `${reward!.toLocaleString("ja-JP")}P`;
  };

  const getDynamicReason = (item: CategoryScore) => {
    if (item.reason) return item.reason;
    return "検索需要と案件内容の分かりやすさをもとに評価しています。";
  };

  const visibleTrendTags = useMemo(() => {
    const seen = new Set<string>();

    return trendTags.filter((tag) => {
      const key = normalizeText(tag.word);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [trendTags]);

  const renderLikeButton = (offerName: string) => {
    const isLiked = Boolean(likedOffers[offerName]);

    return (
      <button
        type="button"
        onClick={() => toggleLike(offerName)}
        aria-pressed={isLiked}
        className={`inline-flex min-h-8 items-center gap-2 rounded-full border-2 px-3 py-1 text-xs font-black shadow-sm transition hover:scale-105 ${
          isLiked
            ? "border-transparent bg-gradient-to-r from-pink-500 to-rose-400 text-white"
            : "border-pink-200 bg-white text-pink-600 hover:bg-pink-50"
        }`}
      >
        <span>{isLiked ? "♥" : "♡"}</span>
        <span>{isLiked ? "いいね済み" : "いいね！"}</span>
        <span>{likeCounts[offerName] || 0}</span>
      </button>
    );
  };

  const renderRankingRow = (item: CategoryScore, index: number) => {
    const offerName = getOfferName(item);
    const rankStyle = getRankStyle(index);

    return (
      <article
        key={`${item.rank}-${item.offer_name}-${index}`}
        id={getRankingId(item, index)}
        className={`scroll-mt-8 grid gap-4 bg-gradient-to-r ${rankStyle.card} p-5 transition hover:scale-[1.01] xl:grid-cols-[58px_1.3fr_220px_210px] xl:items-center xl:gap-5`}
      >
        <div className="flex items-center gap-3 lg:justify-center">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${rankStyle.badge} text-lg font-black text-white shadow-lg`}
          >
            {index + 1}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-black text-slate-900">{offerName}</h3>
            <span className="inline-flex">{renderLikeButton(offerName)}</span>
          </div>

          <p className="mt-2 text-sm font-bold leading-7 text-slate-600">
            {getDynamicReason(item)}
          </p>
        </div>

        <div className="rounded-2xl bg-white/90 px-4 py-4 text-center shadow-sm ring-1 ring-pink-100">
          <div className="text-sm font-black text-slate-600 lg:text-base">
            報酬ポイントの目安
          </div>
          <div
            className={
              isRewardMissing(item.reward)
                ? "mt-1 text-xs font-black leading-5 text-pink-500 lg:text-sm"
                : "mt-1 text-xl font-black text-pink-500 lg:text-2xl"
            }
          >
            {formatReward(item.reward)}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 lg:items-end">
          <button
            type="button"
            onClick={() => trackMoppyClick(item)}
            className="flex h-12 w-full max-w-[210px] items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 px-4 text-sm font-black text-white shadow-md transition hover:scale-105"
          >
            モッピーで探す
            <span className="ml-2 text-xl leading-none">›</span>
          </button>

          <Link
            href={getReviewPath(offerName)}
            className="flex h-14 w-full max-w-[210px] items-center justify-center rounded-xl border-2 border-pink-200 bg-white px-4 text-xs font-black text-pink-600 shadow-sm transition hover:scale-105 hover:bg-pink-50"
          >
            もっと検索ワードを見る
            <span className="ml-2 text-base leading-none">›</span>
          </Link>
        </div>
      </article>
    );
  };

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
                <span className="text-pink-600">「Google検索」</span>
                のデータをもとに、いま世間で注目されているポイ活をAIが判定し、
                <span className="text-pink-600">毎日（0:00～1:00頃）</span>
                ランキングに反映しています。
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-6">
              <div className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-black text-slate-500 shadow-lg ring-1 ring-slate-100">
                最終更新：
                <span className="ml-2 text-base text-slate-600">{updatedAt}</span>
              </div>

              <Link
                href="/about-poikatsu"
                className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-black text-green-600 shadow-lg ring-2 ring-green-200 transition hover:scale-105 hover:bg-green-50 lg:text-base"
              >
                <span className="mr-2 text-xl">🔰</span>
                ポイ活とは？
              </Link>

              <Link
                href="/free-poikatsu"
                className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-black text-pink-600 shadow-lg ring-2 ring-pink-200 transition hover:scale-105 hover:bg-pink-50 lg:text-base"
              >
                <span className="mr-2 rounded-full bg-yellow-400 px-2 py-1 text-white">0</span>
                無料でできるポイ活特集
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
              🔍 いまGoogle検索されているポイ活関連ワード
            </h2>

            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
              <div className="inline-flex w-fit items-center rounded-full bg-white px-5 py-3 text-sm font-black text-slate-500 shadow-lg ring-1 ring-slate-100">
                最終更新：
                <span className="ml-2 text-slate-700">{updatedAt}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-gradient-to-br from-pink-50 via-white to-orange-50 p-5 lg:p-7">
            <div className="flex flex-wrap items-center gap-3">
              {visibleTrendTags.map((tag) => {
                const matchedRanking = findMatchedRanking(tag.word);
                const pillClass =
                  "rounded-full bg-pink-100 px-5 py-3 text-base font-black text-pink-600 underline decoration-2 underline-offset-4 transition hover:scale-105 hover:bg-pink-200 active:scale-95";

                if (matchedRanking) {
                  return (
                    <button
                      key={tag.word}
                      type="button"
                      onClick={() => scrollToRanking(matchedRanking)}
                      className={pillClass}
                      title="ランキング内の該当案件へ移動"
                    >
                      {tag.word}
                    </button>
                  );
                }

                return (
                  <Link
                    key={tag.word}
                    href={getReviewPath(tag.word)}
                    className={pillClass}
                    title="関連ワード詳細ページを見る"
                  >
                    {tag.word}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <div id="ranking-section" className="mt-12 mb-6 scroll-mt-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🔥</span>
            <h2 className="text-3xl font-black text-slate-900 lg:text-5xl">
              【
              <span className="bg-gradient-to-b from-yellow-300 to-orange-500 bg-clip-text text-transparent">
                AI
              </span>
              判定】いま注目されているポイ活ランキング
            </h2>
          </div>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
            <div className="inline-flex w-fit items-center rounded-full bg-white px-5 py-3 text-sm font-black text-slate-500 shadow-lg ring-1 ring-slate-100">
              最終更新：
              <span className="ml-2 text-slate-700">{updatedAt}</span>
            </div>
          </div>
        </div>

        <section className="mt-6 overflow-hidden rounded-[2rem] bg-white shadow-lg ring-1 ring-pink-100">
          <div className="divide-y divide-pink-100">
            {items.slice(0, 50).map((item, index) => renderRankingRow(item, index))}
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
