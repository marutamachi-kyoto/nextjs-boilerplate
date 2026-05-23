import type { Metadata } from "next";

export const revalidate = 86400;

const BASE_URL = "https://poikatu-ai.vercel.app";
const MOPPY_INVITE_URL =
  "https://pc.moppy.jp/entry/invite.php?invite=ut3GA1ce&openExternalBrowser=1";

const SOURCE_URLS = [
  "https://pc.moppy.jp/service/?order=1",
  "https://pc.moppy.jp/ad/?c_id=1011",
  "https://pc.moppy.jp/ad/?c_id=1010",
];

const MAX_OFFERS = 20;

type FreeOffer = {
  title: string;
  description: string;
  reward: number;
  rewardText: string;
  imageUrl?: string;
  url: string;
};

export const metadata: Metadata = {
  title: "無料でできるポイ活特集｜お金をかけずに始めるポイ活一覧",
  description:
    "商品購入や有料サービスの申し込みではなく、お金をかけずに始めたい人向けに、無料登録・資料請求・アプリ利用などのポイ活をまとめます。モッピーで確認できる案件を中心に報酬額が高い順で掲載します。",
  alternates: { canonical: `${BASE_URL}/free-poikatsu` },
  openGraph: {
    title: "無料でできるポイ活特集｜ポイ活AI判定",
    description:
      "お金をかけずに始めたい人向けに、モッピーで確認できる無料ポイ活をまとめます。",
    url: `${BASE_URL}/free-poikatsu`,
    siteName: "ポイ活AI判定",
    type: "article",
    locale: "ja_JP",
  },
  robots: { index: true, follow: true },
};

const stripTags = (html: string) => {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
};

const toAbsoluteUrl = (url: string, baseUrl: string) => {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return url;
  }
};

const isUsableImageUrl = (url?: string) => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  const trackingImagePatterns = [
    "ad-track.jp/ad/p/img",
    "ad-track.jp/ad/p/",
    "doubleclick",
    "pixel",
    "1x1",
  ];

  return !trackingImagePatterns.some((pattern) => lowerUrl.includes(pattern));
};

const getImageUrl = (html: string, baseUrl: string) => {
  const imageMatches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)];

  for (const match of imageMatches) {
    const imageUrl = toAbsoluteUrl(match[1], baseUrl);
    if (isUsableImageUrl(imageUrl)) return imageUrl;
  }

  return undefined;
};

const getTitle = (html: string) => {
  const alt = html.match(/<img[^>]+alt=["']([^"']+)["'][^>]*>/i)?.[1]?.trim();
  if (alt && alt.length >= 3) return alt.slice(0, 60);

  return stripTags(html)
    .replace(/\d{1,3}(,\d{3})*P/g, " ")
    .replace(/★\d(\.\d)?/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
};

const getReward = (text: string) => {
  const values = [...text.matchAll(/([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)\s*P/g)]
    .map((match) => Number(match[1].replace(/,/g, "")))
    .filter((value) => Number.isFinite(value) && value > 0);

  return values.length > 0 ? Math.max(...values) : 0;
};

const isFreeOffer = (text: string) => {
  const includeWords = [
    "無料",
    "無料会員登録",
    "無料登録",
    "資料請求",
    "アプリ",
    "インストール",
    "LINE友達追加",
    "アンケート",
    "無料トライアル",
    "無料相談",
  ];

  const excludeWords = [
    "商品購入",
    "購入完了",
    "有料",
    "月額",
    "課金",
    "入金",
    "投資",
    "投資完了",
    "不動産投資",
    "100万円",
    "取引",
    "取引完了",
    "証券",
    "FX",
    "カード利用",
    "ショッピング",
    "来店",
    "予約来店",
  ];

  return (
    text.includes("無料") &&
    includeWords.some((word) => text.includes(word)) &&
    !excludeWords.some((word) => text.includes(word))
  );
};

const parseMoppyOffers = (html: string, sourceUrl: string) => {
  const offers: FreeOffer[] = [];
  const linkPattern = /<a\b[^>]*href=["']([^"']*(?:detail\.php|\/ad\/detail)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(linkPattern)) {
    const href = match[1];
    const chunk = match[2];
    const text = stripTags(chunk);
    const reward = getReward(text);

    if (!href || !text || reward <= 0 || !isFreeOffer(text)) continue;

    const title = getTitle(chunk);
    if (!title || title.length < 3) continue;

    const description = text
      .replace(title, "")
      .replace(/\d{1,3}(,\d{3})*P/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 84);

    offers.push({
      title,
      description:
        description ||
        "無料で始めやすい案件です。ポイント獲得条件をモッピーで確認してから申し込めます。",
      reward,
      rewardText: `${reward.toLocaleString("ja-JP")}P`,
      imageUrl: getImageUrl(chunk, sourceUrl),
      url: toAbsoluteUrl(href, sourceUrl),
    });
  }

  return offers;
};

async function fetchFreeOffers() {
  const results = await Promise.allSettled(
    SOURCE_URLS.map(async (url) => {
      const response = await fetch(url, {
        next: { revalidate: 86400 },
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; PoikatsuAI/1.0; +https://poikatu-ai.vercel.app)",
        },
      });

      if (!response.ok) return [];
      return parseMoppyOffers(await response.text(), url);
    })
  );

  const offers = results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );

  return Array.from(new Map(offers.map((offer) => [offer.title, offer])).values())
    .sort((a, b) => b.reward - a.reward)
    .slice(0, MAX_OFFERS);
}

const formatDate = () => {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
};

