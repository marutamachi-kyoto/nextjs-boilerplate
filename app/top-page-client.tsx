"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const MOPPY_URL =
  "https://pc.moppy.jp/entry/invite.php?invite=ut3GA1ce&openExternalBrowser=1";

type CategoryScore = {
  category: string;
  rank: number;
  trend_keyword: string;
  offer_name?: string;
  reward?: number | null;
  reason: string;
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

type TrendBadge = {
  icon: string;
  text: string;
  className: string;
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

const normalizeSpaces = (value: string) => value.replace(/\s+/g, " ").trim();

const OFFER_KEYWORD_RULES: Array<[RegExp, string]> = [
  [/出光カード/i, "出光カード"],
  [/apollostation|アポロステーション/i, "出光カード"],
  [/SBI\s*FX|SBI.*FX/i, "SBI FXトレード"],
  [/SBI.*証券/i, "SBI証券"],
  [/楽天証券/, "楽天証券"],
  [/楽天銀行/, "楽天銀行"],
  [/楽天モバイル/, "楽天モバイル"],
  [/au\s*ひかり|auひかり/i, "auひかり"],
  [/ahamo/i, "ahamo"],
  [/povo/i, "povo"],
  [/U-?NEXT/i, "U-NEXT"],
  [/coin\s*together/i, "coin together"],
  [/JP\s*リターンズ|JPリターンズ/i, "JPリターンズ"],
  [/プロパティエージェント/, "プロパティエージェント"],
  [/CREAL/i, "CREAL"],
  [/チクフル/, "チクフル不動産投資"],
  [/CAMEL/i, "CAMEL"],
  [/セカンドオピニオン|不動産会社で相談中/i, "不動産投資 セカンドオピニオン"],
  [/モバレコ\s*Air|モバレコAir/i, "モバレコAir"],
  [/ソフトバンク\s*Air|SoftBank\s*Air/i, "ソフトバンクAir"],
  [/ドコモ\s*mini|ドコモミニ/i, "ドコモmini"],
  [/グローバル\s*WiFi|グローバルWiFi/i, "グローバルWiFi"],
  [/コミュファ光/i, "コミュファ光"],
  [/ビッグローブ光|BIGLOBE光/i, "ビッグローブ光"],
  [/GMOとくとくBB.*ドコモ光|ドコモ光.*GMOとくとくBB/i, "GMOとくとくBB ドコモ光"],
  [/おてがる光クロス/i, "おてがる光クロス"],
  [/ドコモ光/i, "ドコモ光"],
  [/WiFi革命セット/i, "WiFi革命セット"],
  [/WiMAX.*5G/i, "WiMAX +5G"],
  [/FXブロードネット/i, "FXブロードネット"],
  [/三菱UFJ.*スマート証券.*FX/i, "三菱UFJ eスマート証券 FX"],
  [/みんなのFX/i, "みんなのFX"],
  [/LIGHT\s*FX/i, "LIGHT FX"],
  [/外為どっとコム/i, "外為どっとコム"],
  [/イオンカードセレクト/i, "イオンカードセレクト"],
  [/サクページ/i, "サクページ"],
  [/愛車.*高価買取|車.*買取/i, "車買取"],
  [/アメリカン.*エキスプレス.*ゴールド.*プリファード/i, "アメリカン・エキスプレス・ゴールド・プリファード・カード"],
];

const toSearchLikeOfferKeyword = (value?: string) => {
  const original = normalizeSpaces(value || "");
  if (!original) return "";

  const matchedRule = OFFER_KEYWORD_RULES.find(([pattern]) => pattern.test(original));
  if (matchedRule) return matchedRule[1];

  return "";
};

const isLooseMatch = (left?: string, right?: string) => {
  const leftKey = normalizeText(left);
  const rightKey = normalizeText(right);

  if (!leftKey || !rightKey) return false;
  if (leftKey === rightKey) return true;

  return (
    leftKey.length >= 3 &&
    rightKey.length >= 3 &&
    (leftKey.includes(rightKey) || rightKey.includes(leftKey))
  );
};

const isDirectMoppyUrl = (url?: string) => {
  return Boolean(
    url &&
      url.includes("pc.moppy.jp/") &&
      !url.includes("/entry/invite.php")
  );
};

const getStorageKey = (offerName: string, likeDate?: string) => {
  return `poikatu-liked:${likeDate || "today"}:${offerName}`;
};

export default function Page() {
  const [items, setItems] = useState<CategoryScore[]>([]);
  const [updatedAt, setUpdatedAt] = useState("-");
  const [trendTags, setTrendTags] = useState<TrendTag[]>([]);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [likeDate, setLikeDate] = useState("");
  const [likedOffers, setLikedOffers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/trends", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => setTrendTags(json.data || []));

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
      });

    fetch("/api/likes", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { counts: {}, likeDate: "" }))
      .then((json) => {
        setLikeCounts(json.counts || {});
        setLikeDate(json.likeDate || "");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (items.length === 0) return;

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

  const getMatchCandidates = (item: CategoryScore) => {
    const offerName = getOfferName(item);
    return [
      offerName,
      item.trend_keyword,
      item.category,
      toSearchLikeOfferKeyword(offerName),
      toSearchLikeOfferKeyword(item.trend_keyword),
      toSearchLikeOfferKeyword(item.category),
    ].filter(Boolean);
  };

  const findMatchedRanking = (tagWord: string) => {
    return items.find((item) => {
      return getMatchCandidates(item).some((value) =>
        isLooseMatch(value, tagWord)
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
    if (item.reason) return item.reason;
    return "検索需要と案件内容の分かりやすさをもとに評価しています。";
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
        className={`flex min-h-11 w-full max-w-[260px] items-center justify-center gap-2 rounded-full border-2 px-4 text-sm font-black shadow-md transition hover:scale-105 ${
          isLiked
            ? "border-transparent bg-gradient-to-r from-pink-500 to-rose-400 text-white"
            : "border-pink-300 bg-white text-pink-600 hover:bg-pink-50"
        }`}
      >
        <span>{isLiked ? "♥" : "♡"}</span>
        <span>{isLiked ? "いいね済み" : "いいね！"}</span>
        <span className="rounded-full bg-white px-2 py-1 text-pink-600">
          {likeCounts[offerName] || 0}
        </span>
      </button>
    );
  };

  const renderRankingActions = (item: CategoryScore, offerName: string, top = false) => {
    return (
      <div className="flex flex-col items-center gap-3 lg:items-end">
        {renderLikeButton(offerName)}

        <button
          type="button"
          onClick={() => trackMoppyClick(item)}
          className={`flex w-full items-center justify-center bg-gradient-to-r from-pink-500 to-orange-500 px-4 text-center font-black text-white shadow-xl transition hover:scale-105 ${
            top
              ? "h-16 max-w-[260px] rounded-2xl text-xl"
              : "h-12 max-w-[210px] rounded-xl text-sm"
          }`}
        >
          モッピーで探す
          <span className="ml-2 text-xl leading-none">›</span>
        </button>

        <Link
          href={getReviewPath(offerName)}
          className={`flex w-full items-center justify-center border-2 border-pink-200 bg-white text-center font-black text-pink-600 shadow-sm transition hover:scale-105 hover:bg-pink-50 ${
            top
              ? "h-14 max-w-[260px] rounded-2xl px-5 text-base"
              : "h-11 max-w-[210px] rounded-xl px-4 text-xs"
          }`}
        >
          もっと検索ワードを見る
          <span className="ml-2 text-base leading-none">›</span>
        </Link>
      </div>
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
                const textSizeClass =
                  tag.score >= 90
                    ? "text-3xl"
                    : tag.score >= 70
                      ? "text-2xl"
                      : tag.score >= 50
                        ? "text-xl"
                        : "text-base";
                const pillClass = `rounded-full bg-pink-100 px-5 py-3 font-black text-pink-600 underline decoration-2 underline-offset-4 transition hover:scale-105 hover:bg-pink-200 active:scale-95 ${textSizeClass}`;

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
                      <div className="text-4xl leading-none">{rankStyle.crown}</div>
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
                    <div
                      className={
                        isRewardMissing(item.reward)
                          ? "mt-2 text-sm font-black leading-5 text-pink-500 lg:text-base"
                          : "mt-2 text-2xl font-black tracking-tight text-pink-500 lg:text-4xl"
                      }
                    >
                      {formatReward(item.reward)}
                    </div>
                  </div>

                  {renderRankingActions(item, offerName, true)}
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
                    <h3 className="text-2xl font-black text-slate-900">{offerName}</h3>
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

                  {renderRankingActions(item, offerName)}
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
