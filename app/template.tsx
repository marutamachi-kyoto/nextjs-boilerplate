import Script from "next/script";

const freePoikatsuLinkScript = `
(() => {
  let moppyImagesPromise = null;
  let rankingCardsEnhancementRunning = false;

  const normalizeText = (text) => {
    return (text || "")
      .toLowerCase()
      .replace(/\u3000/g, "")
      .replace(/\s+/g, "")
      .replace(/\uff08/g, "(")
      .replace(/\uff09/g, ")")
      .replace(/[\u30fb\uff65]/g, "")
      .replace(/[\u30fc\uff70\u2212]/g, "-")
      .replace(/[\[\]\u3010\u3011!\uff01?\uff1f\u3002\u3001\u300c\u300d\u300e\u300f()\uff08\uff09]/g, "")
      .trim();
  };

  const ensureHeroButtonStyle = () => {
    if (document.getElementById("hero-nav-button-style")) return;

    const style = document.createElement("style");
    style.id = "hero-nav-button-style";
    style.textContent = [
      'header .hero-link-row { display: flex !important; flex-wrap: nowrap !important; align-items: center !important; gap: 1rem !important; width: 100% !important; margin-top: 1.1rem !important; }',
      'header a[href="/about-poikatsu"], header a[href="/free-poikatsu"] { min-height: 76px !important; padding: 1.1rem 2rem !important; border-radius: 999px !important; font-size: 1.24rem !important; line-height: 1.25 !important; font-weight: 950 !important; gap: 0.65rem !important; box-shadow: 0 16px 36px rgba(15, 23, 42, 0.10) !important; white-space: nowrap !important; }',
      'header a[href="/about-poikatsu"] span:first-child { width: 3rem !important; height: 3rem !important; margin-right: 0.65rem !important; font-size: 1.75rem !important; line-height: 1 !important; flex: 0 0 auto !important; }',
      'header a[href="/free-poikatsu"] span:first-child { width: 2.45rem !important; height: 2.45rem !important; margin-right: 0.65rem !important; font-size: 1.16rem !important; flex: 0 0 auto !important; }',
      'header a[href="/about-poikatsu"] { order: 1 !important; border-width: 3px !important; }',
      'header a[href="/free-poikatsu"] { order: 2 !important; border-width: 3px !important; }',
      '@media (min-width: 1024px) { header a[href="/about-poikatsu"], header a[href="/free-poikatsu"] { min-height: 82px !important; padding-left: 2.25rem !important; padding-right: 2.25rem !important; font-size: 1.36rem !important; } }',
      '@media (max-width: 720px) { header .hero-link-row { gap: 0.65rem !important; overflow-x: auto !important; padding-bottom: 0.25rem !important; } header a[href="/about-poikatsu"], header a[href="/free-poikatsu"] { flex: 0 0 auto !important; justify-content: center !important; min-height: 62px !important; padding: 0.85rem 1rem !important; font-size: 0.98rem !important; } header a[href="/about-poikatsu"] span:first-child { width: 2.4rem !important; height: 2.4rem !important; font-size: 1.45rem !important; } header a[href="/free-poikatsu"] span:first-child { width: 2.1rem !important; height: 2.1rem !important; font-size: 1rem !important; } }',
    ].join(String.fromCharCode(10));
    document.head.appendChild(style);
  };

  const arrangeHeroButtons = () => {
    if (window.location.pathname !== "/") return;

    const aboutLink = document.querySelector('header a[href="/about-poikatsu"]');
    const freeLink = document.querySelector('header a[href="/free-poikatsu"]');
    if (!aboutLink || !freeLink) return;

    const existingRow = aboutLink.closest('.hero-link-row');
    const controlsContainer =
      existingRow?.parentElement ||
      Array.from(document.querySelectorAll('header div')).find((element) => {
        return element.contains(aboutLink) && (element.textContent || '').includes('最終更新');
      }) ||
      aboutLink.parentElement;
    if (!controlsContainer) return;

    let row = controlsContainer.querySelector('.hero-link-row');
    if (!row) {
      row = document.createElement('div');
      row.className = 'hero-link-row';
      const updateBadge = Array.from(controlsContainer.children).find((child) => {
        return (child.textContent || '').includes('最終更新');
      });
      if (updateBadge?.nextSibling) {
        controlsContainer.insertBefore(row, updateBadge.nextSibling);
      } else {
        controlsContainer.appendChild(row);
      }
    }

    if (aboutLink.parentElement !== row) row.appendChild(aboutLink);
    if (freeLink.parentElement !== row) row.appendChild(freeLink);
  };

  const insertFreePoikatsuLink = () => {
    const aboutLink = document.querySelector('a[href="/about-poikatsu"]');
    if (!aboutLink) return;

    const existingLink = document.querySelector('a[href="/free-poikatsu"]');
    if (existingLink) {
      const label = existingLink.querySelector("span:last-child");
      if (label && label.textContent !== "無料でできるポイ活特集") {
        label.textContent = "無料でできるポイ活特集";
      }
      arrangeHeroButtons();
      return;
    }

    const link = document.createElement("a");
    link.href = "/free-poikatsu";
    link.className = aboutLink.className;
    link.style.color = "#e6007e";
    link.style.borderColor = "#ff9dcc";
    link.style.boxShadow = "0 16px 36px rgba(236, 15, 124, 0.14)";
    link.innerHTML = '<span style="display:inline-grid;width:2.45rem;height:2.45rem;place-items:center;border-radius:999px;background:linear-gradient(135deg,#ffd84d,#ff9f00);color:white;font-size:1.16rem;font-weight:950;margin-right:0.65rem;">0</span><span>無料でできるポイ活特集</span>';

    aboutLink.insertAdjacentElement("afterend", link);
    arrangeHeroButtons();
  };

  const updateTopCopy = () => {
    if (window.location.pathname !== "/") return;

    const heroParagraph = Array.from(document.querySelectorAll("header p")).find((paragraph) => {
      const text = paragraph.textContent || "";
      return text.includes("Google") && text.includes("ランキングに反映");
    });

    const heroHtml = '<span class="text-slate-950">「Google検索」</span>のデータをもとに、<span class="text-pink-600">いま世間で注目されているポイ活</span>をAIが判定し、<span class="text-pink-600">毎日（0:00～1:00頃）</span>ランキングに反映しています。';

    if (heroParagraph && heroParagraph.dataset.topCopyUpdated !== "true") {
      heroParagraph.innerHTML = heroHtml;
      heroParagraph.dataset.topCopyUpdated = "true";
    }

    const rankingHeading = document.querySelector('#ranking-section h2');
    const rankingHeadingHtml = '【<span style="color:#f59e0b;">AI</span>判定】いま注目されているポイ活ランキング';
    if (rankingHeading && rankingHeading.dataset.topCopyUpdated !== "true") {
      rankingHeading.innerHTML = rankingHeadingHtml;
      rankingHeading.dataset.topCopyUpdated = "true";
    }
  };

  const updateTopLabels = () => {
    if (window.location.pathname !== "/") return;

    const badge = Array.from(document.querySelectorAll("header div")).find((element) => {
      return (element.textContent || "").includes("AIが毎日自動で判定中！");
    });

    if (badge && badge.dataset.aiBadgeUpdated !== "true") {
      const icon = badge.querySelector("span:first-child")?.outerHTML || "<span>🤖</span>";
      badge.innerHTML = icon + '<span><span style="color:#f59e0b;">AI</span><span style="color:#0f172a;">が毎日自動で判定中！</span></span>';
      badge.dataset.aiBadgeUpdated = "true";
    }

    const keywordHeading = document.querySelector("#trend-keywords h2");
    if (keywordHeading && keywordHeading.textContent?.includes("ポイ活関連キーワード")) {
      keywordHeading.innerHTML = keywordHeading.innerHTML.replace("ポイ活関連キーワード", "ポイ活関連ワード");
    }
  };

  const trimRankingKeywordDescriptions = () => {
    if (window.location.pathname !== "/") return;

    document.querySelectorAll("main p").forEach((paragraph) => {
      const html = paragraph.innerHTML || "";
      const marker = "も一緒に調べられています。";
      if (!html.includes("Googleの検索動向で") && !html.includes("Googleの検索で")) return;
      if (!html.includes(marker)) return;

      const updatedHtml = html.split("Googleの検索動向で").join("Googleの検索で");
      const trimmedHtml = updatedHtml.slice(0, updatedHtml.indexOf(marker) + marker.length);
      if (html !== trimmedHtml) {
        paragraph.innerHTML = trimmedHtml;
      }
    });
  };

  const loadMoppyImages = () => {
    if (!moppyImagesPromise) {
      moppyImagesPromise = fetch("/api/moppy-offer-images", { cache: "force-cache" })
        .then((response) => (response.ok ? response.json() : { data: [] }))
        .then((json) => Array.isArray(json.data) ? json.data : [])
        .catch(() => []);
    }

    return moppyImagesPromise;
  };

  const findImageForOffer = (offerName, images) => {
    const normalizedOfferName = normalizeText(offerName);
    if (!normalizedOfferName) return null;

    return images.find((image) => {
      const normalizedTitle = normalizeText(image.title);
      return (
        normalizedTitle === normalizedOfferName ||
        normalizedTitle.includes(normalizedOfferName) ||
        normalizedOfferName.includes(normalizedTitle)
      );
    }) || null;
  };

  const ensureRankingImageStyle = () => {
    if (document.getElementById("ranking-image-style")) return;

    const style = document.createElement("style");
    style.id = "ranking-image-style";
    style.textContent =
      ".ranking-image-enhanced{align-items:center;}" +
      ".ranking-image-enhanced > div:first-child{align-items:center;}" +
      ".ranking-image-box{width:150px;aspect-ratio:1.35/1;overflow:hidden;border:1px solid #f3d7e4;border-radius:18px;background:#fffafb;box-shadow:0 10px 20px rgba(15,23,42,.05);}" +
      ".ranking-image-box img{display:block;width:100%;height:100%;object-fit:cover;}" +
      ".ranking-fallback-image{position:relative;width:100%;height:100%;background:linear-gradient(135deg,#fffefe,#fff8fb);}" +
      ".ranking-fallback-image::before{content:'';position:absolute;left:22px;right:22px;top:50%;height:54px;border:2px solid #f4b5cf;border-radius:14px;background:rgba(255,255,255,.72);transform:translateY(-50%);}" +
      ".ranking-fallback-image::after{content:'';position:absolute;left:40px;right:40px;top:50%;height:1px;background:linear-gradient(90deg,transparent,#f3a7c6,transparent);transform:translateY(-50%);box-shadow:0 -12px 0 #fff2f8,0 12px 0 #fff2f8;}" +
      ".ranking-fallback-image span{display:none;}" +
      "@media (min-width:1280px){article.ranking-image-top > div:first-child{grid-template-columns:120px 160px minmax(0,1.45fr) 260px 260px !important;}article.ranking-image-list{grid-template-columns:58px 150px minmax(0,1.3fr) 220px 210px !important;}}" +
      "@media (min-width:1024px) and (max-width:1279px){article.ranking-image-top > div:first-child{grid-template-columns:90px 150px minmax(0,1fr) !important;}article.ranking-image-list{grid-template-columns:70px 150px minmax(0,1fr) !important;}}" +
      "@media (max-width:1023px){.ranking-image-box{width:min(100%,260px);}}";
    document.head.appendChild(style);
  };

  const createRankingImageBox = (offerName, imageUrl) => {
    const box = document.createElement("div");
    box.className = "ranking-image-box";
    box.setAttribute("data-ranking-image", "true");

    if (imageUrl) {
      const image = document.createElement("img");
      image.src = imageUrl;
      image.alt = offerName;
      image.loading = "lazy";
      image.onerror = () => {
        box.innerHTML = '<div class="ranking-fallback-image" aria-hidden="true"></div>';
      };
      box.appendChild(image);
    } else {
      box.innerHTML = '<div class="ranking-fallback-image" aria-hidden="true"></div>';
    }

    return box;
  };

  const getGridContainer = (article, index) => {
    if (index < 3 && article.firstElementChild) return article.firstElementChild;
    return article;
  };

  const removeLabelAreas = (grid, contentBlock) => {
    if (contentBlock) {
      const heading = contentBlock.querySelector("h3");
      if (heading) {
        Array.from(contentBlock.children).forEach((child) => {
          if (child === heading) return;
          if (child.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING) {
            child.remove();
          }
        });
      }
    }

    Array.from(grid.children).forEach((child) => {
      if (child === contentBlock) return;
      if (child.querySelector("h3")) return;
      if (child.matches('[data-ranking-image="true"]')) return;
      if (child.querySelector('[data-ranking-image="true"]')) return;
      const text = child.textContent || "";
      const looksLikeLabelArea =
        text.includes("検索急増") ||
        text.includes("高単価") ||
        text.includes("高還元") ||
        text.includes("急上昇") ||
        text.includes("トレンド") ||
        text.includes("人気拡大") ||
        text.includes("SNS話題") ||
        text.includes("クレジットカード") ||
        text.includes("通信・回線") ||
        text.includes("証券・FX") ||
        text.includes("アプリ・ゲーム");

      if (looksLikeLabelArea) child.remove();
    });
  };

  const enhanceRankingCards = async () => {
    if (window.location.pathname !== "/") return;
    if (rankingCardsEnhancementRunning) return;

    rankingCardsEnhancementRunning = true;
    try {
      ensureRankingImageStyle();
      const images = await loadMoppyImages();
      const rankingArticles = Array.from(document.querySelectorAll('article[id^="ranking-"]'));

      rankingArticles.forEach((article, index) => {
        const heading = article.querySelector("h3");
        const offerName = heading?.textContent?.trim();
        const grid = getGridContainer(article, index);
        const contentBlock = heading?.parentElement;

        if (!offerName || !grid || !contentBlock) return;

        article.classList.add("ranking-image-enhanced");
        article.classList.add(index < 3 ? "ranking-image-top" : "ranking-image-list");

        removeLabelAreas(grid, contentBlock);

        let imageBox = article.querySelector('[data-ranking-image="true"]');
        if (!imageBox) {
          const matchedImage = findImageForOffer(offerName, images);
          imageBox = createRankingImageBox(offerName, matchedImage?.imageUrl);
          grid.insertBefore(imageBox, contentBlock);
        }
      });
    } finally {
      rankingCardsEnhancementRunning = false;
    }
  };

  const applyAdjustments = () => {
    ensureHeroButtonStyle();
    insertFreePoikatsuLink();
    arrangeHeroButtons();
    updateTopCopy();
    updateTopLabels();
    trimRankingKeywordDescriptions();
    enhanceRankingCards();
  };

  applyAdjustments();
  [300, 900, 1800, 3200, 5200, 8000].forEach((delay) => {
    window.setTimeout(applyAdjustments, delay);
  });
})();
`;

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Script
        id="free-poikatsu-hero-link"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: freePoikatsuLinkScript }}
      />
    </>
  );
}
