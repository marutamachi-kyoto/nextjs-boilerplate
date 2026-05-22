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
  alternates: {
    canonical: `${BASE_URL}/free-poikatsu`,
  },
  openGraph: {
    title: "無料でできるポイ活特集｜ポイ活AI判定",
    description:
      "お金をかけずに始めたい人向けに、モッピーで確認できる無料ポイ活をまとめます。",
    url: `${BASE_URL}/free-poikatsu`,
    siteName: "ポイ活AI判定",
    type: "article",
    locale: "ja_JP",
  },
  robots: {
    index: true,
    follow: true,
  },
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

const getImageUrl = (html: string, baseUrl: string) => {
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  if (!imgMatch?.[1]) return undefined;
  return toAbsoluteUrl(imgMatch[1], baseUrl);
};

const getTitle = (html: string) => {
  const altMatch = html.match(/<img[^>]+alt=["']([^"']+)["'][^>]*>/i);
  const altText = altMatch?.[1]?.trim();
  if (altText && altText.length >= 3) return altText;

  const text = stripTags(html);
  return text
    .replace(/\d{1,3}(,\d{3})*P/g, " ")
    .replace(/★\d(\.\d)?/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 48);
};

const getReward = (text: string) => {
  const matches = [...text.matchAll(/([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)\s*P/g)];
  const values = matches
    .map((match) => Number(match[1].replace(/,/g, "")))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (values.length === 0) return 0;
  return Math.max(...values);
};

const isFreeOffer = (text: string) => {
  const includeWords = [
    "無料",
    "無料会員登録",
    "無料登録",
    "資料請求",
    "アプリ",
    "インストール",
    "口座開設",
    "LINE友達追加",
    "アンケート",
    "無料トライアル",
  ];

  const excludeWords = [
    "商品購入",
    "購入完了",
    "有料",
    "月額",
    "課金",
    "入金",
    "取引完了",
    "カード利用",
    "ショッピング",
    "来店",
    "予約来店",
  ];

  return (
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
      .slice(0, 80);

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
      const html = await response.text();
      return parseMoppyOffers(html, url);
    })
  );

  const allOffers = results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );

  const uniqueOffers = Array.from(
    new Map(allOffers.map((offer) => [offer.title, offer])).values()
  );

  return uniqueOffers
    .sort((a, b) => b.reward - a.reward)
    .slice(0, 10);
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

export default async function FreePoikatsuPage() {
  const offers = await fetchFreeOffers();

  return (
    <main className="min-h-screen bg-[#fff8fb]">
      <section className="border-b border-pink-100 bg-gradient-to-r from-pink-50 via-white to-orange-50">
        <div className="mx-auto grid max-w-[1120px] gap-10 px-5 py-12 lg:grid-cols-[1fr_330px] lg:items-center lg:py-14">
          <div>
            <div className="inline-flex rounded-full border-2 border-pink-300 bg-white px-6 py-3 text-base font-black text-pink-600 shadow-lg">
              ￥0ではじめる特集
            </div>

            <h1 className="mt-7 text-5xl font-black leading-tight tracking-tight text-slate-950 lg:text-7xl">
              <span className="text-pink-600">無料でできる</span>
              <br />
              ポイ活特集
            </h1>

            <p className="mt-6 max-w-[720px] text-xl font-black leading-10 text-slate-900 lg:text-2xl lg:leading-[2]">
              商品購入や有料サービスの申し込みではなく、
              <span className="rounded-full bg-pink-50 px-2 text-pink-600">
                お金をかけずに始めたい人向け
              </span>
              に、無料登録・資料請求・アプリ利用などのポイ活をまとめます。
              案件情報はモッピーで確認できるものを中心に、報酬額が高い順で毎日更新します。
            </p>
          </div>

          <div className="relative min-h-[280px]" aria-hidden="true">
            <div className="absolute right-0 top-8 h-[210px] w-[260px] overflow-hidden rounded-[2rem] border-[8px] border-slate-950 bg-gradient-to-br from-white to-orange-50 shadow-2xl">
              <div className="h-14 bg-gradient-to-r from-pink-400 to-orange-300" />
              <div className="absolute bottom-8 left-8 h-16 w-36 rounded-full bg-white shadow-inner ring-1 ring-pink-100" />
              <div className="absolute right-16 top-20 h-5 w-5 rounded-full bg-white shadow-[0_0_0_10px_rgba(255,255,255,0.22)]" />
            </div>
            <div className="absolute left-4 top-24 grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 text-5xl font-black text-white shadow-xl">
              P
            </div>
            <div className="absolute left-28 top-10 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 text-2xl font-black text-white shadow-xl">
              0
            </div>
            <div className="absolute bottom-4 left-16 h-28 w-44 -rotate-6 rounded-[1.5rem] bg-gradient-to-br from-white to-orange-50 shadow-2xl ring-1 ring-pink-100 before:absolute before:left-6 before:top-7 before:h-3 before:w-20 before:rounded-full before:bg-pink-50 after:absolute after:left-6 after:top-14 after:h-3 after:w-28 after:rounded-full after:bg-pink-50" />
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
                  <div className="relative aspect-[1.35/1] overflow-hidden border-b border-pink-100 bg-gradient-to-br from-pink-50 to-orange-50 before:absolute before:inset-4 before:rounded-[1rem] before:bg-[radial-gradient(circle_at_30%_32%,#ffd84d_0_18%,transparent_19%),radial-gradient(circle_at_72%_24%,#ff7db8_0_15%,transparent_16%),linear-gradient(135deg,#ffffff_0%,#fff8ea_100%)] before:shadow-inner after:absolute after:bottom-4 after:right-5 after:grid after:h-14 after:w-14 after:place-items-center after:rounded-full after:bg-gradient-to-br after:from-yellow-300 after:to-orange-400 after:text-3xl after:font-black after:text-white after:content-['P']" />
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
