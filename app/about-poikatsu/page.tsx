import Link from "next/link";

const MOPPY_URL =
  "https://pc.moppy.jp/entry/invite.php?invite=ut3GA1ce&openExternalBrowser=1";

export const metadata = {
  title: "ポイ活とは？初心者向けに仕組みをわかりやすく解説｜ポイ活AI判定",
  description:
    "ポイ活とは何かを初心者向けに解説。ポイントサイトの仕組み、ポイントの貯め方、現金やPayPayなどへの交換方法、モッピーの始め方をわかりやすく紹介します。",
};

export default function AboutPoikatsuPage() {
  return (
    <main className="min-h-screen bg-[#fff8fb] px-4 py-6 text-slate-900 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-5 text-sm font-bold text-slate-500">
          <Link href="/" className="hover:text-pink-500">
            ホーム
          </Link>
          <span className="mx-2">›</span>
          <span className="text-slate-800">ポイ活とは？</span>
        </nav>

        <section className="rounded-[2rem] bg-white p-8 text-center shadow-lg ring-1 ring-pink-100 lg:p-12">
          <div className="inline-flex items-center rounded-full bg-green-50 px-7 py-3 text-lg font-black text-green-600 ring-2 ring-green-100">
            <span className="mr-2">🔰</span>
            初心者向けガイド
          </div>

          <h1 className="mt-6 text-5xl font-black leading-tight tracking-tight text-slate-900 lg:text-7xl">
            ポイ活とは？
          </h1>

          <p className="mx-auto mt-10 max-w-5xl text-2xl font-black leading-[2.1] text-slate-700 lg:text-[34px]">
            ポイ活とは、
            <span className="text-pink-500">ポイントサイト</span>
            やキャンペーンを活用して、買い物・サービス登録・アプリ利用などで
            <span className="text-orange-500">ポイントを貯める活動</span>
            です。貯めたポイントは、現金・電子マネー・ギフト券などに交換できます。
          </p>
        </section>

        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-lg ring-1 ring-pink-100 lg:p-8">
          <div className="mb-8">
            <div className="inline-flex rounded-full bg-pink-50 px-5 py-2 text-sm font-black text-pink-500">
              イラストで分かる
            </div>

            <h2 className="mt-3 text-3xl font-black lg:text-4xl">
              ポイ活の流れ
            </h2>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-center">
            {[
              ["1", "🖥️", "登録", "ポイントサイトに無料登録"],
              ["2", "📋", "案件選択", "好きな案件を選ぶ"],
              ["3", "🎯", "条件達成", "条件クリアでポイント獲得対象に"],
              ["4", "👛", "交換", "ポイントを現金やPayPayなどに交換"],
            ].map(([num, icon, title, text], index) => (
              <>
                <div
                  key={title}
                  className="relative rounded-[2rem] bg-white p-5 text-center shadow-xl ring-1 ring-pink-100"
                >
                  <div className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-orange-400 text-xl font-black text-white shadow-lg">
                    {num}
                  </div>

                  <div className="mx-auto mt-8 flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-pink-50 via-white to-orange-50 text-6xl shadow-md ring-1 ring-pink-100">
                    {icon}
                  </div>

                  <h3 className="mt-6 text-2xl font-black text-slate-900">
                    {title}
                  </h3>

                  <p className="mt-4 min-h-[56px] text-sm font-bold leading-7 text-slate-600">
                    {text}
                  </p>

                  <div className="mx-auto mt-5 h-2 w-20 rounded-full bg-gradient-to-r from-pink-500 to-orange-400" />
                </div>

                {index !== 3 && (
                  <div className="hidden h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-orange-400 text-2xl font-black text-white shadow-lg lg:flex">
                    →
                  </div>
                )}
              </>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] bg-gradient-to-br from-pink-50 via-white to-orange-50 p-8 text-center shadow-lg ring-1 ring-pink-100 lg:p-12">
          <div className="inline-flex rounded-full bg-pink-500 px-5 py-2 text-sm font-black text-white">
            ポイ活はメリットいっぱい！
          </div>

          <h2 className="mt-5 text-4xl font-black lg:text-5xl">
            モッピーでポイ活を始める
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg font-bold leading-9 text-slate-700 lg:text-xl">
            モッピーは、広告利用・アプリ利用・ショッピング利用などで簡単にポイントを貯められる大手ポイントサイトです。
            初心者にも使いやすく、まず最初にチェックしたい定番サービスです。
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

          <p className="mt-4 text-xs font-bold text-slate-400">
            ※ 会員登録は無料です。安心してご利用いただけます。
          </p>
        </section>
      </div>
    </main>
  );
}
