"use client";

import { useEffect, useMemo, useState } from "react";

const MOPPY_INVITE_URL =
  "https://pc.moppy.jp/entry/invite.php?invite=ut3GA1ce&openExternalBrowser=1";
const MOPPY_BANNER_URL = "https://img.moppy.jp/pub/pc/friend/300x250-1.jpg";
const MOPPY_INVITE_UNAVAILABLE_SITE_IDS = new Set(["157738"]);
const HIGH_REWARD_THRESHOLD = 10000;

type RankingItem = {
  category: string;
  rank: number;
  offer_name: string;
  reward?: number | null;
  image_url?: string | null;
  primary_site_url?: string | null;
  updated_at?: string | null;
};

type TabKey = "all" | "easy" | "free" | "high";

type TopPageClientProps = {
  initialItems?: RankingItem[];
  initialUpdatedAt?: string;
};

const getTodayJst = () => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
};

const getLikeStorageKey = (offerName: string, likeDate: string) =>
  `moppy-analysis-liked:${likeDate}:${offerName}`;

const getMoppyInviteUrl = (url?: string | null) => {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "pc.moppy.jp" || parsed.pathname !== "/ad/detail.php") {
      return null;
    }

    const siteId = parsed.searchParams.get("site_id") || parsed.searchParams.get("s_id");
    if (!siteId || MOPPY_INVITE_UNAVAILABLE_SITE_IDS.has(siteId)) return null;

    return `https://pc.moppy.jp/entry/invite.php?invite=ut3GA1ce&s_id=${encodeURIComponent(siteId)}`;
  } catch {
    return null;
  }
};

const getMoppyLinkUrl = (url?: string | null) => {
  const inviteUrl = getMoppyInviteUrl(url);
  if (inviteUrl) return inviteUrl;
  if (url && url.includes("pc.moppy.jp/")) return url;
  return MOPPY_INVITE_URL;
};

const formatReward = (reward?: number | null) => {
  if (!reward || reward <= 0) return "確認中";
  return `${reward.toLocaleString("ja-JP")}P`;
};

const isFreeOffer = (offerName: string) => offerName.toLowerCase().includes("無料");

const isEasyOffer = (offerName: string) => {
  const title = offerName.toLowerCase();
  return (
    title.includes("口座") ||
    title.includes("カード") ||
    title.includes("証券") ||
    title.includes("申込") ||
    title.includes("新規") ||
    title.includes("登録") ||
    isFreeOffer(offerName)
  );
};

const isHighRewardOffer = (item: RankingItem) => (item.reward || 0) >= HIGH_REWARD_THRESHOLD;

const getReasonLabels = (item: RankingItem) => {
  const labels: Array<"申し込むだけでOK" | "無料でできる" | "高額報酬"> = [];

  if (isFreeOffer(item.offer_name)) {
    labels.push("無料でできる");
  }

  if (isEasyOffer(item.offer_name)) {
    labels.push("申し込むだけでOK");
  }

  if (isHighRewardOffer(item)) {
    labels.push("高額報酬");
  }

  if (labels.length === 0) labels.push("申し込むだけでOK");
  return Array.from(new Set(labels));
};

const tabMatches = (item: RankingItem, activeTab: TabKey) => {
  if (activeTab === "all") return true;
  if (activeTab === "free") return isFreeOffer(item.offer_name);
  if (activeTab === "high") return isHighRewardOffer(item);
  return isEasyOffer(item.offer_name);
};

const sortVisibleItems = (items: RankingItem[], activeTab: TabKey) => {
  if (activeTab !== "high") return items;
  return [...items].sort((a, b) => Number(b.reward || 0) - Number(a.reward || 0));
};

const LikeButton = ({
  offerName,
  count,
  liked,
  onLike,
}: {
  offerName: string;
  count: number;
  liked: boolean;
  onLike: (offerName: string) => void;
}) => {
  return (
    <button
      type="button"
      disabled={liked}
      onClick={() => onLike(offerName)}
      aria-pressed={liked}
      className="flex min-h-[42px] w-full max-w-[190px] items-center justify-center rounded-[14px] border-2 border-[#f7c8d8] bg-white px-4 text-sm font-black text-[#d91f68] shadow-[0_8px_18px_rgba(217,31,104,0.12)] transition enabled:hover:scale-105 disabled:cursor-default disabled:opacity-60"
    >
      ♡ いいね！ {count}
    </button>
  );
};

