import Link from "next/link";
import { notFound } from "next/navigation";

const MOPPY_URL =
  "https://pc.moppy.jp/entry/invite.php?invite=ut3GA1ce&openExternalBrowser=1";

type Offer = {
  slug: string;
  name: string;
  category: string;
  keyword: string;
  score: number;
  heroTitle: string;
  description: string;
  trendKeywords: string[];
  aiReasons: {
    icon: string;
    title: string;
    text: string;
  }[];
  recommendReasons: {
    icon: string;
    title: string;
    text: string;
  }[];
};

const offers: Offer[] = [
  {
    slug: "rakuten-mobile",
    name: "楽天モバイル",
    category: "通信・回線",
    keyword: "楽天モバイル",
    score: 92,
    heroTitle: "楽天モバイルのポイ活案件をAI判定",
    description:
      "楽天モバイルは、通信費の見直し需要が高く、乗り換えや新規契約でポイント獲得を狙いやすい案件です。AIは検索動向、還元期待値、初心者の申し込みやすさを総合して注目案件として評価しています。",
    trendKeywords: [
      "楽天モバイル",
      "楽天モバイル 三木谷",
      "楽天モバイル キャンペーン",
      "楽天モバイル 乗り換え",
      "楽天モバイル 評判",
    ],
    aiReasons: [
      {
        icon: "📈",
        title: "高額ポイント",
        text: "乗り換えや新規契約で高額ポイントを狙いやすい案件です。",
      },
      {
        icon: "💗",
        title: "SNSで話題",
        text: "通信費の見直しやキャンペーン関連の話題が出やすい案件です。",
      },
      {
        icon: "🎁",
        title: "条件が明確",
        text: "申し込み条件が比較しやすく、初心者でも検討しやすい案件です。",
      },
    ],
    recommendReasons: [
      {
        icon: "🪙",
        title: "高額還元を狙いやすい",
        text: "通信系案件はポイント単価が高くなりやすく、まとまったポイント獲得を狙えます。",
      },
      {
        icon: "📱",
        title: "固定費の見直しに向く",
        text: "スマホ料金の見直しとポイ活を同時に検討できる点が強みです。",
      },
      {
        icon: "✅",
        title: "初心者でも始めやすい",
        text: "申し込み導線がわかりやすく、初めての高額案件としても選びやすいです。",
      },
      {
        icon: "🏆",
        title: "知名度が高い",
        text: "楽天ブランドの認知度が高く、安心して比較しやすい案件です。",
      },
    ],
  },
  {
    slug: "tiktok-lite",
    name: "TikTok Lite",
    category: "アプリ・ゲーム",
    keyword: "TikTok Lite",
    score: 86,
    heroTitle: "TikTok Liteのポイ活案件をAI判定",
    description:
      "TikTok Liteは、アプリ利用や動画視聴系のポイ活案件として人気があります。AIは話題性、参加しやすさ、短期達成のしやすさを総合して、初心者向け案件として評価しています。",
    trendKeywords: [
      "TikTok Lite",
      "TikTok Lite ポイント",
      "TikTok Lite 招待",
      "TikTok Lite キャンペーン",
      "TikTok Lite 稼ぎ方",
    ],
    aiReasons: [
      {
        icon: "🔍",
        title: "検索急増",
        text: "アプリ利用やポイント獲得に関する検索需要が出やすい案件です。",
      },
      {
        icon: "💗",
        title: "SNS話題化",
        text: "SNS上で招待やキャンペーン情報が拡散されやすい特徴があります。",
      },
      {
        icon: "⏱",
        title: "短期達成可",
        text: "条件が比較的わかりやすく、短期間で成果を狙いやすい案件です。",
      },
    ],
    recommendReasons: [
      {
        icon: "📲",
        title: "スマホだけで始めやすい",
        text: "アプリ案件なので、PC不要で気軽に取り組みやすいです。",
      },
      {
        icon: "🔥",
        title: "話題性が高い",
        text: "キャンペーンや招待施策が話題になりやすく、注目度が高い案件です。",
      },
      {
        icon: "✅",
        title: "初心者向け",
        text: "登録や利用条件が比較的シンプルで、初めてのポイ活にも向いています。",
      },
      {
        icon: "🎁",
        title: "キャンペーン期待",
        text: "時期によってポイント還元が強化される可能性があります。",
      },
    ],
  },
  {
    slug: "paypay-card",
    name: "PayPayカード",
    category: "クレジットカード",
    keyword: "PayPayカード",
    score: 87,
    heroTitle: "PayPayカードのポイ活案件をAI判定",
    description:
      "PayPayカードは、キャッシュレス利用者との相性がよく、クレジットカード案件の中でも注目度が高い案件です。AIは還元期待値、申込需要、初心者の取り組みやすさを総合して評価しています。",
    trendKeywords: [
      "PayPayカード",
      "PayPayカード キャンペーン",
      "PayPayカード ポイント",
      "PayPayカード 審査",
      "PayPayカード お得",
    ],
    aiReasons: [
      {
        icon: "¥",
        title: "高額還元",
        text: "カード案件はポイント単価が高く、まとまった還元を狙いやすいです。",
      },
      {
        icon: "⚡",
        title: "即効性あり",
        text: "申し込みから成果につながる流れが比較的わかりやすい案件です。",
      },
      {
        icon: "👤",
        title: "初心者向け",
        text: "知名度が高く、初めてのカード案件としても検討しやすいです。",
      },
    ],
    recommendReasons: [
      {
        icon: "💳",
        title: "高単価を狙える",
        text: "クレジットカード案件はポイ活の中でも高単価になりやすいジャンルです。",
      },
      {
        icon: "🛒",
        title: "日常利用と相性が良い",
        text: "PayPay経済圏との相性がよく、普段使いも考えやすい案件です。",
      },
      {
        icon: "✅",
        title: "知名度が高い",
        text: "サービス認知度が高いため、比較検討しやすい点が強みです。",
      },
      {
        icon: "🎁",
        title: "キャンペーン期待",
        text: "時期によって入会特典やポイント施策が強化される可能性があります。",
      },
    ],
  },
  {
    slug: "smbc-card-nl",
    name: "三井住友カード（NL）",
    category: "クレジットカード",
    keyword: "三井住友カード（NL）",
    score: 89,
    heroTitle: "三井住友カード（NL）のポイ活案件をAI判定",
    description:
      "三井住友カード（NL）は、知名度と利用しやすさのバランスが良いクレジットカード案件です。AIは高還元性、検索需要、初心者の申し込みやすさをもとに注目案件として評価しています。",
    trendKeywords: [
      "三井住友カード NL",
      "三井住友カード キャンペーン",
      "三井住友カード ポイント",
      "三井住友カード 審査",
      "三井住友カード お得",
    ],
    aiReasons: [
      {
        icon: "¥",
        title: "高額還元",
        text: "カード案件として高単価になりやすく、ポイント獲得を狙いやすいです。",
      },
      {
        icon: "⚡",
        title: "即効性あり",
        text: "申し込み需要が高く、成果につながりやすい案件です。",
      },
      {
        icon: "👤",
        title: "初心者向け",
        text: "ナンバーレスカードとして知名度が高く、比較しやすい案件です。",
      },
    ],
    recommendReasons: [
      {
        icon: "💳",
        title: "定番カード案件",
        text: "ポイ活の高額案件として検討されやすい定番ジャンルです。",
      },
      {
        icon: "🏦",
        title: "信頼感が高い",
        text: "大手金融系カードとして安心感があり、比較対象に入りやすいです。",
      },
      {
        icon: "✅",
        title: "初心者でも検討しやすい",
        text: "サービス内容がわかりやすく、初めてのカード案件にも向いています。",
      },
      {
        icon: "🎁",
        title: "入会特典に期待",
        text: "時期によって入会キャンペーンが強化される可能性があります。",
      },
    ],
  },
  {
    slug: "rakuten-sec",
    name: "楽天証券",
    category: "証券・投資",
    keyword: "楽天証券",
    score: 85,
    heroTitle: "楽天証券のポイ活案件をAI判定",
    description:
      "楽天証券は、NISAや資産形成への関心と相性が良い証券口座案件です。AIは検索動向、口座開設需要、還元期待値を総合し、長期的に注目度の高い案件として評価しています。",
    trendKeywords: [
      "楽天証券",
      "楽天証券 NISA",
      "楽天証券 口座開設",
      "楽天証券 キャンペーン",
      "楽天証券 ポイント",
    ],
    aiReasons: [
      {
        icon: "📈",
        title: "投資需要",
        text: "NISAや資産形成への関心が高く、口座開設需要が出やすい案件です。",
      },
      {
        icon: "🎁",
        title: "高ポイント",
        text: "証券系案件は条件達成で高めのポイントを狙える場合があります。",
      },
      {
        icon: "⏱",
        title: "申込増加",
        text: "投資関心の高まりと連動して、申し込み需要が伸びやすい案件です。",
      },
    ],
    recommendReasons: [
      {
        icon: "📊",
        title: "資産形成需要が強い",
        text: "NISAや投資初心者の検索需要と相性がよい案件です。",
      },
      {
        icon: "🪙",
        title: "高額ポイントを狙える",
        text: "証券口座案件はポイ活でも高単価になりやすいジャンルです。",
      },
      {
        icon: "✅",
        title: "長期的に使いやすい",
        text: "口座開設後も投資やポイント活用で継続利用しやすいです。",
      },
      {
        icon: "🏆",
        title: "楽天経済圏と相性",
        text: "楽天ポイントや楽天サービスとの親和性が高い点が特徴です。",
      },
    ],
  },
];

