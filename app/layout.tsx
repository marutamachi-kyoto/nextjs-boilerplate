import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://poikatu-ai.vercel.app"),

  title: {
    default:
      "ポイ活AI判定｜GoogleトレンドからAIが毎日おすすめ案件をランキング",
    template: "%s｜ポイ活AI判定",
  },

  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },

  description:
    "Googleトレンド・検索動向・話題性をもとに、AIが初心者向けのおすすめポイ活案件を毎日ランキング化。モッピー、ハピタス、ポイントインカムなどの案件探しに役立ちます。",

  keywords: [
    "ポイ活",
    "ポイ活 おすすめ",
    "ポイ活 ランキング",
    "ポイントサイト",
    "モッピー",
    "ハピタス",
    "ポイントインカム",
    "Googleトレンド",
    "AI判定",
    "副業",
    "お小遣い稼ぎ",
  ],

  openGraph: {
    title:
      "ポイ活AI判定｜GoogleトレンドからAIが毎日おすすめ案件をランキング",
    description:
      "Googleトレンド・検索動向・話題性をもとに、AIが初心者向けのおすすめポイ活案件を毎日ランキング化。",
    url: "https://poikatu-ai.vercel.app",
    siteName: "ポイ活AI判定",
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: "/hero.png.png",
        width: 1200,
        height: 630,
        alt: "ポイ活AI判定",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title:
      "ポイ活AI判定｜GoogleトレンドからAIが毎日おすすめ案件をランキング",
    description:
      "Googleトレンド・検索動向・話題性をもとに、AIが初心者向けのおすすめポイ活案件を毎日ランキング化。",
    images: ["/hero.png.png"],
  },

  alternates: {
    canonical: "https://poikatu-ai.vercel.app",
  },

  robots: {
    index: true,
    follow: true,
  },
};

