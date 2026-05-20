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

  const scanReviewLinks = () => {
    applyRankingStyle();
    document
      .querySelectorAll('a[href*="/reviews/"]')
      .forEach(splitReviewLink);
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