export default function TopPageClient({
  initialItems = [],
  initialUpdatedAt = "-",
}: TopPageClientProps) {
  const [items, setItems] = useState(initialItems);
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [likeDate, setLikeDate] = useState(getTodayJst());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [likedOffers, setLikedOffers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialItems.length > 0) return;

    fetch("/api/rankings", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { data: [] }))
      .then((json) => {
        const nextItems = Array.isArray(json.data) ? json.data.slice(0, 50) : [];
        setItems(nextItems);

        const latestUpdatedAt = nextItems
          .map((item: RankingItem) => item.updated_at)
          .filter(Boolean)
          .sort()
          .reverse()[0];

        if (latestUpdatedAt) {
          setUpdatedAt(
            new Date(latestUpdatedAt).toLocaleString("ja-JP", {
              timeZone: "Asia/Tokyo",
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
  }, [initialItems.length]);

  useEffect(() => {
    fetch("/api/likes", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { counts: {}, likeDate: getTodayJst() }))
      .then((json) => {
        const nextDate = json.likeDate || getTodayJst();
        setLikeDate(nextDate);
        setLikeCounts(json.counts || {});
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const nextLiked: Record<string, boolean> = {};
    items.forEach((item) => {
      nextLiked[item.offer_name] =
        window.localStorage.getItem(getLikeStorageKey(item.offer_name, likeDate)) === "1";
    });
    setLikedOffers(nextLiked);
  }, [items, likeDate]);

  const visibleItems = useMemo(() => {
    const filteredItems = items.filter((item) => tabMatches(item, activeTab));
    return sortVisibleItems(filteredItems, activeTab).slice(0, 50);
  }, [items, activeTab]);

  const onLike = async (offerName: string) => {
    if (likedOffers[offerName]) return;

    const currentCount = Number(likeCounts[offerName] || 0);
    setLikedOffers((current) => ({ ...current, [offerName]: true }));
    setLikeCounts((current) => ({ ...current, [offerName]: currentCount + 1 }));

    try {
      window.localStorage.setItem(getLikeStorageKey(offerName, likeDate), "1");
    } catch {}

    try {
      const response = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer_name: offerName }),
      });
      const json = await response.json();

      if (json.likeDate) setLikeDate(json.likeDate);
      if (Number.isFinite(Number(json.count))) {
        setLikeCounts((current) => ({ ...current, [offerName]: Number(json.count) }));
      }
    } catch {}
  };

  const trackMoppyClick = async (item: RankingItem) => {
    try {
      await fetch("/api/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: item.offer_name, site_name: "モッピー" }),
        keepalive: true,
      });
    } catch {}
  };

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: "all", label: "総合ランキング" },
    { key: "easy", label: "申し込むだけでOK" },
    { key: "free", label: "無料でできる" },
    { key: "high", label: "高額報酬" },
  ];

  return (
    <main className="moppy-analysis-top min-h-screen bg-[linear-gradient(180deg,#edfffc_0,#fffaf0_430px,#fff_820px)] text-[#111827]">
      <header className="border-b border-[#d8f4f0] bg-white/95 shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
        <div className="mx-auto flex min-h-[72px] w-[min(1120px,calc(100%-32px))] items-center">
          <div className="text-[22px] font-bold tracking-normal text-[#111827] lg:text-[26px]">
            <span className="text-[#28bdb3]">モッピー</span>案件分析
          </div>
        </div>
      </header>

      <section className="border-b border-[#c8f2ee]">
        <div className="mx-auto grid w-[min(1120px,calc(100%-32px))] grid-cols-1 items-center gap-8 py-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(280px,0.92fr)] lg:gap-8 lg:py-10">
          <div>
            <div className="inline-flex min-h-[38px] items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-bold text-[#173256] shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
              最終更新：{updatedAt}
            </div>

            <h1 className="mt-5 max-w-[760px] text-[clamp(30px,5.1vw,56px)] font-bold leading-[1.34] tracking-normal text-[#111827]">
              ポイ活サイト
              <span className="text-[#28bdb3]">「モッピー」</span>
              のたくさんの案件の中から
              <span className="text-[#f59a1b]">「お得」</span>
              な案件がわかる
            </h1>

            <p className="mt-4 max-w-[760px] text-[17px] font-bold leading-[1.78] text-[#1f2937] lg:text-[22px] lg:leading-[1.85]">
              AIが分析して、毎日更新しています（0:00～1:00頃）
            </p>
          </div>

          <div className="justify-self-center overflow-hidden rounded-[22px] border border-[#bdeee9] bg-[linear-gradient(135deg,#f2fffd,#fff_52%,#fff8ed)] p-3.5 shadow-[0_22px_50px_rgba(40,189,179,0.14)]">
            <img
              src={MOPPY_BANNER_URL}
              alt="モッピー公式バナー"
              className="block w-[min(100%,300px)] rounded-[14px] shadow-[0_18px_34px_rgba(15,23,42,0.12)]"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto w-[min(1120px,calc(100%-32px))] py-6 lg:py-8">
        <div className="grid overflow-hidden rounded-[20px] border border-[#bdeee9] bg-white shadow-[0_12px_28px_rgba(40,189,179,0.08)] sm:grid-cols-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
                className={`min-h-[58px] border-b-4 px-3 py-3 text-sm font-bold transition lg:text-base ${
                activeTab === tab.key
                  ? "border-[#28bdb3] text-[#111827]"
                  : "border-transparent text-[#334155] hover:bg-[#f6fffd]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="text-[clamp(28px,4.2vw,44px)] font-bold leading-tight">
            <span className="text-[#f59a1b]">お得</span>なモッピー案件ランキング
          </h2>
          <div className="w-fit rounded-full bg-white px-5 py-3 text-sm font-bold text-[#173256] shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
            最終更新：{updatedAt}
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          {visibleItems.map((item, index) => {
            const labels = getReasonLabels(item);
            const shouldShowOfferImage = Boolean(item.image_url);

            return (
              <article
                key={`${item.rank}-${item.offer_name}-${index}`}
                className="moppy-ranking-card grid min-h-[142px] items-center gap-4 rounded-[24px] border border-[#c8f2ee] bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.06)] lg:grid-cols-[58px_150px_minmax(0,1fr)_160px_190px] lg:gap-[18px] lg:p-[18px]"
              >
                <div className="grid h-[50px] w-[50px] place-items-center rounded-[16px] bg-[linear-gradient(135deg,#e8fbf8,#fff8ed)] text-[26px] font-bold text-[#07968f]">
                  {index + 1}
                </div>

                {shouldShowOfferImage ? (
                  <div className="moppy-offer-banner-wrap w-[min(100%,260px)] justify-self-center overflow-hidden rounded-[14px] border border-[#dbe3ed] bg-white lg:w-[150px]">
                    <img
                      src={item.image_url || ""}
                      alt={`${item.offer_name}のモッピーバナー`}
                      loading="lazy"
                      className="moppy-offer-banner aspect-[1.35/1] w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="hidden lg:block" aria-hidden="true" />
                )}

                <div>
                  <h3 className="[overflow-wrap:anywhere] text-[21px] font-bold leading-snug lg:text-[23px]">
                    {item.offer_name}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {labels.map((label) => (
                      <span
                        key={label}
                        className={`inline-flex min-h-[30px] items-center rounded-full px-3 py-1.5 text-[13px] font-bold ${
                          label === "無料でできる"
                            ? "bg-[#ecfdf5] text-[#047857]"
                            : label === "高額報酬"
                              ? "bg-[#eff6ff] text-[#1d4ed8]"
                              : "bg-[#fff7ed] text-[#b45309]"
                        }`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-left lg:text-center">
                  <small className="block text-xs font-bold text-[#64748b]">獲得ポイント</small>
                  <strong className="mt-1 block text-[30px] font-bold leading-none text-[#07968f]">
                    {formatReward(item.reward)}
                  </strong>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <a
                    href={getMoppyLinkUrl(item.primary_site_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackMoppyClick(item)}
                    className="flex min-h-[52px] w-full max-w-[210px] items-center justify-center rounded-[14px] bg-[linear-gradient(90deg,#28bdb3,#07968f)] px-4 text-base font-bold text-white shadow-[0_14px_26px_rgba(40,189,179,0.22)] transition hover:scale-105"
                  >
                    モッピーで探す ›
                  </a>
                  <LikeButton
                    offerName={item.offer_name}
                    count={likeCounts[item.offer_name] || 0}
                    liked={Boolean(likedOffers[item.offer_name])}
                    onLike={onLike}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
