import Script from "next/script";

const freePoikatsuLinkScript = `
(() => {
  let moppyImagesPromise = null;
  let rankingCardsEnhancementRunning = false;

  const normalizeText = (text) => {
    return (text || "")
      .toLowerCase()
      .replace(/　/g, "")
      .replace(/\s+/g, "")
      .replace(/（/g, "(")
      .replace(/）/g, ")")
      .replace(/[・･]/g, "")
      .replace(/[ーｰ−]/g, "-")
      .replace(/[\[\]【】!！?？。、「」『』()（）]/g, "")
      .trim();
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
      return;
    }

    const link = document.createElement("a");
    link.href = "/free-poikatsu";
    link.className = aboutLink.className;
    link.style.color = "#e6007e";
    link.style.borderColor = "#ff9dcc";
    link.style.boxShadow = "0 12px 28px rgba(236, 15, 124, 0.12)";
    link.innerHTML = '<span style="display:inline-grid;width:1.6rem;height:1.6rem;place-items:center;border-radius:999px;background:linear-gradient(135deg,#ffd84d,#ff9f00);color:white;font-size:0.85rem;font-weight:900;margin-right:0.5rem;">0</span><span>無料でできるポイ活特集</span>';

    aboutLink.insertAdjacentElement("afterend", link);
  };

  const updateTopCopy = () => {
    if (window.location.pathname !== "/") return;

    const heroParagraph = Array.from(document.querySelectorAll("header p")).find((paragraph) => {
      const text = paragraph.textContent || "";
      return text.includes("Google") && text.includes("ランキングに反映");
    });

    const heroHtml = '<span class="text-pink-600">「Google検索」</span>のデータをもとに、<span class="text-pink-600">いま世間で注目されているポイ活</span>をAIが判定し、<span class="text-pink-600">毎日（0:00～1:00頃）</span>ランキングに反映しています。';

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

  const trimRankingKeywordDescriptions = () => {
    if (window.location.pathname !== "/") return;

    document.querySelectorAll("main p").forEach((paragraph) => {
      const html = paragraph.innerHTML || "";
      const marker = "も一緒に調べられています。";
      if (!html.includes("Googleの検索動向で") || !html.includes(marker)) return;

      const trimmedHtml = html.slice(0, html.indexOf(marker) + marker.length);
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
      ".ranking-image-box{width:150px;aspect-ratio:1.35/1;overflow:hidden;border:1px solid #ffd7e8;border-radius:18px;background:#fff;box-shadow:0 10px 20px rgba(15,23,42,.08);}" +
      ".ranking-image-box img{display:block;width:100%;height:100%;object-fit:cover;}" +
      ".ranking-fallback-image{position:relative;width:100%;height:100%;background:radial-gradient(circle at 30% 32%,#ffd84d 0 20%,transparent 21%),radial-gradient(circle at 72% 24%,#ff7db8 0 17%,transparent 18%),linear-gradient(135deg,#fff,#fff8ea);}" +
      ".ranking-fallback-image::after{content:'P';position:absolute;right:12px;bottom:10px;display:grid;place-items:center;width:44px;height:44px;border-radius:999px;color:#fff;font-size:24px;font-weight:950;background:linear-gradient(135deg,#ffd84d,#ff9f00);}" +
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
    insertFreePoikatsuLink();
    updateTopCopy();
    trimRankingKeywordDescriptions();
    enhanceRankingCards();
  };

  applyAdjustments();
  [300, 900, 1800, 3200, 5200].forEach((delay) => {
    window.setTimeout(applyAdjustments, delay);
  });

  new MutationObserver(applyAdjustments).observe(document.documentElement, {
    childList: true,
    subtree: true,
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