const rankingDisplayScript = `
(() => {
  const phrase = "のポイ活口コミを見る";
  const suggestCache = new Map();
  let reviewBackLinkUpdated = false;
  let lastScrolledHash = "";
  const hiddenCopyTexts = [
    "いま注目されているポイ活関連ワードをAIが整理しています。",
    "「Googleでの話題度」や「モッピーで確認した案件情報」などをもとに、AIが毎日おすすめ順を見直しています。",
  ];

  const normalizeKeyword = (value) => {
    return (value || "")
      .toLowerCase()
      .replace(/　/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const normalizeRankingIdText = (value) => {
    return (value || "")
      .toLowerCase()
      .replace(/　/g, "")
      .replace(/\s+/g, "")
      .replace(/（/g, "(")
      .replace(/）/g, ")")
      .replace(/[・･]/g, "")
      .replace(/[ーｰ−]/g, "-")
      .trim();
  };

  const escapeHtml = (value) => {
    return (value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  const escapeRegExp = (value) => {
    return (value || "").replace(/[.*+?^\${}()|[\]\\]/g, "\\$&");
  };

  const getOfferName = (item) => {
    return item?.offer_name || item?.trend_keyword || item?.category || "";
  };

  const getRankingIdFromItem = (item, index) => {
    return "ranking-" + (index + 1) + "-" + normalizeRankingIdText(getOfferName(item));
  };

  const extractSuggestionHint = (suggestion, offerName) => {
    const cleaned = (suggestion || "")
      .replace(new RegExp(escapeRegExp(offerName), "gi"), "")
      .replace(/ポイ活|口コミ|評判|おすすめ|キャンペーン/g, "")
      .replace(/\s+/g, " ")
      .trim();

    return cleaned || suggestion;
  };

  const getCategorySuffix = (category) => {
    if ((category || "").includes("カード")) {
      return "年会費、入会特典、ポイント還元の条件を見比べたい案件です。";
    }

    if ((category || "").includes("証券") || (category || "").includes("金融")) {
      return "口座開設条件や取引条件を申し込み前に確認したい案件です。";
    }

    if ((category || "").includes("通信")) {
      return "料金、乗り換え条件、キャンペーン内容をあわせて確認したい案件です。";
    }

    if ((category || "").includes("アプリ") || (category || "").includes("エンタメ")) {
      return "無料期間、利用条件、解約まわりを先に確認したい案件です。";
    }

    if ((category || "").includes("旅行")) {
      return "予約時期や対象プランによって条件が変わりやすい案件です。";
    }

    return "報酬だけでなく、申し込み条件とポイント付与条件を確認したい案件です。";
  };

  const buildTrendReason = (offerName, category, suggestions) => {
    const hints = suggestions
      .map((suggestion) => extractSuggestionHint(suggestion, offerName))
      .filter(Boolean)
      .filter((hint, index, self) => self.indexOf(hint) === index)
      .slice(0, 2);

    if (hints.length === 0) return "";

    const quotedHints = hints
      .map((hint) => '<span class="trend-reason-keyword">「' + escapeHtml(hint) + '」</span>')
      .join("や");

    return escapeHtml(offerName) + "は、Googleの検索動向で" + quotedHints + "も一緒に調べられています。" + getCategorySuffix(category);
  };

  const fetchSuggestions = async (offerName) => {
    const key = normalizeKeyword(offerName);
    if (!key) return [];
    if (suggestCache.has(key)) return suggestCache.get(key);

    const promise = fetch("/api/search-suggest?q=" + encodeURIComponent(offerName), {
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((json) => Array.isArray(json.suggestions) ? json.suggestions : [])
      .catch(() => []);

    suggestCache.set(key, promise);
    return promise;
  };

  const removeRequestedCopy = () => {
    document.querySelectorAll("main p").forEach((paragraph) => {
      const text = (paragraph.textContent || "").replace(/\s+/g, "").trim();
      const shouldHide = hiddenCopyTexts.some((copyText) => {
        return text === copyText.replace(/\s+/g, "");
      });

      if (shouldHide) {
        paragraph.style.display = "none";
      }
    });
  };

  const applyRankingStyle = () => {
    if (document.getElementById("ranking-readable-style")) return;

    const style = document.createElement("style");
    style.id = "ranking-readable-style";
    style.textContent = \`
      main > section.mt-6 article h3 {
        font-size: 2rem !important;
        line-height: 1.2 !important;
      }

      main > section.mt-6 article p {
        font-size: 1rem !important;
        line-height: 1.9 !important;
      }

      main > section.mt-6 article .inline-flex {
        font-size: 0.9rem !important;
      }

      main article a[href*="/reviews/"] {
        min-height: 3.9rem !important;
        max-width: 230px !important;
        overflow: hidden !important;
        padding-left: 0.75rem !important;
        padding-right: 0.75rem !important;
        font-size: 0.92rem !important;
        line-height: 1.35 !important;
        white-space: normal !important;
      }

      main article a[href*="/reviews/"] .review-label-text {
        min-width: 0 !important;
        max-width: 100% !important;
        overflow-wrap: anywhere !important;
        word-break: normal !important;
        white-space: normal !important;
      }

      main article a[href*="/reviews/"] .review-label-text span {
        display: block !important;
      }

      main article a[href*="/reviews/"] .review-label-arrow {
        flex: 0 0 auto !important;
      }

      .trend-reason-keyword {
        color: #ec4899 !important;
        font-weight: 900 !important;
        background: #fff1f7 !important;
        border-radius: 999px !important;
        padding: 0.05rem 0.35rem !important;
        box-decoration-break: clone !important;
        -webkit-box-decoration-break: clone !important;
      }
    \`;
    document.head.appendChild(style);
  };

  const splitReviewLink = (link) => {
    if (link.dataset.reviewLabelSplit === "true") return;

    const compactText = (link.textContent || "")
      .replace(/\s+/g, "")
      .replace(/›$/g, "");

    if (!compactText.endsWith(phrase)) return;

    const offerName = compactText.slice(0, -phrase.length);
    if (!offerName) return;

    link.dataset.reviewLabelSplit = "true";
    link.style.minHeight = "3.9rem";
    link.style.overflow = "hidden";
    link.style.whiteSpace = "normal";

    link.innerHTML = '<span class="review-label-text leading-5"><span></span><span>ポイ活口コミを見る</span></span><span class="review-label-arrow ml-2 text-base leading-none">›</span>';
    const firstLine = link.querySelector(".review-label-text span");
    if (firstLine) firstLine.textContent = offerName + "の";
  };

  const updateReviewBackLink = async () => {
    if (reviewBackLinkUpdated) return;
    if (!location.pathname.startsWith("/reviews/")) return;

    reviewBackLinkUpdated = true;
    const backLink = document.querySelector('main a[href="/#ranking-section"]');
    if (!backLink) return;

    const slug = decodeURIComponent(location.pathname.split("/reviews/")[1] || "");
    if (!slug) return;

    try {
      const response = await fetch("/api/score", { cache: "no-store" });
      const json = await response.json();
      const items = Array.isArray(json.data) ? json.data.slice(0, 50) : [];
      const normalizedSlug = normalizeRankingIdText(slug);
      const index = items.findIndex((item) => {
        return [getOfferName(item), item?.trend_keyword, item?.category]
          .filter(Boolean)
          .some((value) => normalizeRankingIdText(value) === normalizedSlug);
      });

      if (index >= 0) {
        backLink.setAttribute("href", "/#" + getRankingIdFromItem(items[index], index));
      }
    } catch (error) {}
  };

  const scrollToHashTarget = () => {
    if (location.pathname !== "/") return;
    const hash = decodeURIComponent((location.hash || "").slice(1));
    if (!hash.startsWith("ranking-")) return;
    if (lastScrolledHash === hash) return;

    const target = document.getElementById(hash);
    if (!target) return;

    lastScrolledHash = hash;
    target.scrollIntoView({
      behavior: "auto",
      block: "center",
    });
  };

  const enhanceRankingReason = async (article, index) => {
    if (article.dataset.trendReasonEnhanced === "true") return;

    const heading = article.querySelector("h3");
    const reason = heading?.nextElementSibling;
    if (!heading || !reason || reason.tagName !== "P") return;
    if (index >= 30) return;

    const offerName = (heading.textContent || "").trim();
    if (!offerName) return;

    article.dataset.trendReasonEnhanced = "true";

    const category = (article.querySelector(".inline-flex")?.textContent || "").trim();
    const suggestions = await fetchSuggestions(offerName);
    const trendReason = buildTrendReason(offerName, category, suggestions);

    if (trendReason) {
      reason.innerHTML = trendReason;
    }
  };

  const enhanceRankingReasons = () => {
    document
      .querySelectorAll("main article")
      .forEach((article, index) => {
        enhanceRankingReason(article, index);
      });
  };

  const scanReviewLinks = () => {
    applyRankingStyle();
    removeRequestedCopy();
    updateReviewBackLink();
    document
      .querySelectorAll('a[href*="/reviews/"]')
      .forEach(splitReviewLink);
    enhanceRankingReasons();
    scrollToHashTarget();
  };

  scanReviewLinks();
  new MutationObserver(scanReviewLinks).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <Script
          id="ranking-display-adjustments"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: rankingDisplayScript }}
        />
        {children}
      </body>
    </html>
  );
}
