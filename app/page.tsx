{/* HERO */}
<header className="relative overflow-hidden bg-gradient-to-r from-pink-500 via-pink-300 to-orange-200">
  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_20%),radial-gradient(circle_at_80%_10%,white,transparent_20%),radial-gradient(circle_at_50%_80%,#fde68a,transparent_25%)]" />

  <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-10 px-6 py-10 md:flex-row">
    
    {/* LEFT */}
    <div className="w-full max-w-[520px]">
      <div className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-lg font-black text-pink-600 shadow-lg">
        🤖 AI分析中
      </div>

      <h1 className="mt-8 text-5xl font-black leading-none text-white drop-shadow-[0_5px_0_rgba(0,0,0,0.12)] md:text-7xl">
        ポイ活AI判定
      </h1>

      <p className="mt-8 text-lg font-black leading-[2.4rem] text-[#3B141B] md:text-2xl">
        いま注目すべきポイ活ジャンルを、
        <br />
        AIが毎日判定。クリックデータ・話題性・
        <br />
        報酬レンジをもとに、
        <span className="text-pink-600">
          今やるべきポイ活
        </span>
        を
        <br />
        ランキング化します。
      </p>

      {/* FEATURES */}
      <div className="mt-10 rounded-[2rem] bg-white/95 p-5 shadow-2xl backdrop-blur-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-pink-100 px-5 py-5 text-center text-base font-black text-pink-600">
            ジャンル完全自動判定
          </div>

          <div className="rounded-2xl bg-yellow-100 px-5 py-5 text-center text-base font-black text-orange-500">
            クリック計測対応
          </div>

          <div className="rounded-2xl bg-pink-100 px-5 py-5 text-center text-base font-black text-pink-600">
            主要サイトへ案内
          </div>

          <div className="rounded-2xl bg-yellow-100 px-5 py-5 text-center text-base font-black text-orange-500">
            話題性・報酬レンジ分析
          </div>
        </div>
      </div>
    </div>

    {/* RIGHT */}
    <div className="relative flex w-full max-w-2xl items-end justify-center">
      <div className="relative h-[520px] w-[620px]">

        {/* TABLET */}
        <div className="absolute left-1/2 top-6 h-[360px] w-[480px] -translate-x-1/2 rounded-[3rem] bg-[#2F3340] shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
          
          <div className="absolute left-1/2 top-8 h-[285px] w-[400px] -translate-x-1/2 overflow-hidden rounded-[2rem] bg-white">

            {/* TOP BAR */}
            <div className="flex h-12 items-center justify-between bg-yellow-300 px-6">
              <div className="flex gap-3">
                <span className="h-3 w-3 rounded-full bg-white" />
                <span className="h-3 w-3 rounded-full bg-white" />
                <span className="h-3 w-3 rounded-full bg-white" />
              </div>

              <div className="rounded-full bg-white px-4 py-1 text-xs font-black text-pink-600">
                AI分析中
              </div>
            </div>

            {/* SCREEN */}
            <div className="p-6">
              <div className="rounded-3xl bg-pink-100 px-6 py-5 text-center text-3xl font-black text-pink-600">
                今やるべきポイ活
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="rounded-3xl bg-yellow-100 py-5 text-center text-2xl font-black text-orange-500">
                  クレカ
                </div>

                <div className="rounded-3xl bg-pink-100 py-5 text-center text-2xl font-black text-pink-500">
                  証券
                </div>

                <div className="rounded-3xl bg-orange-100 py-5 text-center text-2xl font-black text-orange-500">
                  回線
                </div>
              </div>

              <div className="mt-7">
                <div className="flex items-center gap-3 text-xl font-black text-pink-600">
                  🔥 急上昇ジャンル
                </div>

                <div className="mt-4 flex gap-3">
                  <div className="h-5 w-24 rounded-full bg-pink-100" />
                  <div className="h-5 w-20 rounded-full bg-yellow-100" />
                  <div className="h-5 w-16 rounded-full bg-orange-100" />
                </div>
              </div>
            </div>
          </div>

          {/* STAND */}
          <div className="absolute bottom-[-18px] left-1/2 h-8 w-[240px] -translate-x-1/2 rounded-b-full bg-[#23262E]" />
        </div>

        {/* COINS */}
        <div className="absolute bottom-6 left-0 text-[80px]">
          🪙
        </div>

        <div className="absolute bottom-0 left-20 text-[70px]">
          🪙
        </div>

        <div className="absolute bottom-8 left-36 text-[100px]">
          🪙
        </div>

        <div className="absolute bottom-0 left-60 text-[75px]">
          🪙
        </div>

        <div className="absolute bottom-10 right-0 text-[90px]">
          🪙
        </div>

        <div className="absolute bottom-32 right-12 text-[70px]">
          🪙
        </div>

        {/* MONEY */}
        <div className="absolute bottom-0 right-16">
          <div className="relative h-28 w-44 rounded-3xl bg-pink-300 shadow-2xl">
            <div className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-yellow-100 text-4xl">
              🪙
            </div>
          </div>

          <div className="absolute bottom-[-16px] left-[-30px] h-16 w-36 rounded-2xl bg-green-200 shadow-xl">
            <div className="absolute left-1/2 top-1/2 h-5 w-full -translate-x-1/2 -translate-y-1/2 bg-white" />
          </div>
        </div>

        {/* SPARKLES */}
        <div className="absolute left-[100px] top-[280px] text-4xl">
          ✨
        </div>

        <div className="absolute right-[10px] top-[300px] text-5xl">
          ✨
        </div>

        <div className="absolute right-[120px] bottom-[100px] text-4xl">
          ✨
        </div>
      </div>
    </div>
  </div>
</header>
