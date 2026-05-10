return (
  <>
    {/* JSON-LD */}
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "ポイ活AI判定",
          url: "https://poikatu-ai.vercel.app",
          description:
            "Googleトレンド・検索動向・SNS話題度をAI分析し、初心者向けのおすすめポイ活案件を毎日ランキング化。",
        }),
      }}
    />

    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "ポイ活おすすめランキング",
          itemListElement: items.slice(0, 30).map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name:
              item.offer_name ||
              item.trend_keyword ||
              item.category,
            url: "https://poikatu-ai.vercel.app",
            description: item.reason,
          })),
        }),
      }}
    />

    <div className="min-h-screen bg-[#fff8fb]">
      {/* HERO */}
      <header className="overflow-hidden bg-gradient-to-r from-[#FFF2F7] via-[#FFF8FA] to-[#FFF4F7]">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-10 px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-12">
          <div className="w-full lg:w-[680px]">
            <div className="inline-flex items-center gap-3 rounded-full border-2 border-pink-300 bg-white px-6 py-3 text-base font-black text-pink-600 shadow-[0_10px_30px_rgba(236,72,153,0.18)] lg:text-xl">
              <span>🤖</span>
              <span>AIが毎日（０：００）更新！</span>
            </div>

            <h1 className="mt-8 text-[54px] font-black leading-[0.95] tracking-[-0.05em] text-pink-600 drop-shadow-[0_5px_0_rgba(255,255,255,0.9)] lg:text-[96px]">
              ポイ活
              <span className="bg-gradient-to-b from-yellow-300 to-orange-500 bg-clip-text text-transparent">
                AI
              </span>
              判定
            </h1>

            <div className="mt-8 text-[20px] font-black leading-[1.9] text-[#27313f] lg:text-[28px]">
              <p>
                <span className="text-pink-600">
                  「Googleでの話題度」
                </span>
                のデータを中心に、初心者向けのポイ活をAIが判定し、
                <span className="text-pink-600">
                  毎日（０：００）
                </span>
                にランキング反映しています。
              </p>
            </div>

            <div className="mt-8">
              <div className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-black text-slate-500 shadow-lg ring-1 ring-slate-100">
                最終更新：
                <span className="ml-2 text-base text-slate-600">
                  {updatedAt}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[720px]">
            <Image
              src="/hero.png.png"
              alt="ポイ活AI判定"
              width={1200}
              height={900}
              className="h-auto w-full rounded-[2rem] shadow-[0_35px_80px_rgba(31,41,55,0.18)]"
              priority
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-8 lg:px-8 lg:py-10">
        {/* TREND SECTION */}
        <section className="mb-10 rounded-[2rem] bg-white p-5 shadow-lg ring-1 ring-pink-100 lg:p-8">
          <div className="mb-6">
            <p className="text-sm font-black text-pink-500">
              Googleトレンド分析
            </p>

            <h2 className="text-3xl font-black text-slate-800 lg:text-4xl">
              🔍 ただいまGoogleで話題のポイ活関連キーワード
            </h2>
          </div>

          <div className="rounded-[1.5rem] bg-gradient-to-br from-pink-50 via-white to-orange-50 p-5 lg:p-7">
            <div className="flex flex-wrap items-center gap-3">
              {trendTags.map((tag) => (
                <div
                  key={tag.word}
                  className={`flex items-center rounded-full font-black shadow-sm transition hover:scale-105 ${
                    tag.score >= 90
                      ? "bg-gradient-to-r from-pink-500 to-orange-400 px-6 py-3 text-xl text-white"
                      : tag.score >= 80
                      ? "bg-pink-100 px-5 py-3 text-lg text-pink-600"
                      : tag.score >= 70
                      ? "bg-orange-100 px-5 py-2.5 text-lg text-orange-600"
                      : tag.score >= 60
                      ? "bg-yellow-50 px-4 py-2 text-base text-orange-500"
                      : "bg-slate-100 px-4 py-2 text-sm text-slate-600"
                  }`}
                >
                  <span>{tag.word}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RANKING TITLE */}
        <div className="mb-6 flex items-center gap-3">
          <span className="text-4xl">🔥</span>

          <h2 className="text-3xl font-black text-slate-900 lg:text-5xl">
            ただいまのポイ活おすすめランキング
          </h2>
        </div>

        {/* RANKINGS */}
        <div className="space-y-4">
          {items.map((item, index) => {
            const reasons = getAiReasons(item);

            return (
              <article
                key={`${item.rank}-${item.offer_name}-${index}`}
                className="rounded-[2rem] bg-white p-4 shadow-lg ring-1 ring-pink-100 lg:p-6"
              >
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[120px_1.4fr_1.2fr_250px] lg:items-center">
                  {/* RANK */}
                  <div className="flex items-center justify-center">
                    <div
                      className={`flex items-center justify-center rounded-full font-black text-white shadow-lg ${
                        index === 0
                          ? "h-24 w-24 bg-gradient-to-br from-yellow-300 to-amber-500 text-5xl"
                          : index === 1
                          ? "h-24 w-24 bg-gradient-to-br from-slate-300 to-slate-500 text-5xl"
                          : index === 2
                          ? "h-24 w-24 bg-gradient-to-br from-orange-400 to-orange-700 text-5xl"
                          : "h-16 w-16 bg-gradient-to-br from-pink-400 to-pink-500 text-3xl"
                      }`}
                    >
                      {index + 1}
                    </div>
                  </div>

                  {/* INFO */}
                  <div>
                    <div className="mb-2 inline-flex rounded-full bg-pink-50 px-3 py-1 text-xs font-black text-pink-500">
                      {item.category}
                    </div>

                    <h3
                      className={`font-black leading-tight text-slate-900 ${
                        index < 3
                          ? "text-3xl lg:text-5xl"
                          : "text-2xl lg:text-3xl"
                      }`}
                    >
                      {getOfferName(item)}
                    </h3>

                    <p className="mt-2 text-sm font-bold text-pink-500 lg:text-base">
                      AI注目ワード：{item.trend_keyword}
                    </p>

                    <p className="mt-3 text-sm leading-relaxed text-slate-600 lg:text-base">
                      {item.reason}
                    </p>
                  </div>

                  {/* AI REASONS */}
                  <div>
                    <div className="mb-3 text-center text-sm font-black text-pink-500">
                      ー AIが評価した理由 ー
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {reasons.map((reason) => (
                        <div
                          key={reason.title}
                          className="rounded-2xl bg-pink-50/70 px-3 py-3 text-center"
                        >
                          <div className="text-3xl">{reason.icon}</div>

                          <div className="mt-1 text-sm font-black text-slate-900">
                            {reason.title}
                          </div>

                          <div className="mt-1 text-xs font-bold leading-snug text-slate-600">
                            {reason.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* BUTTONS */}
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() =>
                        trackClick(
                          item.category,
                          item.primary_site_name,
                          item.primary_site_url
                        )
                      }
                      className="flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-pink-500 to-orange-500 px-5 text-base font-black text-white shadow-lg transition hover:scale-105"
                    >
                      {item.primary_site_name}で探す
                    </button>

                    {item.secondary_site_name &&
                      item.secondary_site_url && (
                        <button
                          onClick={() =>
                            trackClick(
                              item.category,
                              item.secondary_site_name!,
                              item.secondary_site_url!
                            )
                          }
                          className="flex h-14 items-center justify-center rounded-2xl border-2 border-orange-200 bg-white px-5 text-base font-black text-orange-500 transition hover:scale-105"
                        >
                          {item.secondary_site_name}も見る
                        </button>
                      )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  </>
);
