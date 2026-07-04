"use client";

import { useEffect, useMemo, useState } from "react";

const MOPPY_INVITE_URL =
  "https://pc.moppy.jp/entry/invite.php?invite=ut3GA1ce&openExternalBrowser=1";
const MOPPY_BANNER_URL = "https://img.moppy.jp/pub/pc/friend/300x250-1.jpg";
const MOPPY_INVITE_UNAVAILABLE_SITE_IDS = new Set(["157738"]);
const HIGH_REWARD_THRESHOLD = 10000;
const SHARE_URL = "https://poikatu-ai.vercel.app/";
const SHARE_TEXT = "モッピー案件分析｜お得なモッピー案件をAIが毎日更新";

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
  const labels = [
    isEasyOffer(item.offer_name) ? "申し込むだけでOK" : null,
    isFreeOffer(item.offer_name) ? "無料でできる" : null,
    isHighRewardOffer(item) ? "高額報酬" : null,
  ].filter(Boolean) as Array<"申し込むだけでOK" | "無料でできる" | "高額報酬">;

  if (labels.length === 0) labels.push("申し込むだけでOK");
  return labels;
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
      className="flex min-h-[42px] w-full max-w-none items-center justify-center overflow-hidden whitespace-nowrap rounded-[14px] border-2 border-[#f7c8d8] bg-white px-3 text-xs font-black text-[#d91f68] shadow-[0_8px_18px_rgba(217,31,104,0.12)] transition enabled:hover:scale-105 disabled:cursor-default disabled:opacity-60 lg:max-w-[190px] lg:px-4 lg:text-sm"
    >
      ♡ いいね！ {count}
    </button>
  );
};

