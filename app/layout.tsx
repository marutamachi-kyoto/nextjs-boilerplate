import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://poikatu-ai.vercel.app"),
  title: {
    default: "モッピー案件分析｜お得なモッピー案件をAIが毎日更新",
    template: "%s｜モッピー案件分析",
  },
  description:
    "ポイ活サイト「モッピー」のたくさんの案件の中から「お得」な案件がわかる。AIが分析して、毎日更新しています（0:00～1:00頃）。",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "モッピー案件分析",
    description:
      "ポイ活サイト「モッピー」のたくさんの案件の中から「お得」な案件がわかる。AIが分析して、毎日更新しています。",
    url: "https://poikatu-ai.vercel.app",
    siteName: "モッピー案件分析",
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: "/hero.png.png",
        width: 1200,
        height: 630,
        alt: "モッピー案件分析",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "モッピー案件分析",
    description:
      "ポイ活サイト「モッピー」のたくさんの案件の中から「お得」な案件がわかる。AIが分析して、毎日更新しています。",
    images: ["/hero.png.png"],
  },
  alternates: {
    canonical: "https://poikatu-ai.vercel.app",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