export function generateStaticParams() {
  return offers.map((offer) => ({
    slug: offer.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const offer = offers.find((item) => item.slug === params.slug);

  if (!offer) {
    return {
      title: "案件が見つかりません｜ポイ活AI判定",
    };
  }

  return {
    title: `${offer.name}のポイ活案件をAI判定｜ポイ活AI判定`,
    description: `${offer.name}のポイ活案件をAIが分析。Googleトレンド、注目ワード、おすすめ理由、モッピーで探す導線をまとめています。`,
    alternates: {
      canonical: `https://poikatu-ai.vercel.app/offers/${offer.slug}`,
    },
    openGraph: {
      title: `${offer.name}のポイ活案件をAI判定`,
      description: offer.description,
      url: `https://poikatu-ai.vercel.app/offers/${offer.slug}`,
      siteName: "ポイ活AI判定",
      locale: "ja_JP",
      type: "article",
    },
  };
}

export default function OfferPage({ params }: { params: { slug: string } }) {
  const offer = offers.find((item) => item.slug === params.slug);

  if (!offer) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#fff8fb] px-4 py-6 text-slate-900 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-5 text-sm font-bold text-slate-500">
          <Link href="/" className="hover:text-pink-500">
            ホーム
          </Link>
          <span className="mx-2">›</span>
          <span>{offer.category}</span>
          <span className="mx-2">›</span>
          <span className="text-slate-800">{offer.name}</span>
        </nav>

        <section className="rounded-[2rem] bg-white p-6 shadow-lg ring-1 ring-pink-100 lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex rounded-full bg-pink-500 px-5 py-2 text-sm font-black text-white">
                {offer.category}
              </div>

              <h1 className="text-4xl font-black leading-tight tracking-tight lg:text-6xl">
                {offer.name}
              </h1>

              <p className="mt-5 text-xl font-black text-pink-500">
                AI注目ワード：{offer.keyword}
              </p>

              <p className="mt-5 text-base font-bold leading-8 text-slate-700 lg:text-lg">
                {offer.description}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-pink-50 p-4">
                  <p className="text-xs font-black text-slate-500">AI総合評価</p>
                  <p className="mt-1 text-3xl font-black text-pink-500">
                    {offer.score}
                    <span className="text-sm text-slate-500"> /100</span>
                  </p>
                </div>

                <div className="rounded-2xl bg-pink-50 p-4">
                  <p className="text-xs font-black text-slate-500">更新日</p>
                  <p className="mt-1 text-2xl font-black text-slate-800">
                    毎日更新
                  </p>
                </div>

                <div className="rounded-2xl bg-pink-50 p-4">
                  <p className="text-xs font-black text-slate-500">データ更新</p>
                  <p className="mt-1 text-2xl font-black text-slate-800">
                    毎日0:00
                  </p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-pink-500 via-pink-400 to-orange-400 p-8 text-white shadow-xl">
              <div className="absolute right-6 top-6 rounded-full bg-yellow-100 px-5 py-4 text-center text-lg font-black text-pink-600 shadow-lg">
                ポイ活で
                <br />
                高額還元中！
              </div>

              <p className="text-2xl font-black opacity-90">AI分析中</p>
              <p className="mt-8 text-5xl font-black leading-tight">
                {offer.name}
              </p>
              <p className="mt-6 text-3xl font-black">
                今チェックしたい
                <br />
                注目案件
              </p>
              <div className="mt-10 rounded-2xl bg-white/20 p-5 text-xl font-black backdrop-blur">
                Googleトレンド × 案件特性 × 初心者向け度
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-lg ring-1 ring-pink-100 lg:p-8">
          <h2 className="text-3xl font-black">🤖 AIが評価した理由</h2>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {offer.aiReasons.map((reason) => (
              <div
                key={reason.title}
                className="rounded-2xl bg-pink-50 p-6 text-center"
              >
                <div className="text-5xl">{reason.icon}</div>
                <h3 className="mt-4 text-2xl font-black">{reason.title}</h3>
                <p className="mt-3 font-bold leading-7 text-slate-600">
                  {reason.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-lg ring-1 ring-pink-100 lg:p-8">
          <h2 className="text-3xl font-black">Googleトレンド分析</h2>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-pink-100 bg-white p-5">
              <h3 className="font-black">検索人気の推移イメージ</h3>

              <div className="mt-5 h-56 rounded-2xl bg-gradient-to-t from-pink-100 to-white p-5">
                <div className="flex h-full items-end gap-3">
                  {[20, 28, 35, 38, 44, 52, 64, 70, 76, 83, 92, 78].map(
                    (height, index) => (
                      <div
                        key={index}
                        className="flex-1 rounded-t-xl bg-pink-400"
                        style={{ height: `${height}%` }}
                      />
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-pink-100 bg-white p-5">
              <h3 className="font-black">関連キーワード</h3>

              <div className="mt-5 flex flex-wrap gap-3">
                {offer.trendKeywords.map((keyword, index) => (
                  <span
                    key={keyword}
                    className="rounded-full bg-pink-50 px-4 py-2 text-sm font-black text-pink-500"
                  >
                    {keyword}
                    <span className="ml-2 rounded-full bg-pink-500 px-2 py-1 text-xs text-white">
                      {100 - index * 7}
                    </span>
                  </span>
                ))}
              </div>

              <p className="mt-5 text-sm font-bold text-slate-500">
                ※ Googleトレンドや検索需要をもとにAIが分析しています。
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-lg ring-1 ring-pink-100 lg:p-8">
          <h2 className="text-3xl font-black">👍 おすすめ理由</h2>

          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            {offer.recommendReasons.map((reason) => (
              <div
                key={reason.title}
                className="rounded-2xl bg-pink-50 p-5 text-center"
              >
                <div className="text-5xl">{reason.icon}</div>
                <h3 className="mt-4 text-lg font-black">{reason.title}</h3>
                <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
                  {reason.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] bg-gradient-to-r from-pink-50 to-orange-50 p-6 text-center shadow-lg ring-1 ring-pink-100 lg:p-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-3 inline-flex rounded-full bg-pink-500 px-5 py-2 text-sm font-black text-white">
              今すぐポイ活を始めよう！
            </div>

            <h2 className="text-3xl font-black lg:text-4xl">
              {offer.name}の案件をチェック
            </h2>

            <p className="mt-3 font-bold text-pink-500">
              高額ポイントをもらうチャンスをお見逃しなく！
            </p>

            <a
              href={MOPPY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-auto mt-6 flex h-16 max-w-xl items-center justify-center rounded-2xl bg-gradient-to-r from-pink-500 to-orange-500 px-6 text-xl font-black text-white shadow-xl transition hover:scale-105"
            >
              モッピーで探す
              <span className="ml-3 text-4xl leading-none">›</span>
            </a>

            <p className="mt-3 text-xs font-bold text-slate-400">
              ※ 上記ボタンからポイントサイト「モッピー」に遷移します。
            </p>
          </div>
        </section>

        <p className="mt-6 text-center text-xs font-bold text-slate-400">
          ※ 本ページの情報はAIによる分析結果をもとに作成されています。実際のポイント数や条件は各ポイントサイトでご確認ください。
        </p>
      </div>
    </main>
  );
}
