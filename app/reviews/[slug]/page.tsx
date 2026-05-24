import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_URL = "https://poikatu-ai.vercel.app";

const MOPPY_URL =
  "https://pc.moppy.jp/entry/invite.php?invite=ut3GA1ce&openExternalBrowser=1";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RankingItem = {
  category: string;
  rank: number;
  trend_keyword: string;
  offer_name?: string;
  reward?: number;
  reason?: string;
  updated_at?: string;
};

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
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
    .trim();
};

const getOfferName = (item: RankingItem) => {
  return item.offer_name || item.trend_keyword || item.category;
};

const formatReward = (reward?: number) => {
  if (!reward || reward <= 0) return "データ取得不可";
  return `${reward.toLocaleString("ja-JP")}P`;
};

const formatDate = (dateText?: string) => {
  if (!dateText) return null;

  const date = new Date(dateText);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getIsoDate = (dateText?: string) => {
  if (!dateText) return new Date().toISOString();

  const date = new Date(dateText);

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
};

const getGoogleSearchUrl = (keyword: string) => {
  return `https://www.google.com/search?q=${encodeURIComponent(keyword)}`;
};

const getReviewPageUrl = (offerName: string) => {
  return `${BASE_URL}/reviews/${encodeURIComponent(offerName)}`;
};

const getSeoTitle = (offerName: string) => {
  return `${offerName}の関連ワードをAIが整理`;
};

const getSeoDescription = (offerName: string) => {
  return `${offerName}について、Google検索で一緒に調べられている関連ワードをAIが整理。気になるワードをそのままGoogle検索できます。`;
};

async function getRankingItem(slug: string) {
  const decodedSlug = decodeURIComponent(slug);

  const { data, error } = await supabase
    .from("rankings")
    .select(
      "category, rank, trend_keyword, offer_name, reward, reason, updated_at"
    )
    .order("rank", { ascending: true })
    .limit(100);

  if (error || !data) {
    return null;
  }

  const target = data.find((item) => {
    const offerName = getOfferName(item);

    return (
      normalizeText(offerName) === normalizeText(decodedSlug) ||
      normalizeText(item.trend_keyword) === normalizeText(decodedSlug) ||
      normalizeText(item.category) === normalizeText(decodedSlug)
    );
  });

  return target || null;
}

async function getRelatedSearchWords(offerName: string) {
  const fallbackWords = [
    `${offerName} メリット`,
    `${offerName} デメリット`,
    `${offerName} 口コミ`,
    `${offerName} 評判`,
    `${offerName} ポイント`,
    `${offerName} ポイ活`,
    `${offerName} キャンペーン`,
    `${offerName} 条件`,
    `${offerName} 注意点`,
    `${offerName} お得`,
  ];

  try {
    const response = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&q=${encodeURIComponent(
        offerName
      )}`,
      {
        cache: "no-store",
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; PoikatsuAI/1.0; +https://poikatu-ai.vercel.app)",
        },
      }
    );

    if (!response.ok) return fallbackWords;

    const json = await response.json();
    const suggestions = Array.isArray(json?.[1]) ? (json[1] as string[]) : [];
    const words = suggestions
      .map((word) => word.trim())
      .filter((word) => word && normalizeText(word) !== normalizeText(offerName));
    const uniqueWords = Array.from(new Set([...words, ...fallbackWords]));

    return uniqueWords.slice(0, 10);
  } catch (error) {
    console.error(error);
    return fallbackWords;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const item = await getRankingItem(slug);

  const offerName = item ? getOfferName(item) : decodedSlug;
  const pageUrl = getReviewPageUrl(offerName);

  const title = getSeoTitle(offerName);
  const description = getSeoDescription(offerName);

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "ポイ活AI判定",
      type: "article",
      locale: "ja_JP",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ReviewPage({ params }: PageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const item = await getRankingItem(slug);

  const fallbackItem: RankingItem = {
    category: "ポイ活",
    rank: 0,
    trend_keyword: decodedSlug,
    offer_name: decodedSlug,
    reward: undefined,
    reason: undefined,
    updated_at: undefined,
  };

  const displayItem = item || fallbackItem;

  const offerName = getOfferName(displayItem);
  const rewardText = formatReward(displayItem.reward);
  const updatedDateText = formatDate(displayItem.updated_at);
  const isoDate = getIsoDate(displayItem.updated_at);
  const pageUrl = getReviewPageUrl(offerName);
  const seoTitle = getSeoTitle(offerName);
  const seoDescription = getSeoDescription(offerName);
  const relatedWords = await getRelatedSearchWords(offerName);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${BASE_URL}/#website`,
        name: "ポイ活AI判定",
        url: BASE_URL,
        inLanguage: "ja",
      },
      {
        "@type": "Organization",
        "@id": `${BASE_URL}/#organization`,
        name: "ポイ活AI判定",
        url: BASE_URL,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "ポイ活AI判定",
            item: BASE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: `${offerName}の関連ワード`,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "Article",
        "@id": `${pageUrl}#article`,
        headline: seoTitle,
        description: seoDescription,
        url: pageUrl,
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": pageUrl,
        },
        inLanguage: "ja",
        author: {
          "@id": `${BASE_URL}/#organization`,
        },
        publisher: {
          "@id": `${BASE_URL}/#organization`,
        },
        datePublished: isoDate,
        dateModified: isoDate,
        articleSection: "ポイ活関連ワード",
        about: [
          offerName,
          "ポイ活",
          "関連ワード",
          "Google検索",
          "ポイント還元",
          displayItem.category,
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#fff8fb] px-5 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <div className="mx-auto max-w-[1100px]">
        <a
          href="/"
          className="mb-6 inline-flex min-h-[54px] items-center justify-center rounded-full border-2 border-slate-200 bg-white px-6 text-base font-black text-slate-700 shadow-lg transition hover:scale-105 hover:bg-slate-50"
        >
          ← TOPページに戻る
        </a>

        <section className="overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-pink-100">
          <div className="bg-gradient-to-r from-pink-50 via-white to-orange-50 p-7 lg:p-10">
            <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-900 lg:text-6xl">
              {offerName}の関連ワードを
              <span className="bg-gradient-to-b from-yellow-300 to-orange-500 bg-clip-text text-transparent">
                AI
              </span>
              が整理
            </h1>

            <p className="mt-5 text-lg font-bold leading-9 text-slate-700 lg:text-xl lg:leading-10">
              {offerName}
              について、Google検索で一緒に調べられているワードをまとめています。
            </p>

            {updatedDateText && (
              <p className="mt-5 text-sm font-black text-slate-500">
                最終更新：{updatedDateText}
              </p>
            )}

            <div className="mt-7 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-pink-100">
                <div className="text-sm font-black text-slate-500">案件名</div>
                <div className="mt-2 text-2xl font-black text-slate-900">
                  {offerName}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-pink-100">
                <div className="text-sm font-black text-slate-500">
                  報酬ポイントの目安
                </div>
                <div className="mt-2 text-3xl font-black text-pink-500">
                  {rewardText}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-lg ring-1 ring-pink-100 lg:p-8">
          <h2 className="text-2xl font-black leading-tight text-slate-900 lg:text-4xl">
            🔍 いまGoogle検索されている{offerName}の関連ワード
          </h2>

          <p className="mt-3 text-base font-bold leading-8 text-slate-600 lg:text-lg">
            気になるワードを選んで、そのままGoogle検索できます。
          </p>

          <div className="mt-6 grid gap-4">
            {relatedWords.map((word, index) => (
              <div
                key={word}
                className="grid gap-3 rounded-2xl bg-pink-50/70 p-4 ring-1 ring-pink-100 sm:grid-cols-[auto_1fr_auto] sm:items-center lg:p-5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-500 text-lg font-black text-white shadow-md">
                  {index + 1}
                </div>

                <div className="text-lg font-black leading-7 text-slate-900 lg:text-xl">
                  {word}
                </div>

                <a
                  href={getGoogleSearchUrl(word)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[48px] items-center justify-center rounded-full border-2 border-pink-300 bg-white px-5 text-base font-black text-pink-600 shadow-sm transition hover:scale-105 hover:bg-pink-50"
                >
                  Googleで検索 ↗
                </a>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] bg-white p-8 text-center shadow-lg ring-1 ring-pink-100 lg:p-12">
          <div className="inline-flex rounded-full bg-pink-500 px-6 py-2 text-sm font-black text-white shadow-md shadow-pink-200/70 lg:text-base">
            ポイ活サイト最大手！
          </div>

          <h2 className="mt-5 text-4xl font-black leading-tight tracking-tight lg:text-5xl">
            モッピーでポイ活を始める
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg font-black leading-9 text-slate-700 lg:text-xl">
            はじめての人は、モッピーの
            <span className="text-pink-600">会員登録（無料）</span>
            からスタート
          </p>

          <a
            href={MOPPY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-auto mt-8 flex h-16 max-w-xl items-center justify-center rounded-2xl bg-gradient-to-r from-pink-500 to-orange-500 px-6 text-xl font-black text-white shadow-xl transition hover:scale-105"
          >
            モッピーでポイ活を始める
            <span className="ml-3 text-4xl leading-none">›</span>
          </a>

          <p className="mt-4 text-xs font-bold text-slate-400 lg:text-sm">
            ※このページには広告・紹介リンクを含みます。
          </p>
        </section>
      </div>
    </main>
  );
}
