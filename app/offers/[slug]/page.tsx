type Offer = {
  title: string;
  slug: string;
  category: string;
  reward: string;
  description: string;
  aiReason: string;
  trend: string;
};

const MOPPY_URL =
  "https://pc.moppy.jp/entry/invite.php?invite=ut3GA1ce&openExternalBrowser=1";

const offers: Offer[] = [
  {
    title: "楽天モバイル",
    slug: "rakuten-mobile",
    category: "通信・回線",
    reward: "高額還元を狙える",
    description:
      "楽天モバイルは、通信費の見直し需要が高く、乗り換えや新規契約でポイント獲得を狙いやすい案件です。",
    aiReason:
      "通信費削減ニーズ、検索需要、キャンペーン注目度を総合し、AIが高評価と判定しています。",
    trend: "楽天モバイル、キャンペーン、乗り換え関連の検索需要が高い案件です。",
  },
  {
    title: "信長の野望 覇道",
    slug: "nobunaga-hadou",
    category: "アプリ・ゲーム",
    reward: "条件達成型ポイント",
    description:
      "信長の野望 覇道は、ゲーム案件の中でも話題性があり、条件達成型のポイ活と相性が良い案件です。",
    aiReason:
      "ゲームタイトルの話題性、検索需要、短期達成のしやすさをAIが評価しています。",
    trend: "信長の野望、覇道、攻略関連の検索が見られる案件です。",
  },
  {
    title: "三井住友カード（NL）",
    slug: "smbc-card-nl",
    category: "クレジットカード",
    reward: "高額還元を狙える",
    description:
      "三井住友カード（NL）は、知名度と使いやすさのバランスが良いクレジットカード案件です。",
    aiReason:
      "高還元性、申込需要、初心者の検討しやすさをAIが総合評価しています。",
    trend: "三井住友カード、NL、キャンペーン関連の検索需要があります。",
  },
  {
    title: "PayPayカード",
    slug: "paypay-card",
    category: "クレジットカード",
    reward: "高額還元を狙える",
    description:
      "PayPayカードは、キャッシュレス利用者と相性が良く、日常利用も考えやすいカード案件です。",
    aiReason:
      "PayPay経済圏との相性、申込需要、還元期待値をAIが評価しています。",
    trend: "PayPayカード、キャンペーン、ポイント関連の検索が強い案件です。",
  },
  {
    title: "TikTok Lite",
    slug: "tiktok-lite",
    category: "アプリ・ゲーム",
    reward: "短期達成型ポイント",
    description:
      "TikTok Liteは、スマホだけで始めやすく、アプリ利用系のポイ活案件として人気があります。",
    aiReason:
      "SNS話題性、参加しやすさ、短期達成のしやすさをAIが高く評価しています。",
    trend: "TikTok Lite、ポイント、招待、キャンペーン関連の検索需要があります。",
  },
  {
    title: "楽天証券",
    slug: "rakuten-sec",
    category: "証券・投資",
    reward: "高額ポイントを狙える",
    description:
      "楽天証券は、NISAや資産形成への関心と相性が良い証券口座案件です。",
    aiReason:
      "投資需要、口座開設需要、還元期待値をAIが総合して評価しています。",
    trend: "楽天証券、NISA、口座開設関連の検索需要が高い案件です。",
  },
  {
    title: "楽天市場",
    slug: "rakuten-market",
    category: "ショッピング",
    reward: "買い物でポイント",
    description:
      "楽天市場は、日常の買い物とポイ活を組み合わせやすいショッピング案件です。",
    aiReason:
      "利用頻度の高さ、検索需要、ポイント還元との相性をAIが評価しています。",
    trend: "楽天市場、セール、ポイントアップ関連の検索需要があります。",
  },
  {
    title: "住信SBIネット銀行",
    slug: "sbi-sumishin-bank",
    category: "銀行・口座",
    reward: "口座開設ポイント",
    description:
      "住信SBIネット銀行は、口座開設系ポイ活として検討しやすい銀行案件です。",
    aiReason:
      "口座開設需要、金融系案件の安定性、初心者の検討しやすさをAIが評価しています。",
    trend: "住信SBIネット銀行、口座開設、キャンペーン関連の検索があります。",
  },
  {
    title: "Amazon Prime",
    slug: "amazon-prime",
    category: "サブスク",
    reward: "サブスク案件",
    description:
      "Amazon Primeは、動画・配送特典など日常利用と相性が良いサブスク案件です。",
    aiReason:
      "認知度の高さ、利用ニーズ、登録しやすさをAIが評価しています。",
    trend: "Amazon Prime、無料体験、キャンペーン関連の検索需要があります。",
  },
  {
    title: "マージマンション",
    slug: "merge-mansion",
    category: "アプリ・ゲーム",
    reward: "条件達成型ポイント",
    description:
      "マージマンションは、ゲーム条件達成型のポイ活案件として人気があります。",
    aiReason:
      "ゲーム案件としての継続性、検索需要、達成条件との相性をAIが評価しています。",
    trend: "マージマンション、攻略、レベル達成関連の検索があります。",
  },
  {
    title: "U-NEXT",
    slug: "u-next",
    category: "サブスク",
    reward: "動画サービス案件",
    description:
      "U-NEXTは、動画配信サービスの中でも知名度が高く、サブスク案件として人気があります。",
    aiReason:
      "動画需要、無料体験ニーズ、登録しやすさをAIが評価しています。",
    trend: "U-NEXT、無料トライアル、映画、ドラマ関連の検索需要があります。",
  },
  {
    title: "dカード GOLD",
    slug: "d-card-gold",
    category: "クレジットカード",
    reward: "高額還元を狙える",
    description:
      "dカード GOLDは、ドコモ利用者との相性が良い高額クレジットカード案件です。",
    aiReason:
      "通信系ユーザーとの相性、高還元性、カード需要をAIが評価しています。",
    trend: "dカード GOLD、ドコモ、キャンペーン関連の検索があります。",
  },
  {
    title: "セゾンカードインターナショナル",
    slug: "saison-card-international",
    category: "クレジットカード",
    reward: "カード申込ポイント",
    description:
      "セゾンカードインターナショナルは、カード案件として比較検討しやすい案件です。",
    aiReason:
      "カード申込需要、初心者の検討しやすさ、還元期待値をAIが評価しています。",
    trend: "セゾンカード、インターナショナル、キャンペーン関連の検索があります。",
  },
  {
    title: "auカブコム証券",
    slug: "au-kabucom-sec",
    category: "証券・投資",
    reward: "口座開設ポイント",
    description:
      "auカブコム証券は、投資や資産形成に関心があるユーザー向けの証券案件です。",
    aiReason:
      "投資需要、口座開設需要、高額ポイントとの相性をAIが評価しています。",
    trend: "auカブコム証券、NISA、口座開設関連の検索があります。",
  },
  {
    title: "Pontaパス",
    slug: "ponta-pass",
    category: "サブスク",
    reward: "サブスク案件",
    description:
      "Pontaパスは、Ponta経済圏と相性が良いサブスク系ポイ活案件です。",
    aiReason:
      "ポイント経済圏との相性、登録しやすさ、話題性をAIが評価しています。",
    trend: "Pontaパス、キャンペーン、ポイント関連の検索があります。",
  },
  {
    title: "メルカリ",
    slug: "mercari",
    category: "アプリ・ゲーム",
    reward: "アプリ案件",
    description:
      "メルカリは、フリマアプリとして知名度が高く、アプリ案件として取り組みやすい案件です。",
    aiReason:
      "認知度、利用者数、アプリ登録のしやすさをAIが評価しています。",
    trend: "メルカリ、招待、ポイント、キャンペーン関連の検索があります。",
  },
  {
    title: "LINEマンガ",
    slug: "line-manga",
    category: "アプリ・ゲーム",
    reward: "アプリ案件",
    description:
      "LINEマンガは、漫画アプリ利用者と相性が良いアプリ系ポイ活案件です。",
    aiReason:
      "アプリ需要、漫画コンテンツの人気、登録しやすさをAIが評価しています。",
    trend: "LINEマンガ、無料、キャンペーン関連の検索があります。",
  },
  {
    title: "エポスカード",
    slug: "epos-card",
    category: "クレジットカード",
    reward: "カード申込ポイント",
    description:
      "エポスカードは、知名度が高く、初心者にも検討しやすいクレジットカード案件です。",
    aiReason:
      "カード需要、申込しやすさ、還元期待値をAIが評価しています。",
    trend: "エポスカード、キャンペーン、審査関連の検索があります。",
  },
  {
    title: "マネックス証券",
    slug: "monex-sec",
    category: "証券・投資",
    reward: "口座開設ポイント",
    description:
      "マネックス証券は、投資初心者やNISA関心層と相性が良い証券案件です。",
    aiReason:
      "資産形成需要、口座開設ニーズ、証券案件の高還元性をAIが評価しています。",
    trend: "マネックス証券、NISA、口座開設関連の検索があります。",
  },
  {
    title: "イオンカード（WAON一体型）",
    slug: "aeon-card-waon",
    category: "クレジットカード",
    reward: "カード申込ポイント",
    description:
      "イオンカード（WAON一体型）は、日常買い物と相性が良いカード案件です。",
    aiReason:
      "日常利用との相性、カード需要、ポイント経済圏をAIが評価しています。",
    trend: "イオンカード、WAON、キャンペーン関連の検索があります。",
  },
  {
    title: "ahamo",
    slug: "ahamo",
    category: "通信・回線",
    reward: "通信系案件",
    description:
      "ahamoは、スマホ料金見直しニーズと相性が良い通信系案件です。",
    aiReason:
      "通信費削減ニーズ、乗り換え需要、申込しやすさをAIが評価しています。",
    trend: "ahamo、乗り換え、キャンペーン関連の検索があります。",
  },
  {
    title: "YouTube Premium",
    slug: "youtube-premium",
    category: "サブスク",
    reward: "サブスク案件",
    description:
      "YouTube Premiumは、動画視聴ニーズと相性が良いサブスク案件です。",
    aiReason:
      "動画需要、認知度、登録しやすさをAIが評価しています。",
    trend: "YouTube Premium、無料体験、料金関連の検索があります。",
  },
  {
    title: "マイナポイント（申請支援）",
    slug: "mynapoint-support",
    category: "サービス",
    reward: "申請支援案件",
    description:
      "マイナポイント（申請支援）は、申請ニーズと相性が良いサービス案件です。",
    aiReason:
      "行政系キーワードの検索需要、申請支援ニーズ、参加しやすさをAIが評価しています。",
    trend: "マイナポイント、申請、マイナンバー関連の検索があります。",
  },
  {
    title: "d払い",
    slug: "dbarai",
    category: "アプリ・ゲーム",
    reward: "決済アプリ案件",
    description:
      "d払いは、キャッシュレス決済利用者と相性が良いアプリ案件です。",
    aiReason:
      "決済アプリ需要、利用頻度、キャンペーン相性をAIが評価しています。",
    trend: "d払い、キャンペーン、ポイント関連の検索があります。",
  },
  {
    title: "ヤフーカード",
    slug: "yahoo-card",
    category: "クレジットカード",
    reward: "カード申込ポイント",
    description:
      "ヤフーカードは、Yahoo系サービス利用者と相性が良いカード案件です。",
    aiReason:
      "カード需要、経済圏との相性、還元期待値をAIが評価しています。",
    trend: "ヤフーカード、PayPay、キャンペーン関連の検索があります。",
  },
  {
    title: "ソニー銀行",
    slug: "sony-bank",
    category: "銀行・口座",
    reward: "口座開設ポイント",
    description:
      "ソニー銀行は、銀行口座開設系のポイ活案件として検討しやすい案件です。",
    aiReason:
      "口座開設需要、金融系案件の安定性、申込しやすさをAIが評価しています。",
    trend: "ソニー銀行、口座開設、キャンペーン関連の検索があります。",
  },
  {
    title: "七つの大罪 光と闇の交戦",
    slug: "nanatsu-grand-cross",
    category: "アプリ・ゲーム",
    reward: "ゲーム案件",
    description:
      "七つの大罪 光と闇の交戦は、人気アニメIPと相性が良いゲーム案件です。",
    aiReason:
      "アニメIPの認知度、ゲーム案件としての達成条件、話題性をAIが評価しています。",
    trend: "七つの大罪、グラクロ、攻略関連の検索があります。",
  },
  {
    title: "ブルーロック Project: World Champion",
    slug: "bluelock-pwc",
    category: "アプリ・ゲーム",
    reward: "ゲーム案件",
    description:
      "ブルーロック Project: World Championは、人気作品と連動したゲーム系ポイ活案件です。",
    aiReason:
      "作品人気、ゲーム案件の話題性、検索需要をAIが評価しています。",
    trend: "ブルーロック、PWC、攻略関連の検索があります。",
  },
  {
    title: "トリマ",
    slug: "trima",
    category: "アプリ・ゲーム",
    reward: "移動系アプリ案件",
    description:
      "トリマは、歩数や移動と相性が良いアプリ系ポイ活案件です。",
    aiReason:
      "日常利用のしやすさ、アプリ需要、継続利用性をAIが評価しています。",
    trend: "トリマ、ポイント、歩数アプリ関連の検索があります。",
  },
  {
    title: "Visa LINE Payクレジットカード",
    slug: "visa-line-pay-card",
    category: "クレジットカード",
    reward: "カード申込ポイント",
    description:
      "Visa LINE Payクレジットカードは、LINE系サービス利用者と相性が良いカード案件です。",
    aiReason:
      "カード需要、LINE利用者との相性、還元期待値をAIが評価しています。",
    trend: "Visa LINE Payカード、キャンペーン、ポイント関連の検索があります。",
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
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const offer = offers.find((item) => item.slug === slug);

  if (!offer) {
    return {
      title: "案件が見つかりません｜ポイ活AI判定",
      description:
        "ポイ活AI判定で掲載中の案件ページです。現在この案件は見つかりませんでした。",
      alternates: {
        canonical: "https://poikatu-ai.vercel.app/offers",
      },
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const title = `【2026年最新】${offer.title}はポイ活で稼げる？｜AIおすすめ度・還元比較`;

  const description =
    `${offer.title}のポイ活案件をAI分析。` +
    `${offer.category}ジャンルの注目案件として、` +
    `おすすめ理由・話題性・Googleトレンド・ポイント獲得の魅力を詳しく解説しています。`;

  const url = `https://poikatu-ai.vercel.app/offers/${offer.slug}`;

  return {
    title,
    description,
    keywords: [
      `${offer.title} ポイ活`,
      `${offer.title} モッピー`,
      `${offer.title} ポイントサイト`,
      `${offer.title} 案件`,
      `${offer.title} 還元`,
      `${offer.category} ポイ活`,
      "ポイ活",
      "モッピー",
      "ポイントサイト",
      "AI判定",
    ],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "ポイ活AI判定",
      locale: "ja_JP",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function OfferPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const offer = offers.find((item) => item.slug === slug);

  if (!offer) {
    return (
      <main className="min-h-screen bg-[#fff8fb] px-4 py-20 text-center">
        <h1 className="text-3xl font-black">ページが見つかりません</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fff8fb] px-4 py-6 text-slate-900 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-5 text-sm font-bold text-slate-500">
          <a href="/" className="hover:text-pink-500">
            ホーム
          </a>
          <span className="mx-2">›</span>
          <span>{offer.category}</span>
          <span className="mx-2">›</span>
          <span className="text-slate-800">{offer.title}</span>
        </nav>

        <section className="rounded-[2rem] bg-white p-6 shadow-lg ring-1 ring-pink-100 lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex rounded-full bg-pink-500 px-5 py-2 text-sm font-black text-white">
                {offer.category}
              </div>

              <h1 className="text-4xl font-black leading-tight tracking-tight lg:text-6xl">
                {offer.title}
              </h1>

              <p className="mt-5 text-xl font-black text-pink-500">
                AI注目ワード：{offer.title}
              </p>

              <p className="mt-5 text-base font-bold leading-8 text-slate-700 lg:text-lg">
                {offer.description}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-pink-50 p-4">
                  <p className="text-xs font-black text-slate-500">AI評価</p>
                  <p className="mt-1 text-2xl font-black text-pink-500">
                    注目案件
                  </p>
                </div>

                <div className="rounded-2xl bg-pink-50 p-4">
                  <p className="text-xs font-black text-slate-500">更新頻度</p>
                  <p className="mt-1 text-2xl font-black text-slate-800">
                    毎日更新
                  </p>
                </div>

                <div className="rounded-2xl bg-pink-50 p-4">
                  <p className="text-xs font-black text-slate-500">
                    データ更新
                  </p>
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
                注目中！
              </div>

              <p className="text-2xl font-black opacity-90">AI分析中</p>
              <p className="mt-8 text-5xl font-black leading-tight">
                {offer.title}
              </p>
              <p className="mt-6 text-3xl font-black">
                今チェックしたい
                <br />
                ポイ活案件
              </p>
              <div className="mt-10 rounded-2xl bg-white/20 p-5 text-xl font-black backdrop-blur">
                Googleトレンド × 案件特性 × 初心者向け度
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-lg ring-1 ring-pink-100 lg:p-8">
          <h2 className="text-3xl font-black">🤖 AIが評価した理由</h2>

          <div className="mt-6 rounded-2xl bg-pink-50 p-6">
            <p className="text-lg font-bold leading-8 text-slate-700">
              {offer.aiReason}
            </p>
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
              <h3 className="font-black">関連検索・注目ポイント</h3>

              <p className="mt-5 text-lg font-bold leading-8 text-slate-700">
                {offer.trend}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-lg ring-1 ring-pink-100 lg:p-8">
          <h2 className="text-3xl font-black">👍 おすすめ理由</h2>

          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            {[
              ["📈", "話題性", "検索需要や注目度が高い案件です。"],
              ["🎁", "ポイ活向き", "ポイント獲得との相性が良い案件です。"],
              ["✅", "初心者向け", "初めてでも比較しやすい案件です。"],
              ["🔥", "今チェック", "ランキング内でも注目度の高い案件です。"],
            ].map(([icon, title, text]) => (
              <div
                key={title}
                className="rounded-2xl bg-pink-50 p-5 text-center"
              >
                <div className="text-5xl">{icon}</div>
                <h3 className="mt-4 text-lg font-black">{title}</h3>
                <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
                  {text}
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
              {offer.title}の案件をチェック
            </h2>

            <p className="mt-3 font-bold text-pink-500">
              モッピーで高還元案件をチェックしてみましょう。
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