const ShareButtons = () => {
  const [copied, setCopied] = useState(false);
  const encodedText = encodeURIComponent(SHARE_TEXT);
  const encodedUrl = encodeURIComponent(SHARE_URL);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const shareNative = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: SHARE_TEXT, text: SHARE_TEXT, url: SHARE_URL });
        return;
      }
    } catch {}

    await copyUrl();
  };

  return (
    <div className="mt-3 inline-flex flex-col gap-2.5 lg:mt-4" aria-label="共有ボタン">
      <p className="text-[13px] font-bold text-[#173256] lg:text-sm">このページをシェアする</p>
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={shareNative}
          className="inline-flex min-h-[40px] min-w-[70px] items-center justify-center rounded-full bg-[#0ea69b] px-5 text-sm font-bold text-white shadow-[0_10px_20px_rgba(7,22,43,0.08)] transition hover:scale-105 lg:min-h-[42px] lg:min-w-[74px]"
        >
          共有
        </button>
        <button
          type="button"
          onClick={copyUrl}
          aria-label="URLをコピー"
          title={copied ? "コピーしました" : "URLをコピー"}
          className="inline-flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#1f2329] text-white shadow-[0_10px_20px_rgba(7,22,43,0.08)] transition hover:scale-105 lg:h-[42px] lg:w-[42px]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M9.5 14.5h-1a4.5 4.5 0 0 1 0-9h3a4.5 4.5 0 0 1 4.23 3"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2.2"
            />
            <path
              d="M14.5 9.5h1a4.5 4.5 0 0 1 0 9h-3a4.5 4.5 0 0 1-4.23-3"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2.2"
            />
            <path
              d="M9 12h6"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2.2"
            />
          </svg>
        </button>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Xで共有"
          className="inline-flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#111827] text-white shadow-[0_10px_20px_rgba(7,22,43,0.08)] transition hover:scale-105 lg:h-[42px] lg:w-[42px]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ color: "#ffffff" }}>
            <path
              fill="currentColor"
              d="M13.64 10.62 20.76 2h-1.69l-6.18 7.49L7.95 2H2.25l7.47 11.32L2.25 22h1.69l6.53-7.59L15.68 22h5.69l-7.73-11.38Zm-2.31 2.68-.76-1.13L4.55 3.33h2.59l4.86 7.14.76 1.13 6.31 9.28h-2.59l-5.15-7.58Z"
            />
          </svg>
        </a>
        <a
          href={`https://social-plugins.line.me/lineit/share?url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LINEで共有"
          className="inline-flex h-[40px] w-[48px] items-center justify-center rounded-full bg-[#06c755] text-white shadow-[0_10px_20px_rgba(7,22,43,0.08)] transition hover:scale-105 lg:h-[42px] lg:w-[50px]"
        >
          <span className="text-[12px] font-black leading-none tracking-[-0.02em]" style={{ color: "#ffffff" }}>
            LINE
          </span>
        </a>
      </div>
    </div>
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
    <main className="moppy-analysis-top min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#edfffc_0,#fffaf0_430px,#fff_820px)] text-[#111827]">
      <header className="border-b border-[#d8f4f0] bg-white/95 shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
        <div className="mx-auto flex min-h-[58px] w-[min(1120px,calc(100%-32px))] items-center lg:min-h-[72px]">
          <div className="text-[21px] font-bold tracking-normal text-[#111827] lg:text-[26px]">
            <span className="text-[#28bdb3]">モッピー</span>案件分析
          </div>
        </div>
      </header>

      <section className="border-b border-[#c8f2ee]">
        <div className="mx-auto grid w-[min(1120px,calc(100%-32px))] grid-cols-1 items-center gap-4 py-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(260px,0.75fr)] lg:gap-8 lg:py-8">
          <div>
            <div className="inline-flex min-h-[34px] items-center justify-center rounded-full bg-white px-4 py-2 text-[13px] font-bold text-[#173256] shadow-[0_10px_24px_rgba(15,23,42,0.08)] lg:min-h-[36px] lg:px-5 lg:text-sm">
              最終更新：{updatedAt}
            </div>

            <h1 className="mt-4 max-w-[760px] text-[clamp(28px,8.3vw,36px)] font-bold leading-[1.25] tracking-normal text-[#111827] lg:mt-5 lg:text-[clamp(30px,4.7vw,52px)] lg:leading-[1.28]">
              <span className="block">
                ポイ活サイト
                <span className="text-[#28bdb3]">「モッピー」</span>の
              </span>
              <span className="block">たくさんの案件の中から</span>
              <span className="block">
                <span className="text-[#f59a1b]">「お得」</span>
                な案件がわかる
              </span>
            </h1>

            <p className="mt-3 max-w-[760px] text-[16px] font-bold leading-[1.65] text-[#1f2937] lg:mt-4 lg:text-[21px] lg:leading-[1.75]">
              <span className="text-[#f59a1b]">報酬の高さ</span>
              や
              <span className="text-[#f59a1b]">手軽さ</span>
              をもとに、AIが毎日更新（0:00～1:00頃）
            </p>
            <ShareButtons />
          </div>

          <div className="w-[min(100%,326px)] justify-self-center overflow-hidden rounded-[22px] border border-[#bdeee9] bg-[linear-gradient(135deg,#f2fffd,#fff_52%,#fff8ed)] p-3 shadow-[0_22px_50px_rgba(40,189,179,0.14)] lg:w-auto lg:justify-self-end lg:p-3.5">
            <img
              src={MOPPY_BANNER_URL}
              alt="モッピー公式バナー"
              className="block w-full rounded-[14px] shadow-[0_18px_34px_rgba(15,23,42,0.12)] lg:w-[min(100%,300px)]"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto w-[min(1120px,calc(100%-32px))] py-5 lg:py-8">
        <div className="sticky top-0 z-10 -mx-4 overflow-x-auto bg-[linear-gradient(180deg,rgba(255,250,240,0.96),rgba(255,250,240,0.74))] px-4 pb-3 [scrollbar-width:none] lg:static lg:mx-0 lg:overflow-visible lg:bg-transparent lg:px-0 lg:pb-0">
          <div className="flex w-max min-w-full gap-1 rounded-full border border-[#bdeee9] bg-white p-1 shadow-[0_12px_28px_rgba(40,189,179,0.08)] lg:grid lg:grid-cols-4 lg:gap-0 lg:overflow-hidden lg:rounded-[20px] lg:p-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`min-h-[42px] min-w-max rounded-full px-5 py-2 text-sm font-bold transition lg:min-h-[58px] lg:rounded-none lg:border-b-4 lg:px-3 lg:py-3 lg:text-base ${
                  activeTab === tab.key
                    ? "bg-[#e7fbf8] text-[#075e59] lg:border-[#28bdb3] lg:bg-transparent lg:text-[#111827]"
                    : "text-[#334155] hover:bg-[#f6fffd] lg:border-transparent"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:mt-8 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="text-[clamp(28px,4.2vw,44px)] font-bold leading-tight">
            <span className="text-[#f59a1b]">お得</span>なモッピー案件ランキング
          </h2>
          <div className="w-fit rounded-full bg-white px-4 py-2.5 text-[13px] font-bold text-[#173256] shadow-[0_10px_24px_rgba(15,23,42,0.08)] lg:px-5 lg:py-3 lg:text-sm">
            最終更新：{updatedAt}
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:mt-5 lg:gap-4">
          {visibleItems.map((item, index) => {
            const labels = getReasonLabels(item);
            const shouldShowOfferImage = Boolean(item.image_url);

            return (
              <article
                key={`${item.rank}-${item.offer_name}-${index}`}
                className="moppy-ranking-card grid min-h-[142px] grid-cols-[40px_90px_minmax(0,1fr)] items-start gap-3 overflow-hidden rounded-[20px] border border-[#c8f2ee] bg-white p-3 shadow-[0_12px_28px_rgba(15,23,42,0.06)] lg:grid-cols-[58px_150px_minmax(0,1fr)_160px_190px] lg:items-center lg:gap-[18px] lg:rounded-[24px] lg:p-[18px]"
              >
                <div className="grid h-[40px] w-[40px] place-items-center rounded-[13px] bg-[linear-gradient(135deg,#e8fbf8,#fff8ed)] text-[22px] font-bold text-[#07968f] lg:h-[50px] lg:w-[50px] lg:rounded-[16px] lg:text-[26px]">
                  {index + 1}
                </div>

                {shouldShowOfferImage ? (
                  <div className="moppy-offer-banner-wrap w-[90px] justify-self-center overflow-hidden rounded-[14px] border border-[#dbe3ed] bg-white lg:w-[150px]">
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

                <div className="min-w-0">
                  <h3 className="break-all text-[15.5px] font-bold leading-[1.35] lg:[overflow-wrap:anywhere] lg:text-[23px] lg:leading-snug">
                    {item.offer_name}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-1.5 lg:mt-3 lg:gap-2">
                    {labels.map((label) => (
                      <span
                        key={label}
                        className={`inline-flex min-h-[25px] items-center rounded-full px-2.5 py-1 text-[12px] font-bold lg:min-h-[30px] lg:px-3 lg:py-1.5 lg:text-[13px] ${
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

                <div className="col-start-2 col-end-4 flex items-baseline gap-2 text-left lg:col-auto lg:block lg:text-center">
                  <small className="block text-xs font-bold text-[#64748b]">獲得ポイント</small>
                  <strong className="mt-1 block text-[29px] font-bold leading-none text-[#07968f] lg:text-[30px]">
                    {formatReward(item.reward)}
                  </strong>
                </div>

                <div className="col-span-3 grid w-full grid-cols-2 items-center gap-2 lg:col-auto lg:flex lg:flex-col lg:gap-3">
                  <a
                    href={getMoppyLinkUrl(item.primary_site_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackMoppyClick(item)}
                    className="flex min-h-[44px] w-full max-w-none items-center justify-center overflow-hidden whitespace-nowrap rounded-[14px] bg-[linear-gradient(90deg,#28bdb3,#07968f)] px-3 text-sm font-bold text-white shadow-[0_14px_26px_rgba(40,189,179,0.22)] transition hover:scale-105 lg:min-h-[52px] lg:max-w-[210px] lg:px-4 lg:text-base"
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
