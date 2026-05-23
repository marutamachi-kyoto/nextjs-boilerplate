import Script from "next/script";
import OfferLikes from "./offer-likes";

const freePoikatsuLinkScript = `
(() => {
  const MOPPY_INVITE_URL = "https://pc.moppy.jp/entry/invite.php?invite=ut3GA1ce&openExternalBrowser=1";
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
      'header div:has(> a[href="/about-poikatsu"]) { display: grid !important; grid-template-columns: max-content max-content !important; align-items: center !important; gap: 1rem !important; max-width: 100% !important; justify-content: start !important; }',
      'header div:has(> a[href="/about-poikatsu"]) > div:first-child { grid-column: 1 / -1 !important; width: max-content !important; max-width: max-content !important; justify-self: start !important; flex: none !important; }',
      'header a[href="/about-poikatsu"], header a[href="/free-poikatsu"] { min-height: 76px !important; padding: 1.1rem 2rem !important; border-radius: 999px !important; font-size: 1.24rem !important; line-height: 1.25 !important; font-weight: 950 !important; gap: 0.65rem !important; box-shadow: 0 16px 36px rgba(15, 23, 42, 0.10) !important; white-space: nowrap !important; }',
      'header a[href="/about-poikatsu"] span:first-child { display: inline-grid !important; place-items: center !important; width: 3rem !important; height: 3rem !important; margin-right: 0.65rem !important; font-size: 1.75rem !important; line-height: 1 !important; flex: 0 0 auto !important; vertical-align: middle !important; }',
      'header a[href="/free-poikatsu"] span:first-child { display: inline-grid !important; place-items: center !important; width: 2.45rem !important; height: 2.45rem !important; margin-right: 0.65rem !important; font-size: 1.16rem !important; flex: 0 0 auto !important; vertical-align: middle !important; }',
      '@media (min-width: 1024px) { header a[href="/about-poikatsu"], header a[href="/free-poikatsu"] { min-height: 82px !important; padding-left: 2.25rem !important; padding-right: 2.25rem !important; font-size: 1.36rem !important; } }',
      '@media (max-width: 720px) { header div:has(> a[href="/about-poikatsu"]) { grid-template-columns: 1fr !important; justify-content: stretch !important; overflow-x: visible !important; gap: 0.8rem !important; padding-bottom: 0 !important; } header div:has(> a[href="/about-poikatsu"]) > div:first-child { display: none !important; } header a[href="/about-poikatsu"], header a[href="/free-poikatsu"] { width: 100% !important; max-width: 100% !important; justify-content: center !important; min-height: 62px !important; padding: 0.85rem 1rem !important; font-size: 0.98rem !important; } header a[href="/about-poikatsu"] span:first-child { width: 2.4rem !important; height: 2.4rem !important; font-size: 1.45rem !important; } header a[href="/free-poikatsu"] span:first-child { width: 2.1rem !important; height: 2.1rem !important; font-size: 1rem !important; } }',
    ].join(String.fromCharCode(10));
    document.head.appendChild(style);
  };

  const ensureTopMoppySignupStyle = () => {
    if (document.getElementById("top-moppy-signup-style")) return;
    const style = document.createElement("style");
    style.id = "top-moppy-signup-style";
    style.textContent = [
      '.top-moppy-signup-cta { margin: 3rem 0 3.5rem; border: 1px solid #ffd4e8; border-radius: 2rem; background: rgba(255,255,255,0.96); padding: 2rem 1.5rem; text-align: center; box-shadow: 0 22px 46px rgba(236,72,153,0.14); }',
      '.top-moppy-signup-badge { display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; background: #ec2f91; color: #fff; padding: 0.55rem 1.45rem; font-size: 0.95rem; font-weight: 950; box-shadow: 0 8px 18px rgba(236,72,153,0.20); }',
      '.top-moppy-signup-title { margin-top: 1.2rem; color: #07142d; font-size: clamp(2.1rem, 4.2vw, 3.4rem); line-height: 1.15; font-weight: 950; letter-spacing: 0; }',
      '.top-moppy-signup-copy { margin: 1.1rem auto 0; max-width: 46rem; color: #27364f; font-size: clamp(1rem, 2vw, 1.25rem); line-height: 1.9; font-weight: 900; }',
      '.top-moppy-signup-copy strong { color: #e60073; font-weight: 950; }',
      '.top-moppy-signup-button { display: flex; min-height: 4rem; width: min(100%, 38rem); align-items: center; justify-content: center; margin: 1.8rem auto 0; border-radius: 1rem; background: linear-gradient(90deg,#ec2f91,#ff6500); color: #fff; font-size: clamp(1.05rem, 2vw, 1.35rem); font-weight: 950; text-decoration: none; box-shadow: 0 18px 34px rgba(236,72,153,0.20); transition: transform 0.16s ease; }',
      '.top-moppy-signup-button:hover { transform: scale(1.035); }',
      '.top-moppy-signup-note { margin-top: 1rem; color: #8190a9; font-size: 0.85rem; font-weight: 800; }',
      '@media (max-width: 720px) { .top-moppy-signup-cta { margin: 2rem 0 2.6rem; padding: 1.55rem 1rem; border-radius: 1.45rem; } .top-moppy-signup-button { border-radius: 0.9rem; } }',
    ].join(String.fromCharCode(10));
    document.head.appendChild(style);
  };

  const insertFreePoikatsuLink = () => {
    const aboutLink = document.querySelector('header a[href="/about-poikatsu"]');
    if (!aboutLink) return;

    const existingLink = document.querySelector('header a[href="/free-poikatsu"]');
    if (existingLink) {
      const label = existingLink.querySelector("span:last-child");
      if (label && label.textContent !== "無料でできるポイ活特集") {
        label.textContent = "無料でできるポイ活特集";
      }
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
  };

  const insertTopMoppySignupCta = () => {
    if (window.location.pathname !== "/") return;
    ensureTopMoppySignupStyle();
    if (document.getElementById("top-moppy-signup-cta")) return;
    const trendSection = document.getElementById("trend-keywords");
    if (!trendSection) return;

    const cta = document.createElement("section");
    cta.id = "top-moppy-signup-cta";
    cta.className = "top-moppy-signup-cta";
    cta.innerHTML = [
      '<div class="top-moppy-signup-badge">ポイ活サイト最大手！</div>',
      '<h2 class="top-moppy-signup-title">モッピーでポイ活を始める</h2>',
      '<p class="top-moppy-signup-copy">はじめての人は、モッピーの<strong>会員登録（無料）</strong>からスタート</p>',
      '<a class="top-moppy-signup-button" href="' + MOPPY_INVITE_URL + '" target="_blank" rel="noopener noreferrer">モッピーでポイ活を始める ›</a>',
      '<p class="top-moppy-signup-note">※このページには広告・紹介リンクを含みます。</p>',
    ].join("");
    trendSection.insertAdjacentElement("afterend", cta);
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

    const badgeLabel = Array.from(document.querySelectorAll("header span")).find((element) => {
      return (element.textContent || "").trim() === "AIが毎日自動で判定中！";
    });

    if (badgeLabel && badgeLabel.dataset.aiBadgeUpdated !== "true") {
      badgeLabel.innerHTML = '<span style="color:#f59e0b;">AI</span><span style="color:#0f172a;">が毎日自動で判定中！</span>';
      badgeLabel.dataset.aiBadgeUpdated = "true";
    }

    const keywordHeading = document.querySelector("#trend-keywords h2");
    if (keywordHeading) {
      keywordHeading.innerHTML = keywordHeading.innerHTML
        .replace("いまGoogleで話題のポイ活関連キーワード", "いまGoogle検索されているポイ活関連ワード")
        .replace("いまGoogleで話題のポイ活関連ワード", "いまGoogle検索されているポイ活関連ワード")
        .replace("ポイ活関連キーワード", "ポイ活関連ワード");
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

  const formatMoppyReward = (reward) => {
    const value = Number(reward);
    if (!Number.isFinite(value) || value <= 0) return null;
    return value.toLocaleString("ja-JP") + "P";
  };

  const updateArticleReward = (article, matchedOffer) => {
    const rewardText = formatMoppyReward(matchedOffer?.reward);
    if (!rewardText) return;

    const label = Array.from(article.querySelectorAll("div")).find((element) => {
      return (element.textContent || "").trim() === "報酬ポイントの目安";
    });
    const rewardContainer = label?.parentElement;
    const rewardValue = Array.from(rewardContainer?.children || []).find((child) => {
      return child !== label && ((child.textContent || "").includes("P") || (child.textContent || "").includes("データ"));
    });

    if (rewardValue && rewardValue.textContent !== rewardText) {
      rewardValue.textContent = rewardText;
      rewardValue.setAttribute("data-moppy-reward", "true");
    }
  };

  const updateMoppyActionLink = (article, matchedOffer) => {
    if (!matchedOffer?.url) return;
    const button = Array.from(article.querySelectorAll("button")).find((element) => {
      return (element.textContent || "").includes("モッピーで探す");
    });
    if (!button || button.dataset.moppyDirectUrl === matchedOffer.url) return;

    button.dataset.moppyDirectUrl = matchedOffer.url;
    button.setAttribute("aria-label", "モッピーの案件ページで確認する");
    button.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        window.open(matchedOffer.url, "_blank", "noopener,noreferrer");
      },
      true
    );
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

        const matchedOffer = findImageForOffer(offerName, images);

        article.classList.add("ranking-image-enhanced");
        article.classList.add(index < 3 ? "ranking-image-top" : "ranking-image-list");

        removeLabelAreas(grid, contentBlock);
        updateArticleReward(article, matchedOffer);
        updateMoppyActionLink(article, matchedOffer);

        let imageBox = article.querySelector('[data-ranking-image="true"]');
        if (!imageBox) {
          imageBox = createRankingImageBox(offerName, matchedOffer?.imageUrl);
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
    insertTopMoppySignupCta();
    updateTopCopy();
    updateTopLabels();
    trimRankingKeywordDescriptions();
    enhanceRankingCards();
  };

  const scheduleApplyAdjustments = () => {
    applyAdjustments();
    [120, 400, 1000, 2200, 4200, 7000].forEach((delay) => {
      window.setTimeout(applyAdjustments, delay);
    });
  };

  scheduleApplyAdjustments();

  let lastPathname = window.location.pathname;
  let routeAdjustmentTimer = null;
  const queueRouteAdjustments = () => {
    const currentPathname = window.location.pathname;
    const delay = currentPathname !== lastPathname ? 40 : 120;
    lastPathname = currentPathname;
    if (routeAdjustmentTimer) window.clearTimeout(routeAdjustmentTimer);
    routeAdjustmentTimer = window.setTimeout(scheduleApplyAdjustments, delay);
  };

  if (document.body) {
    new MutationObserver(queueRouteAdjustments).observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
  window.addEventListener("popstate", queueRouteAdjustments);
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
      <OfferLikes />
    </>
  );
}
