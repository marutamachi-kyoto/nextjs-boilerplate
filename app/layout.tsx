import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://poikatu-ai.vercel.app"),

  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },

  title: {
    default: "ポイ活AI判定｜今やるべきポイ活をAIがランキング",
    template: "%s｜ポイ活AI判定",
  },

  description:
    "ポイ活AI判定は、話題度・報酬レンジ・クリック数などをもとに、初心者向けのおすすめポイ活ジャンルをAIが自動判定するランキングサイトです。",

  keywords: [
    "ポイ活",
    "ポイントサイト",
    "ポイ活 おすすめ",
    "ポイントサイト おすすめ",
    "AIランキング",
    "副業",
    "お小遣い稼ぎ",
    "クレカ案件",
    "証券口座",
  ],

  openGraph: {
    title: "ポイ活AI判定｜今やるべきポイ活をAIがランキング",
    description:
      "話題度・報酬レンジ・クリック数をもとに、今おすすめのポイ活をAIが自動判定。",
    url: "https://poikatu-ai.vercel.app",
    siteName: "ポイ活AI判定",
    images: [
      {
        url: "/hero.png.png",
        width: 1200,
        height: 900,
        alt: "ポイ活AI判定",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "ポイ活AI判定｜今やるべきポイ活をAIがランキング",
    description:
      "話題度・報酬レンジ・クリック数をもとに、今おすすめのポイ活をAIが自動判定。",
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
