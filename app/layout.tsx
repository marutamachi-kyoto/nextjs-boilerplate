import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title:
    "ポイ活おすすめランキング｜AIが高還元案件を毎日分析【2026年最新版】",

  description:
    "ポイ活おすすめランキングをAIが毎日自動分析。クレジットカード・証券・回線など高還元ジャンルを比較し、初心者向けに今やるべきポイ活を紹介。",

  keywords: [
    "ポイ活",
    "ポイ活おすすめ",
    "ポイントサイト",
    "クレジットカード ポイ活",
    "証券口座 ポイ活",
    "ハピタス",
    "モッピー",
    "高還元案件",
    "ポイ活ランキング",
    "AI分析",
  ],

  openGraph: {
    title:
      "ポイ活おすすめランキング｜AIが高還元案件を毎日分析",

    description:
      "クレカ・証券・回線など今やるべきポイ活をAIが毎日自動分析。",

    url: "https://poikatu-ai.vercel.app/",

    siteName: "ポイ活AI判定",

    locale: "ja_JP",

    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
