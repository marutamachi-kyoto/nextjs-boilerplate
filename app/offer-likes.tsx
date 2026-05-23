"use client";

import Script from "next/script";

const offerLikesScript = `
(() => {
  const likedPrefix = "poikatu-liked:";
  let likeDataPromise = null;

  const normalizeText = (value) => String(value || "").replace(/\s+/g, " ").trim();

  const ensureOfferLikeStyle = () => {
    if (document.getElementById("offer-like-style")) return;

    const style = document.createElement("style");
    style.id = "offer-like-style";
    style.textContent = [
      '.offer-like-button { position: relative; display: inline-flex; min-height: 44px; width: 100%; max-width: 260px; align-items: center; justify-content: center; gap: 0.45rem; overflow: visible; border-radius: 999px; border: 2px solid #f9a8d4; background: #fff; color: #db2777; font-weight: 950; box-shadow: 0 10px 24px rgba(236, 72, 153, 0.14); transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease; }',
      '.offer-like-button:hover { transform: scale(1.04); background: #fff1f7; }',
      '.offer-like-button[data-liked="true"] { background: linear-gradient(135deg, #ec4899, #fb7185); color: #fff; border-color: transparent; box-shadow: 0 14px 30px rgba(236, 72, 153, 0.22); }',
      '.offer-like-icon { font-size: 1.25rem; line-height: 1; }',
      '.offer-like-count { display: inline-grid; min-width: 1.9rem; height: 1.9rem; place-items: center; border-radius: 999px; background: rgba(255,255,255,0.9); color: #db2777; padding: 0 0.35rem; }',
      '.offer-like-button[data-liked="true"] .offer-like-count { background: rgba(255,255,255,0.95); color: #db2777; }',
      '.offer-like-button.offer-like-pop { animation: offerLikePop 0.34s ease both; }',
      '.offer-like-burst { position: absolute; left: 50%; top: 8px; pointer-events: none; color: #ec4899; font-size: 1.35rem; font-weight: 950; transform: translate(-50%, -50%); animation: offerLikeBurst 0.7s ease-out forwards; text-shadow: 0 8px 18px rgba(236, 72, 153, 0.25); }',
      '.offer-like-button[data-liked="true"] .offer-like-burst { color: #fff; }',
      '.free-poikatsu-lead-emphasis { color: #e6007e; background: #fff1f7; padding: 0 0.22em; border-radius: 0.35em; }',
      '@keyframes offerLikePop { 0% { transform: scale(1); } 45% { transform: scale(1.08); } 100% { transform: scale(1); } }',
      '@keyframes offerLikeBurst { 0% { opacity: 0; transform: translate(-50%, 0) scale(0.75); } 20% { opacity: 1; } 100% { opacity: 0; transform: translate(-50%, -34px) scale(1.22); } }',
      '@media (max-width: 720px) { body header div:has(> a[href="/about-poikatsu"]) { grid-template-columns: 1fr !important; justify-content: stretch !important; overflow-x: visible !important; gap: 0.8rem !important; } body header a[href="/about-poikatsu"], body header a[href="/free-poikatsu"] { width: 100% !important; max-width: 100% !important; } main article { text-align: center !important; } main article h3, main article p { text-align: center !important; } main article > div, main article div:has(> h3), main article div:has(> a[href*="/reviews/"]), main article div:has(> button) { justify-items: center !important; align-items: center !important; } main article .ranking-image-box { margin-left: auto !important; margin-right: auto !important; } .offer-like-button { max-width: 260px; } }',
    ].join(String.fromCharCode(10));
    document.head.appendChild(style);
  };

  const getLikeData = () => {
    if (!likeDataPromise) {
      likeDataPromise = fetch("/api/likes", { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : { counts: {}, likeDate: "" }))
        .then((json) => ({ counts: json.counts || {}, likeDate: json.likeDate || "" }))
        .catch(() => ({ counts: {}, likeDate: "" }));
    }
    return likeDataPromise;
  };

  const getLikedKey = (offerName, likeDate) => likedPrefix + (likeDate || "today") + ":" + offerName;

  const hasLiked = (offerName, likeDate) => {
    try {
      return localStorage.getItem(getLikedKey(offerName, likeDate)) === "1";
    } catch {
      return false;
    }
  };

  const markLiked = (offerName, likeDate) => {
    try {
      localStorage.setItem(getLikedKey(offerName, likeDate), "1");
    } catch {}
  };

  const unmarkLiked = (offerName, likeDate) => {
    try {
      localStorage.removeItem(getLikedKey(offerName, likeDate));
    } catch {}
  };

  const setButtonState = (button, liked, count) => {
    const safeCount = Math.max(0, Number(count) || 0);
    button.dataset.liked = liked ? "true" : "false";
    button.setAttribute("aria-pressed", liked ? "true" : "false");
    button.querySelector(".offer-like-icon").textContent = liked ? "♥" : "♡";
    button.querySelector(".offer-like-count").textContent = String(safeCount);
    button.querySelector(".offer-like-text").textContent = liked ? "いいね済み" : "いいね！";
  };

  const showLikeEffect = (button, liked) => {
    button.classList.remove("offer-like-pop");
    void button.offsetWidth;
    button.classList.add("offer-like-pop");
    window.setTimeout(() => button.classList.remove("offer-like-pop"), 380);

    const burst = document.createElement("span");
    burst.className = "offer-like-burst";
    burst.textContent = liked ? "♥" : "－1";
    button.appendChild(burst);
    window.setTimeout(() => burst.remove(), 760);
  };

  const sendLikeAction = async (offerName, action) => {
    const response = await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offer_name: offerName, action }),
    });
    return response.json();
  };

  const createLikeButton = (offerName, count, likeDate) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "offer-like-button";
    button.dataset.offerName = offerName;
    button.dataset.likeDate = likeDate || "";
    button.innerHTML = '<span class="offer-like-icon" aria-hidden="true">♡</span><span class="offer-like-text">いいね！</span><span class="offer-like-count">0</span>';

    setButtonState(button, hasLiked(offerName, likeDate), count);

    button.addEventListener("click", async () => {
      const currentLiked = button.dataset.liked === "true";
      const currentCount = Number(button.querySelector(".offer-like-count").textContent || "0");
      const nextLiked = !currentLiked;
      const nextCount = nextLiked ? currentCount + 1 : Math.max(0, currentCount - 1);
      const currentDate = button.dataset.likeDate || likeDate;

      setButtonState(button, nextLiked, nextCount);
      showLikeEffect(button, nextLiked);

      if (nextLiked) {
        markLiked(offerName, currentDate);
      } else {
        unmarkLiked(offerName, currentDate);
      }

      try {
        const json = await sendLikeAction(offerName, nextLiked ? "like" : "unlike");
        if (json.likeDate) {
          button.dataset.likeDate = json.likeDate;
          if (nextLiked) {
            markLiked(offerName, json.likeDate);
          } else {
            unmarkLiked(offerName, json.likeDate);
          }
        }
        if (Number.isFinite(Number(json.count))) {
          setButtonState(button, nextLiked, Number(json.count));
        }
      } catch {}
    });

    return button;
  };

  const findActionArea = (article) => {
    const action = Array.from(article.querySelectorAll("a, button")).find((element) => {
      const text = normalizeText(element.textContent);
      return text.includes("モッピーで探す") || text.includes("モッピーで確認");
    });
    return action?.parentElement || null;
  };

  const updateFreePoikatsuCopy = () => {
    if (location.pathname !== "/free-poikatsu") return;

    const lead = Array.from(document.querySelectorAll("main p")).find((element) => {
      const text = normalizeText(element.textContent);
      return text.includes("商品購入や有料サービス") && text.includes("無料でできるポイ活");
    });
    if (lead && !lead.dataset.freePoikatsuCopyUpdated) {
      lead.innerHTML = '<span class="free-poikatsu-lead-emphasis">お金をかけずに始めたい人向け</span>の、商品購入や有料サービスの申し込みではなく、無料でできるポイ活の特集です';
      lead.dataset.freePoikatsuCopyUpdated = "true";
    }

    const heading = Array.from(document.querySelectorAll("main h2")).find((element) => normalizeText(element.textContent).includes("無料でできるポイ活一覧"));
    if (heading && !heading.dataset.freePoikatsuHeadingUpdated) {
      heading.innerHTML = '<span class="text-orange-400">🔥</span> 【<span style="color:#f59e0b;">AI</span>判定】いま注目されているポイ活ランキング';
      heading.dataset.freePoikatsuHeadingUpdated = "true";
    }

    const headingWrap = heading?.parentElement;
    if (headingWrap && !headingWrap.dataset.freePoikatsuHeadingLayoutUpdated) {
      headingWrap.classList.remove("lg:flex-row", "lg:items-end", "lg:justify-between");
      headingWrap.classList.add("items-start");
      headingWrap.style.flexDirection = "column";
      headingWrap.style.alignItems = "flex-start";
      headingWrap.style.justifyContent = "flex-start";
      headingWrap.dataset.freePoikatsuHeadingLayoutUpdated = "true";
    }
  };

  const adjustRankingSpacing = () => {
    if (location.pathname !== "/") return;

    const heading = Array.from(document.querySelectorAll("main h2")).find((element) => normalizeText(element.textContent).includes("いま注目されているポイ活ランキング"));
    const section = heading?.closest("section") || document.getElementById("ranking-section");
    if (section) {
      section.style.marginTop = "5.5rem";
    }
  };

  const enhanceOfferLikes = async () => {
    if (location.pathname !== "/" && location.pathname !== "/free-poikatsu") return;

    ensureOfferLikeStyle();
    updateFreePoikatsuCopy();
    adjustRankingSpacing();

    const likeData = await getLikeData();
    document.querySelectorAll("main article").forEach((article) => {
      if (article.querySelector(".offer-like-button")) return;

      const heading = article.querySelector("h3");
      const offerName = normalizeText(heading?.textContent);
      if (!offerName) return;

      const actionArea = findActionArea(article);
      if (!actionArea) return;

      const button = createLikeButton(offerName, likeData.counts[offerName] || 0, likeData.likeDate);
      actionArea.insertBefore(button, actionArea.firstChild);
    });
  };

  const run = () => {
    enhanceOfferLikes();
    [400, 1000, 2200, 4200, 7000].forEach((delay) => window.setTimeout(enhanceOfferLikes, delay));
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
})();
`;

export default function OfferLikes() {
  return <Script id="offer-likes" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: offerLikesScript }} />;
}
