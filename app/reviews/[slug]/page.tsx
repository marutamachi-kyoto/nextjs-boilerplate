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
  return `${reward.toLocaleString()}P`;
};

const formatDate = (dateText?: string) => {
  if (!dateText) return null;

  const date = new Date(dateText);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
};

const getReviewSearchUrl = (offerName: string) => {
  return `https://www.google.com/search?q=${encodeURIComponent(
    `${offerName} 口コミ 評判`
  )}`;
};

const getReviewPageUrl = (offerName: string) => {
  return `${BASE_URL}/reviews/${encodeURIComponent(offerName)}`;
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
  const pageUrl = getReviewPageUrl(offerName);

  const title = `${offerName}の口コミ・評判｜ポイ活AI判定`;
  const description = `${offerName}の口コミ・評判をAIが整理。良い口コミ、悪い口コミ、報酬ポイントの目安、申し込み前に確認すべき注意点をわかりやすくまとめています。`;

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
    return (
      <main className="min-h-screen bg-[#fff8fb] px-5 py-10">
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
  const googleReviewUrl = getReviewSearchUrl(offerName);
  const pageUrl = getReviewPageUrl(offerName);

  const goodReviews = [
    `${offerName}は、サービスとしての知名度が高く、初めて検討する人でも情報を調べやすいという声が見られやすいです。`,
    `手続きのしやすさ、使いやすさ、サービス内容の分かりやすさが評価されることがあります。`,
    `利用者が多いサービスの場合、口コミや体験談を確認しやすく、比較検討しやすい点もメリットです。`,
  ];

  const badReviews = [
    `機能や条件が多いサービスの場合、初めて使う人には少し分かりにくいと感じられることがあります。`,
    `申し込みや本人確認、審査などがある場合、完了までに時間がかかったという声が見られることがあります。`,
    `キャンペーン内容や条件が時期によって変わるため、申し込み前に最新情報を確認する必要があります。`,
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
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
        headline: `${offerName}の口コミ・評判`,
        description: `${offerName}の口コミ・評判、良い口コミ、悪い口コミ、報酬ポイントの目安をAIが整理しています。`,
        url: pageUrl,
        mainEntityOfPage: pageUrl,
        inLanguage: "ja",
        author: {
          "@type": "Organization",
          name: "ポイ活AI判定",
        },
        publisher: {
          "@type": "Organization",
          name: "ポイ活AI判定",
        },
        dateModified: item.updated_at || new Date().toISOString(),
        datePublished: item.updated_at || new Date().toISOString(),
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
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-pink-100 px-5 py-2 text-sm font-black text-pink-600">
                口コミ・評判
              </span>
              <span className="rounded-full bg-yellow-100 px-5 py-2 text-sm font-black text-yellow-700">
                AI整理
              </span>
              <span className="rounded-full bg-orange-100 px-5 py-2 text-sm font-black text-orange-700">
                ポイ活案件
              </span>
            </div>

            <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-900 lg:text-6xl">
              {offerName}の口コミ・評判を
              <span className="bg-gradient-to-b from-yellow-300 to-orange-500 bg-clip-text text-transparent">
                AI
              </span>
              が整理
            </h1>

            <p className="mt-6 max-w-[850px] text-lg font-bold leading-9 text-slate-700 lg:text-xl lg:leading-10">
              Google検索などで確認されやすい評判をもとに、{offerName}
              という商品・サービス自体の口コミで見るべきポイントを整理しました。
              実際の口コミ本文を転載せず、良い評判・悪い評判の傾向をわかりやすくまとめています。
            </p>

            {updatedDateText && (
              <p className="mt-4 text-sm font-black text-slate-500">
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

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <section className="rounded-[2rem] bg-white p-6 shadow-lg ring-1 ring-pink-100 lg:p-8">
            <h2 className="flex items-center gap-3 text-2xl font-black text-slate-900 lg:text-3xl">
              <span className="text-3xl">👍</span>
              良い口コミTOP3
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
              悪い口コミTOP3
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

        <section className="mt-6 rounded-[2rem] bg-gradient-to-r from-pink-50 via-white to-orange-50 p-6 shadow-lg ring-1 ring-pink-100 lg:p-8">
          <h2 className="text-2xl font-black text-slate-900 lg:text-3xl">
            最新の口コミも確認する
          </h2>

          <p className="mt-3 text-lg font-bold leading-9 text-slate-700 lg:text-xl lg:leading-10">
            最新の口コミは日々変わるため、申し込み前には外部検索でも確認するのがおすすめです。
            条件やキャンペーン内容は変更される場合があるため、必ず最新情報を確認してください。
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
