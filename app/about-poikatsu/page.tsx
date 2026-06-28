import Link from "next/link";

const MOPPY_URL =
  "https://pc.moppy.jp/entry/invite.php?invite=ut3GA1ce&openExternalBrowser=1";
const BASE_URL = "https://poikatu-ai.vercel.app";
const PAGE_URL = `${BASE_URL}/about-poikatsu`;

export const metadata = {
  title: "ポイ活とは？初心者向けに仕組みをわかりやすく解説",
  description:
    "ポイ活とは何かを初心者向けに解説。ポイントサイトの仕組み、ポイントの貯め方、現金やPayPayなどへの交換方法、モッピーの始め方をわかりやすく紹介します。",
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: "ポイ活とは？初心者向けに仕組みをわかりやすく解説｜モッピー案件分析",
    description:
      "ポイントサイトの仕組み、ポイントの貯め方、交換方法、モッピーの始め方を初心者向けに解説します。",
    url: PAGE_URL,
    siteName: "モッピー案件分析",
    type: "article",
    locale: "ja_JP",
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
    title: "ポイ活とは？初心者向けに仕組みを解説｜モッピー案件分析",
    description:
      "ポイントサイトの仕組み、ポイントの貯め方、交換方法、モッピーの始め方を初心者向けに解説します。",
    images: ["/hero.png.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AboutPoikatsuPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${BASE_URL}/#website`,
        name: "モッピー案件分析",
        url: BASE_URL,
        inLanguage: "ja-JP",
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${PAGE_URL}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "モッピー案件分析",
            item: BASE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "ポイ活とは",
            item: PAGE_URL,
          },
        ],
      },
      {
        "@type": "Article",
        "@id": `${PAGE_URL}#article`,
        headline: "ポイ活とは？初心者向けに仕組みをわかりやすく解説",
        description:
          "ポイ活とは何か、ポイントサイトの仕組み、ポイントの貯め方、交換方法、モッピーの始め方を初心者向けに解説します。",
        url: PAGE_URL,
        image: `${BASE_URL}/hero.png.png`,
        inLanguage: "ja-JP",
        author: {
          "@type": "Organization",
          name: "モッピー案件分析",
          url: BASE_URL,
        },
        publisher: {
          "@type": "Organization",
          name: "モッピー案件分析",
          url: BASE_URL,
          logo: {
            "@type": "ImageObject",
            url: `${BASE_URL}/favicon.png`,
          },
        },
        articleSection: "ポイ活初心者ガイド",
        about: ["ポイ活", "ポイントサイト", "モッピー", "ポイント交換"],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#edfffc_0,#fffaf0_520px,#fff_100%)] px-4 py-6 text-[#111827] lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="mb-6 inline-flex min-h-[48px] items-center justify-center rounded-full border border-[#bdeee9] bg-white px-6 text-sm font-bold text-[#07968f] shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition hover:bg-[#f6fffd]"
        >
          TOPページに戻る
        </Link>

        <section className="rounded-[24px] border border-[#c8f2ee] bg-white p-7 shadow-[0_12px_28px_rgba(15,23,42,0.06)] lg:p-10">
          <p className="text-sm font-bold text-[#07968f]">初心者向けガイド</p>
          <h1 className="mt-3 text-[clamp(34px,5vw,56px)] font-bold leading-tight">
            ポイ活とは？
          </h1>
          <p className="mt-5 text-lg font-bold leading-9 text-[#1f2937] lg:text-xl">
            ポイ活とは、ポイントサイトやキャンペーンを活用して、買い物・サービス登録・アプリ利用などでポイントを貯める活動です。貯めたポイントは、現金・電子マネー・ギフト券などに交換できます。
          </p>
        </section>

        <section className="mt-5 rounded-[24px] border border-[#c8f2ee] bg-white p-7 shadow-[0_12px_28px_rgba(15,23,42,0.06)] lg:p-10">
          <h2 className="text-2xl font-bold lg:text-3xl">ポイ活の基本の流れ</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            {[
              ["1", "登録", "ポイントサイトに無料登録する"],
              ["2", "案件選択", "自分に合う案件を選ぶ"],
              ["3", "条件達成", "申込や登録などの条件を満たす"],
              ["4", "交換", "ポイントを現金や電子マネーに交換する"],
            ].map(([num, title, text]) => (
              <div key={title} className="rounded-[18px] bg-[#f6fffd] p-5">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#28bdb3] text-lg font-bold text-white">
                  {num}
                </div>
                <h3 className="mt-4 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm font-bold leading-7 text-[#475569]">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-[24px] border border-[#c8f2ee] bg-white p-7 text-center shadow-[0_12px_28px_rgba(15,23,42,0.06)] lg:p-10">
          <h2 className="text-2xl font-bold lg:text-3xl">モッピーでポイ活を始める</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-bold leading-8 text-[#475569]">
            はじめての人は、モッピーの会員登録（無料）からスタートできます。
          </p>
          <a
            href={MOPPY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-auto mt-6 flex min-h-[52px] max-w-sm items-center justify-center rounded-[14px] bg-[linear-gradient(90deg,#28bdb3,#07968f)] px-5 text-base font-bold text-white shadow-[0_14px_26px_rgba(40,189,179,0.22)] transition hover:scale-105"
          >
            モッピーで始める ›
          </a>
        </section>
      </div>
    </main>
  );
}