function FallbackImage() {
  return (
    <div className="relative aspect-[1.35/1] overflow-hidden border-b border-slate-100 bg-gradient-to-br from-[#fffefe] to-[#fff8fb]">
      <div className="absolute left-[15%] right-[15%] top-1/2 h-[54px] -translate-y-1/2 rounded-[14px] border-2 border-[#f4b5cf] bg-white/70" />
      <div className="absolute left-[27%] right-[27%] top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-[#f3a7c6] to-transparent" />
      <div className="absolute left-[30%] right-[30%] top-[calc(50%-12px)] h-px bg-[#fff2f8]" />
      <div className="absolute left-[30%] right-[30%] top-[calc(50%+12px)] h-px bg-[#fff2f8]" />
    </div>
  );
}

export default async function FreePoikatsuPage() {
  const offers = await fetchFreeOffers();

  return (
    <main className="min-h-screen bg-[#fff8fb]">
      <section className="border-b border-pink-100 bg-gradient-to-r from-pink-50 via-white to-orange-50">
        <div className="mx-auto max-w-[1120px] px-5 py-10 lg:py-14">
          <a
            href="/"
            className="inline-flex min-h-[54px] items-center justify-center rounded-full border-2 border-slate-200 bg-white px-6 text-base font-black text-slate-700 shadow-lg transition hover:scale-105 hover:bg-slate-50"
          >
            ← TOPページに戻る
          </a>

          <h1 className="mt-10 text-5xl font-black leading-tight tracking-tight text-slate-950 lg:text-7xl">
            <span className="text-pink-600">無料でできる</span>
            <br />
            ポイ活特集
          </h1>

          <p className="mt-6 max-w-[1040px] text-lg font-bold leading-9 text-slate-900 lg:text-xl lg:leading-10">
            商品購入や有料サービスの申し込みではなく、お金をかけずに始めたい人向けの、無料でできるポイ活をまとめます。
          </p>

          <div className="mt-10 rounded-[2rem] border border-pink-100 bg-white/95 px-6 py-8 text-center shadow-xl shadow-pink-100/70 lg:px-12 lg:py-10">
            <div className="inline-flex items-center rounded-full bg-pink-500 px-6 py-2 text-sm font-black text-white shadow-md shadow-pink-200/70 lg:text-base">
              ポイ活サイト最大手！
            </div>
            <h2 className="mt-5 text-4xl font-black leading-tight tracking-tight text-slate-950 lg:text-5xl">
              モッピーでポイ活を始める
            </h2>
            <p className="mx-auto mt-5 max-w-[840px] text-base font-bold leading-8 text-slate-700 lg:text-lg lg:leading-9">
              はじめての人は、モッピーの
              <span className="text-pink-600">会員登録（無料）</span>
              からスタート
            </p>
            <a
              href={MOPPY_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-auto mt-7 flex min-h-[64px] w-full max-w-[620px] items-center justify-center rounded-2xl bg-gradient-to-r from-pink-500 to-orange-500 px-8 text-lg font-black text-white shadow-xl shadow-pink-200/70 transition hover:scale-105 lg:text-xl"
            >
              モッピーでポイ活を始める ›
            </a>
            <p className="mt-4 text-xs font-bold leading-6 text-slate-400 lg:text-sm">
              ※このページには広告・紹介リンクを含みます。
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] px-5 py-10">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="text-4xl font-black leading-tight text-slate-950 lg:text-5xl">
            <span className="text-orange-400">🔥</span> 無料でできるポイ活一覧
          </h2>
          <div className="w-fit rounded-full bg-white px-5 py-3 text-sm font-black text-slate-600 shadow-lg ring-1 ring-slate-100">
            最終更新：{formatDate()}
          </div>
        </div>

        {offers.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {offers.map((offer) => (
              <article
                key={offer.title}
                className="flex min-h-full flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-lg ring-1 ring-pink-100"
              >
                {offer.imageUrl ? (
                  <img
                    src={offer.imageUrl}
                    alt={offer.title}
                    className="aspect-[1.35/1] w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <FallbackImage />
                )}

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-xl font-black leading-snug text-slate-950">
                    {offer.title}
                  </h3>

                  <p className="mt-3 text-sm font-bold leading-7 text-slate-600">
                    {offer.description}
                  </p>

                  <div className="mt-auto pt-5">
                    <div className="text-sm font-black text-slate-600">
                      報酬ポイントの目安
                    </div>
                    <div className="mt-1 text-3xl font-black text-pink-500">
                      {offer.rewardText}
                    </div>
                  </div>

                  <a
                    href={offer.url || MOPPY_INVITE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex min-h-[52px] items-center justify-center rounded-2xl bg-gradient-to-r from-pink-500 to-orange-500 px-4 text-center text-base font-black text-white shadow-lg transition hover:scale-105"
                  >
                    モッピーで確認
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] bg-white p-8 text-center shadow-lg ring-1 ring-pink-100">
            <p className="text-xl font-black leading-9 text-slate-800">
              現在、モッピーの無料案件情報を取得できませんでした。
              時間をおいて再度確認するか、モッピー公式ページで無料案件を探してください。
            </p>
            <a
              href={MOPPY_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex min-h-[56px] items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-orange-500 px-8 text-base font-black text-white shadow-lg transition hover:scale-105"
            >
              モッピーで探す
            </a>
          </div>
        )}

        <p className="mt-6 text-center text-xs font-bold leading-6 text-slate-400 lg:text-sm">
          ※ モッピー上で確認できる情報をもとに表示しています。ポイント数や条件は変わることがあります。
          申し込み前に必ずモッピーの案件詳細ページで最新条件を確認してください。
        </p>
      </section>
    </main>
  );
}
