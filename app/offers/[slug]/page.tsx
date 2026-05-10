type Offer = {
  title: string;
  slug: string;
  category: string;
  reward: string;
  image: string;
  description: string;
  aiReason: string;
  trend: string;
};

const offers: Offer[] = [
  {
    title: "楽天モバイル",
    slug: "rakuten-mobile",
    category: "通信",
    reward: "最大20,000P",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/7/7a/Rakuten_Mobile_logo.svg",
    description:
      "楽天モバイルは高額ポイント還元が継続している人気案件です。契約条件が比較的シンプルで、初心者でも取り組みやすいのが特徴です。",
    aiReason:
      "Google検索数とSNS話題度が大幅上昇。通信費節約ニーズとも一致し、AI評価が急上昇しています。",
    trend: "『楽天モバイル キャンペーン』検索急増中",
  },
  {
    title: "TikTok Lite",
    slug: "tiktok-lite",
    category: "アプリ・ゲーム",
    reward: "最大5,000P",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/a/a9/TikTok_logo.svg",
    description:
      "TikTok Liteは短期間でポイント獲得を狙える案件として人気です。SNSとの相性も非常に高いです。",
    aiReason:
      "SNS拡散量が非常に高く、検索トレンドでも急上昇。短期達成型としてAIが高評価。",
    trend: "『TikTok Lite ポイント』急上昇",
  },
  {
    title: "PayPayカード",
    slug: "paypay-card",
    category: "クレジットカード",
    reward: "最大8,000P",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/4/41/PayPay_logo.svg",
    description:
      "PayPayカードは安定して人気が高い高額案件です。PayPay経済圏との相性も抜群です。",
    aiReason:
      "PayPay関連検索が継続上昇。初心者申込率も高く、成果期待値が高い案件です。",
    trend: "『PayPayカード キャンペーン』上昇中",
  },
  {
    title: "三井住友カード（NL）",
    slug: "smbc-card-nl",
    category: "クレジットカード",
    reward: "最大10,000P",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/4/40/Sumitomo_Mitsui_Banking_Corporation_logo.svg",
    description:
      "三井住友カード（NL）はナンバーレス対応で人気の高いカード案件です。",
    aiReason:
      "クレカ系検索トレンドで強く、申込単価・承認率のバランスが優秀。",
    trend: "『NLカード 安全性』検索増加",
  },
  {
    title: "楽天証券",
    slug: "rakuten-sec",
    category: "証券",
    reward: "最大10,000P",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/6/62/Rakuten_logo.svg",
    description:
      "楽天証券は新NISA需要で口座開設数が急増しています。",
    aiReason:
      "投資系キーワードがGoogleトレンドで急伸。高額案件としてAIが注目。",
    trend: "『新NISA 楽天証券』急上昇",
  },
];

export default async function OfferPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const offer = offers.find((o) => o.slug === slug);

  if (!offer) {
    return (
      <div className="p-10 text-center text-2xl font-bold">
        ページが見つかりません
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#fff8fb] px-4 py-10">
      <div className="mx-auto max-w-5xl">
        {/* パンくず */}
        <div className="mb-6 text-sm font-bold text-pink-500">
          ポイ活AI判定 ＞ {offer.title}
        </div>

        {/* メインカード */}
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-pink-100">
          {/* ヘッダー */}
          <div className="bg-gradient-to-r from-pink-500 to-orange-400 px-8 py-10 text-white">
            <div className="mb-4 inline-flex rounded-full bg-white/20 px-4 py-1 text-sm font-black">
              {offer.category}
            </div>

            <h1 className="text-4xl font-black leading-tight lg:text-6xl">
              {offer.title}
            </h1>

            <p className="mt-4 text-lg font-bold text-pink-50">
              {offer.trend}
            </p>
          </div>

          {/* 本文 */}
          <div className="grid gap-8 p-8 lg:grid-cols-[1.2fr_360px]">
            {/* 左 */}
            <div>
              <div className="mb-8">
                <h2 className="mb-3 text-2xl font-black text-slate-900">
                  案件説明
                </h2>

                <p className="text-lg leading-relaxed text-slate-700">
                  {offer.description}
                </p>
              </div>

              <div className="mb-8 rounded-[1.5rem] bg-pink-50 p-6">
                <div className="mb-3 text-xl font-black text-pink-600">
                  🤖 AI評価理由
                </div>

                <p className="text-lg leading-relaxed text-slate-700">
                  {offer.aiReason}
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-orange-50 p-6">
                <div className="mb-3 text-xl font-black text-orange-500">
                  🔥 Googleトレンド
                </div>

                <p className="text-lg font-bold text-slate-700">
                  {offer.trend}
                </p>
              </div>
            </div>

            {/* 右 */}
            <div>
              <div className="sticky top-6 rounded-[2rem] bg-gradient-to-b from-white to-pink-50 p-6 shadow-lg ring-1 ring-pink-100">
                <div className="mb-6 text-center">
                  <div className="mb-2 text-sm font-black text-pink-500">
                    獲得ポイント
                  </div>

                  <div className="text-5xl font-black text-pink-600">
                    {offer.reward}
                  </div>
                </div>

                <a
                  href="https://pc.moppy.jp/entry/invite.php?invite=ut3GA1ce&openExternalBrowser=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-20 w-full items-center justify-center rounded-[1.5rem] bg-gradient-to-r from-pink-500 to-orange-500 text-center text-2xl font-black text-white shadow-xl transition hover:scale-105"
                >
                  モッピーで見る →
                </a>

                <p className="mt-4 text-center text-xs font-bold leading-relaxed text-slate-400">
                  ※ ポイント数は変動する場合があります
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
