"use client";

import Script from "next/script";

const offerLikesScript = `
(() => {
  const likedPrefix = "poikatu-liked:";
  let likeDataPromise = null;
  let scoreDataPromise = null;
  const normalizeText = (value) => String(value || "").replace(/\s+/g, " ").trim();
  const normalizeKey = (value) => normalizeText(value)
    .toLowerCase()
    .replace(/\u3000/g, "")
    .replace(/\s+/g, "")
    .replace(/\uff08/g, "(")
    .replace(/\uff09/g, ")")
    .replace(/[\u30fb\uff65]/g, "")
    .replace(/[\u30fc\uff70\u2212]/g, "-")
    .replace(/[\[\]\u3010\u3011!\uff01?\uff1f\u3002\u3001\u300c\u300d\u300e\u300f()\uff08\uff09]/g, "")
    .trim();
  const normalizeRankingIdKey = (value) => String(value || "")
    .toLowerCase()
    .replace(/\u3000/g, "")
    .replace(/\s+/g, "")
    .replace(/\uff08/g, "(")
    .replace(/\uff09/g, ")")
    .replace(/[\u30fb\uff65]/g, "")
    .replace(/[\u30fc\uff70\u2212]/g, "-")
    .trim();

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
      '.ranking-related-word { display: inline-flex; align-items: center; border-radius: 999px; background: #fff1f7; color: #ec2f91; padding: 0.04em 0.45em; font-weight: 950; }',
      '.free-poikatsu-lead-emphasis { color: #e6007e; background: #fff1f7; padding: 0 0.22em; border-radius: 0.35em; }',
      '.free-poikatsu-ranking-heading { white-space: nowrap !important; }',
      '@media (min-width: 721px) { header a[href="/about-poikatsu"] > span:last-child, header a[href="/free-poikatsu"] > span:last-child { font-size: 1.12em !important; } }',
      '@keyframes offerLikePop { 0% { transform: scale(1); } 45% { transform: scale(1.08); } 100% { transform: scale(1); } }',
      '@keyframes offerLikeBurst { 0% { opacity: 0; transform: translate(-50%, 0) scale(0.75); } 20% { opacity: 1; } 100% { opacity: 0; transform: translate(-50%, -34px) scale(1.22); } }',
      '@media (max-width: 720px) { .free-poikatsu-ranking-heading { white-space: normal !important; } body header div:has(> a[href="/about-poikatsu"]) { grid-template-columns: 1fr !important; justify-content: stretch !important; overflow-x: visible !important; gap: 0.8rem !important; } body header div:has(> a[href="/about-poikatsu"]) > div:first-child { display: inline-flex !important; width: fit-content !important; max-width: 100% !important; justify-self: start !important; } body header a[href="/about-poikatsu"], body header a[href="/free-poikatsu"] { width: 100% !important; max-width: 100% !important; } main article { text-align: center !important; } main article h3, main article p { text-align: center !important; } main article > div, main article div:has(> h3), main article div:has(> a[href*="/reviews/"]), main article div:has(> button) { justify-items: center !important; align-items: center !important; } main article .ranking-image-box { margin-left: auto !important; margin-right: auto !important; } .offer-like-button { max-width: 260px; } }',
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

  const getScoreData = () => {
    if (!scoreDataPromise) {
      scoreDataPromise = fetch("/api/score", { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : { data: [] }))
        .then((json) => (Array.isArray(json.data) ? json.data : []))
        .catch(() => []);
    }
    return scoreDataPromise;
  };

  const findScoreDataItem = (offerName, scoreData) => {
    const offerKey = normalizeKey(offerName);
    if (!offerKey) return null;
    return scoreData.find((score) => {
      const names = [score.offer_name, score.trend_keyword].map(normalizeKey).filter(Boolean);
      return names.some((name) => name === offerKey || (name.length >= 5 && (name.includes(offerKey) || offerKey.includes(name))));
    }) || null;
  };

  const getDirectMoppyUrl = (offerName, scoreData) => {
    const offerKey = normalizeKey(offerName);
    if (!offerKey) return "";
    const item = scoreData.find((score) => {
      const names = [score.offer_name, score.trend_keyword, score.category].map(normalizeKey).filter(Boolean);
      return names.some((name) => name === offerKey || (name.length >= 3 && (name.includes(offerKey) || offerKey.includes(name))));
    });
    const url = item?.primary_site_url || "";
    if (!url || url === "https://pc.moppy.jp/" || url.includes("/entry/invite.php")) return "";
    return url;
  };

  const getRankingOfferName = (score) => score?.offer_name || score?.trend_keyword || score?.category || "";

  const findTrendKeywordRankingItem = (keyword, scoreData) => {
    const keywordKey = normalizeKey(keyword);
    if (!keywordKey) return null;

    return scoreData.find((score) => {
      const names = [score.offer_name, score.trend_keyword, score.category].map(normalizeKey).filter(Boolean);
      return names.some((name) => {
        if (!name) return false;
        if (name === keywordKey) return true;
        return name.length >= 3 && keywordKey.length >= 3 && (name.includes(keywordKey) || keywordKey.includes(name));
      });
    }) || null;
  };

  const getRankingTargetId = (scoreData, scoreItem) => {
    const index = scoreData.indexOf(scoreItem);
    if (index < 0) return "";
    const offerName = getRankingOfferName(scoreItem);
    if (!offerName) return "";
    return "ranking-" + (index + 1) + "-" + normalizeRankingIdKey(offerName);
  };

  const findTrendKeywordRankingTargetFromDom = (keyword) => {
    const keywordKey = normalizeKey(keyword);
    if (!keywordKey) return "";

    const article = Array.from(document.querySelectorAll('main article[id^="ranking-"]')).find((candidate) => {
      const headingKey = normalizeKey(candidate.querySelector("h3")?.textContent);
      if (!headingKey) return false;
      return headingKey === keywordKey || (headingKey.length >= 3 && keywordKey.length >= 3 && (headingKey.includes(keywordKey) || keywordKey.includes(headingKey)));
    });

    return article?.id || "";
  };

  const scrollToRankingTarget = (targetId) => {
    const target = document.getElementById(targetId);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const makeTrendKeywordButton = (element, targetId) => {
    if (!targetId || element.dataset.trendKeywordLinked === "true") return;

    const click = (event) => {
      event.preventDefault();
      scrollToRankingTarget(targetId);
    };

    if (element.tagName === "BUTTON") {
      element.dataset.trendKeywordLinked = "true";
      element.classList.add("underline", "decoration-2", "underline-offset-4");
      element.title = "ランキング内の該当案件へ移動";
      element.addEventListener("click", click);
      return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = element.className;
    button.classList.add("underline", "decoration-2", "underline-offset-4", "active:scale-95");
    button.dataset.trendKeywordLinked = "true";
    button.title = "ランキング内の該当案件へ移動";
    button.textContent = normalizeText(element.textContent);
    button.addEventListener("click", click);
    element.replaceWith(button);
  };

  const makeTrendKeywordReviewLink = (element, keyword) => {
    if (!keyword || element.dataset.trendKeywordLinked === "true") return;
    const link = document.createElement("a");
    link.href = "/reviews/" + encodeURIComponent(keyword);
    link.className = element.className;
    link.classList.add("underline", "decoration-2", "underline-offset-4");
    link.dataset.trendKeywordLinked = "true";
    link.title = "関連ワード詳細ページを見る";
    link.textContent = keyword;
    element.replaceWith(link);
  };

  const linkTrendKeywordPills = (scoreData) => {
    if (location.pathname !== "/") return;
    const section = document.getElementById("trend-keywords");
    if (!section) return;

    section.querySelectorAll("button, div, a").forEach((element) => {
      const text = normalizeText(element.textContent);
      if (!text || text.includes("最終更新") || text.includes("Google") || text.includes("関連")) return;
      if (!element.className || !String(element.className).includes("bg-pink-100") || !String(element.className).includes("text-pink-600")) return;

      const matchedItem = findTrendKeywordRankingItem(text, scoreData);
      const apiTargetId = matchedItem ? getRankingTargetId(scoreData, matchedItem) : "";
      const targetId = apiTargetId && document.getElementById(apiTargetId)
        ? apiTargetId
        : findTrendKeywordRankingTargetFromDom(text);

      if (targetId && document.getElementById(targetId)) makeTrendKeywordButton(element, targetId);
      else makeTrendKeywordReviewLink(element, text);
    });
  };

  const attachDirectMoppyAction = (article, offerName, scoreData) => {
    if (location.pathname !== "/") return;
    const directUrl = getDirectMoppyUrl(offerName, scoreData);
    if (!directUrl) return;
    const action = findMoppyAction(article);
    if (!action || action.dataset.directMoppyUrl === directUrl) return;
    action.dataset.directMoppyUrl = directUrl;
    action.setAttribute("aria-label", "モッピーの案件ページで確認する");
    action.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
        window.open(directUrl, "_blank", "noopener,noreferrer");
      },
      true
    );
  };

  const escapeHtml = (value) => String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const extractQuotedWords = (text) => {
    const words = [];
    const pattern = /\u300c([^\u300d]+)\u300d/g;
    let match = pattern.exec(String(text || ""));
    while (match) {
      const word = normalizeText(match[1]);
      if (word && !words.includes(word)) words.push(word);
      match = pattern.exec(String(text || ""));
    }
    return words;
  };

  const getRelatedWords = (offerName, scoreItem) => {
    const words = [];
    const addWord = (value) => {
      const word = normalizeText(value);
      if (!word || normalizeKey(word) === normalizeKey(offerName)) return;
      if (!words.includes(word)) words.push(word);
    };

    extractQuotedWords(scoreItem?.reason).forEach(addWord);
    addWord(scoreItem?.trend_keyword);
    return words.slice(0, 2);
  };

  const updateRankingDescription = (article, offerName, scoreData) => {
    if (location.pathname !== "/") return;
    const heading = article.querySelector("h3");
    const contentArea = heading?.parentElement;
    const paragraph = contentArea?.querySelector("p");
    if (!paragraph) return;

    const scoreItem = findScoreDataItem(offerName, scoreData);
    const relatedWords = getRelatedWords(offerName, scoreItem);
    const safeOfferName = escapeHtml(offerName);
    const wordsHtml = relatedWords.length > 0
      ? relatedWords.map((word) => '<span class="ranking-related-word">「' + escapeHtml(word) + '」</span>').join(' や ')
      : '<span class="ranking-related-word">「ポイ活」</span>';

    paragraph.innerHTML = safeOfferName + 'は、Googleの検索で ' + wordsHtml + ' も一緒に調べられています。';
    paragraph.dataset.rankingDescriptionNormalized = "true";
  };

  const getLikedKey = (offerName, likeDate) => likedPrefix + (likeDate || "today") + ":" + offerName;
  const hasLiked = (offerName, likeDate) => {
    try { return localStorage.getItem(getLikedKey(offerName, likeDate)) === "1"; } catch { return false; }
  };
  const markLiked = (offerName, likeDate) => { try { localStorage.setItem(getLikedKey(offerName, likeDate), "1"); } catch {} };
  const unmarkLiked = (offerName, likeDate) => { try { localStorage.removeItem(getLikedKey(offerName, likeDate)); } catch {} };

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
      if (nextLiked) markLiked(offerName, currentDate); else unmarkLiked(offerName, currentDate);

      try {
        const json = await sendLikeAction(offerName, nextLiked ? "like" : "unlike");
        if (json.likeDate) {
          button.dataset.likeDate = json.likeDate;
          if (nextLiked) markLiked(offerName, json.likeDate); else unmarkLiked(offerName, json.likeDate);
        }
        if (Number.isFinite(Number(json.count))) setButtonState(button, nextLiked, Number(json.count));
      } catch {}
    });
    return button;
  };

  const findMoppyAction = (container) => {
    return Array.from(container.querySelectorAll("a, button")).find((element) => {
      const text = normalizeText(element.textContent);
      return text.includes("モッピーで探す") || text.includes("モッピーで確認");
    }) || null;
  };

  const findActionArea = (article) => {
    const action = findMoppyAction(article);
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

    const heading = Array.from(document.querySelectorAll("main h2")).find((element) => {
      const text = normalizeText(element.textContent);
      return text.includes("無料でできるポイ活一覧") || text.includes("いま注目されているポイ活ランキング");
    });
    if (heading) {
      heading.innerHTML = '【<span style="color:#f59e0b;">AI</span>判定】いま注目されているポイ活ランキング';
      heading.classList.add("free-poikatsu-ranking-heading");
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

    const note = Array.from(document.querySelectorAll("main p")).find((element) => {
      const text = normalizeText(element.textContent);
      return text.includes("モッピー上で確認できる情報") && text.includes("申し込み前に必ず");
    });
    if (note && !note.dataset.freePoikatsuNoteUpdated) {
      note.innerHTML = '※ モッピー上で確認できる情報をもとに表示しています。ポイント数や条件は変わることがあります。<br />申し込み前に必ずモッピーの案件詳細ページで最新条件を確認してください。';
      note.dataset.freePoikatsuNoteUpdated = "true";
    }
  };

  const adjustRankingSpacing = () => {
    if (location.pathname !== "/") return;
    const heading = Array.from(document.querySelectorAll("main h2")).find((element) => normalizeText(element.textContent).includes("いま注目されているポイ活ランキング"));
    const section = heading?.closest("section") || document.getElementById("ranking-section");
    if (section) section.style.marginTop = "5.5rem";
  };

  const enhanceOfferLikes = async () => {
    if (location.pathname !== "/" && location.pathname !== "/free-poikatsu") return;
    ensureOfferLikeStyle();
    updateFreePoikatsuCopy();
    adjustRankingSpacing();
    const [likeData, scoreData] = await Promise.all([getLikeData(), getScoreData()]);
    linkTrendKeywordPills(scoreData);
    document.querySelectorAll("main article").forEach((article) => {
      const heading = article.querySelector("h3");
      const offerName = normalizeText(heading?.textContent);
      if (!offerName) return;
      updateRankingDescription(article, offerName, scoreData);
      attachDirectMoppyAction(article, offerName, scoreData);
      if (article.querySelector(".offer-like-button")) return;
      const actionArea = findActionArea(article);
      if (!actionArea) return;
      const button = createLikeButton(offerName, likeData.counts[offerName] || 0, likeData.likeDate);
      const moppyAction = findMoppyAction(actionArea);
      actionArea.insertBefore(button, moppyAction || actionArea.firstChild);
    });
  };

  const run = () => {
    enhanceOfferLikes();
    [400, 1000, 2200, 4200, 7000].forEach((delay) => window.setTimeout(enhanceOfferLikes, delay));
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, { once: true });
  else run();
})();
`;

export default function OfferLikes() {
  return <Script id="offer-likes" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: offerLikesScript }} />;
}
