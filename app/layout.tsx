import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-H420TPSRD0";
const SITE_DESCRIPTION =
  "ポイ活サイト「モッピー」のたくさんの案件の中から「お得」な案件がわかる。報酬の高さや手軽さをもとに、AIが毎日更新（0:00～1:00頃）。";

export const metadata: Metadata = {
  metadataBase: new URL("https://poikatu-ai.vercel.app"),
  title: {
    default: "モッピー案件分析｜お得なモッピー案件をAIが毎日更新",
    template: "%s｜モッピー案件分析",
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "モッピー案件分析",
    description: SITE_DESCRIPTION,
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
    description: SITE_DESCRIPTION,
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
      <body>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
