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
    .replace(/　/g, "")
    .replace(/\s+/g, "")
    .replace(/（/g, "(")
    .replace(/）/g, ")")
    .replace(/[・･]/g, "")
    .replace(/[ーｰ−]/g, "-")
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

const getReviewSearchUrl = (offerName: string) => {
  return `https://www.google.com/search?q=${encodeURIComponent(
    `${offerName} 口コミ 評判 ポイ活`
  )}`;
};

const getReviewPageUrl = (offerName: string) => {
  return `${BASE_URL}/reviews/${encodeURIComponent(offerName)}`;
};

const getSeoTitle = (offerName: string) => {
  return `${offerName}のポイ活案件はお得？口コミ・評判とポイント還元をAIが整理`;
};

const getSeoDescription = (offerName: string, rewardText?: string) => {
  const rewardPart =
    rewardText && rewardText !== "データ取得不可"
      ? `報酬目安は${rewardText}。`
      : "";

  return `${offerName}のポイ活案件について、口コミ・評判で確認したいポイント、報酬条件、申し込み前の注意点をAIが整理。${rewardPart}ポイ活案件を比較する前の確認に役立ちます。`;
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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const item = await getRankingItem(slug);

  const offerName = item ? getOfferName(item) : decodedSlug;
  const rewardText = item ? formatReward(item.reward) : undefined;
  const pageUrl = getReviewPageUrl(offerName);

  const title = getSeoTitle(offerName);
  const description = getSeoDescription(offerName, rewardText);

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

  if (!item) {
    const fallbackPageUrl = `${BASE_URL}/reviews/${encodeURIComponent(
      decodedSlug
    )}`;

    const notFoundJsonLd = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${decodedSlug}の口コミ・評判`,
      url: fallbackPageUrl,
      inLanguage: "ja",
      isPartOf: {
        "@type": "WebSite",
        name: "ポイ活AI判定",
        url: BASE_URL,
      },
    };

    return (
      <main className="min-h-screen bg-[#fff8fb] px-5 py-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(notFoundJsonLd),
          }}
        />

        <div className="mx-auto max-w-[900px] rounded-[2rem] bg-white p-8 shadow-lg ring-1 ring-pink-100">
          <h1 className="text-3xl font-black text-slate-900">
            口コミページが見つかりませんでした
          </h1>

          <p className="mt-4 text-base font-bold leading-8 text-slate-600">
            「{decodedSlug}」に一致するランキング案件が見つかりませんでした。
            ランキングが更新された可能性があります。
          </p>

          <a
            href="/#ranking-section"
            className="mt-6 inline-flex min-h-[64px] items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-orange-500 px-8 py-4 text-base font-black text-white shadow-xl transition hover:scale-105"
          >
            ランキングに戻る
          </a>
        </div>
      </main>
    );
  }

  const offerName = getOfferName(item);
  const rewardText = formatReward(item.reward);
  const updatedDateText = formatDate(item.updated_at);
  const isoDate = getIsoDate(item.updated_at);
  const googleReviewUrl = getReviewSearchUrl(offerName);
  const pageUrl = getReviewPageUrl(offerName);
  const seoTitle = getSeoTitle(offerName);
  const seoDescription = getSeoDescription(offerName, rewardText);

  const goodReviews = [
    `${offerName}は、サービスとしての知名度が高く、初めて検討する人でも情報を調べやすい点がメリットです。`,
    `手続きのしやすさ、使いやすさ、サービス内容の分かりやすさが評価されやすい案件です。`,
    `利用者が多いサービスの場合、口コミや体験談を確認しやすく、比較検討しやすい点も強みです。`,
  ];

  const badReviews = [
    `条件や注意事項が多い案件の場合、初めて申し込む人には少し分かりにくいと感じられることがあります。`,
    `申し込み、本人確認、審査、利用条件などがある場合、ポイント獲得までに時間がかかることがあります。`,
    `キャンペーン内容や報酬ポイントは時期によって変わるため、申し込み前に最新条件を確認する必要があります。`,
  ];

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
            name: `${offerName}の口コミ・評判`,
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
        articleSection: "ポイ活口コミ・評判",
        about: [
          offerName,
          "ポイ活",
          "口コミ",
          "評判",
          "ポイント還元",
          item.category,
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
          href="/#ranking-section"
          className="mb-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-pink-600 shadow-lg ring-1 ring-pink-100 transition hover:scale-105 hover:bg-pink-50"
        >
          ← ランキングに戻る
        </a>

        <section className="overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-pink-100">
          <div className="bg-gradient-to-r from-pink-50 via-white to-orange-50 p-7 lg:p-10">
            <p className="mb-4 inline-flex rounded-full bg-white px-5 py-2 text-sm font-black text-pink-600 shadow-sm ring-1 ring-pink-100">
              {item.category}のポイ活案件
            </p>

            <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-900 lg:text-6xl">
              {offerName}のポイ活案件はお得？
              <br />
              口コミ・評判を
              <span className="bg-gradient-to-b from-yellow-300 to-orange-500 bg-clip-text text-transparent">
                AI
              </span>
              が整理
            </h1>

            <p className="mt-5 text-lg font-bold leading-9 text-slate-700 lg:text-xl lg:leading-10">
              {offerName}
              のポイ活案件について、口コミ・評判で確認したいポイント、報酬ポイントの目安、申し込み前の注意点をまとめています。
            </p>

            {updatedDateText && (
              <p className="mt-5 text-sm font-black text-slate-500">
                最終更新：{updatedDateText}
              </p>
            )}

            <div className="mt-7 grid gap-4 lg:grid-cols-3">
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

              <div className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-pink-100">
                <div className="text-sm font-black text-slate-500">
                  注目カテゴリ
                </div>
                <div className="mt-2 text-2xl font-black text-slate-900">
                  {item.category}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-lg ring-1 ring-pink-100 lg:p-8">
          <h2 className="text-2xl font-black text-slate-900 lg:text-3xl">
            {offerName}のポイ活案件で確認したいポイント
          </h2>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl bg-pink-50 p-5">
              <h3 className="text-lg font-black text-slate-900">
                報酬条件
              </h3>
              <p className="mt-3 text-base font-bold leading-8 text-slate-700">
                ポイント獲得には、申し込み条件・利用条件・対象外条件が設定されていることがあります。
              </p>
            </div>

            <div className="rounded-2xl bg-orange-50 p-5">
              <h3 className="text-lg font-black text-slate-900">
                付与時期
              </h3>
              <p className="mt-3 text-base font-bold leading-8 text-slate-700">
                ポイントが反映されるまでの期間は案件によって異なります。申し込み前に予定時期を確認しておくと安心です。
              </p>
            </div>

            <div className="rounded-2xl bg-yellow-50 p-5">
              <h3 className="text-lg font-black text-slate-900">
                口コミ・評判
              </h3>
              <p className="mt-3 text-base font-bold leading-8 text-slate-700">
                実際の利用感や注意点は変わることがあるため、最新の評判もあわせて確認するのがおすすめです。
              </p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <section className="rounded-[2rem] bg-white p-6 shadow-lg ring-1 ring-pink-100 lg:p-8">
            <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900 lg:text-3xl">
              <span className="text-3xl">👍</span>
              良い口コミで見られやすいポイント
            </h2>

            <ul className="mt-5 space-y-4">
              {goodReviews.map((point) => (
                <li
                  key={point}
                  className="rounded-2xl bg-pink-50 px-5 py-5 text-lg font-black leading-9 text-slate-800 lg:text-xl lg:leading-10"
                >
                  {point}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[2rem] bg-white p-6 shadow-lg ring-1 ring-pink-100 lg:p-8">
            <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900 lg:text-3xl">
              <span className="text-3xl">⚠️</span>
              悪い口コミで確認したい注意点
            </h2>

            <ul className="mt-5 space-y-4">
              {badReviews.map((point) => (
                <li
                  key={point}
                  className="rounded-2xl bg-orange-50 px-5 py-5 text-lg font-black leading-9 text-slate-800 lg:text-xl lg:leading-10"
                >
                  {point}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-lg ring-1 ring-pink-100 lg:p-8">
          <h2 className="text-2xl font-black text-slate-900 lg:text-3xl">
            {offerName}はどんな人に向いている？
          </h2>

          <p className="mt-4 text-lg font-bold leading-9 text-slate-700 lg:text-xl lg:leading-10">
            {offerName}
            は、ポイ活でポイント還元を狙いながら、サービス内容や申し込み条件を比較したい人に向いています。
            特に、報酬ポイントだけで判断せず、条件達成のしやすさ、ポイント付与時期、対象外条件を確認してから申し込むことが大切です。
          </p>

          {item.reason && (
            <div className="mt-5 rounded-2xl bg-pink-50 p-5">
              <h3 className="text-lg font-black text-slate-900">
                AIによる注目理由
              </h3>
              <p className="mt-3 text-base font-bold leading-8 text-slate-700">
                {item.reason}
              </p>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-[2rem] bg-gradient-to-r from-pink-50 via-white to-orange-50 p-6 shadow-lg ring-1 ring-pink-100 lg:p-8">
          <h2 className="text-2xl font-black text-slate-900 lg:text-3xl">
            最新の口コミも確認する
          </h2>

          <p className="mt-3 text-lg font-bold leading-9 text-slate-700 lg:text-xl lg:leading-10">
            最新の口コミは日々変わるため、申し込み前には外部検索でも確認するのがおすすめです。
            ポイント付与条件やキャンペーン内容も、必ず申し込み前に最新情報を確認してください。
          </p>

          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row">
            <a
              href={googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[72px] w-full flex-1 items-center justify-center rounded-[1.4rem] border-2 border-pink-200 bg-white px-6 py-5 text-center text-lg font-black leading-6 text-pink-600 shadow-lg transition hover:scale-105 hover:bg-pink-50 lg:text-xl"
            >
              Googleで口コミを見る
              <span className="ml-2 text-2xl leading-none">↗</span>
            </a>

            <a
              href={MOPPY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[72px] w-full flex-1 items-center justify-center rounded-[1.4rem] bg-gradient-to-r from-pink-500 to-orange-500 px-6 py-5 text-center text-lg font-black leading-6 text-white shadow-xl transition hover:scale-105 lg:text-xl"
            >
              モッピーで探す
              <span className="ml-3 text-3xl leading-none">›</span>
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
