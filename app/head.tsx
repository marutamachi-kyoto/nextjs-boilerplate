const offerLikesScript = `
(() => {
  const likedPrefix = "poikatu-liked:";
  let likeDataPromise = null;

  const normalizeText = (value) => String(value || "").replace(/\s+/g, " ").trim();

  const getLikeData = () => {
    if (!likeDataPromise) {
      likeDataPromise = fetch("/api/likes", { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : { counts: {}, likeDate: "" }))
        .then((json) => ({ counts: json.counts || {}, likeDate: json.likeDate || "" }))
        .catch(() => ({ counts: {}, likeDate: "" }));
    }
    return likeDataPromise;
  };

  const getLikedKey = (offerName, likeDate) => {
    return likedPrefix + (likeDate || "today") + ":" + offerName;
  };

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

  const setButtonState = (button, liked, count) => {
    button.dataset.liked = liked ? "true" : "false";
    button.setAttribute("aria-pressed", liked ? "true" : "false");
    button.querySelector(".offer-like-icon").textContent = liked ? "♥" : "♡";
    button.querySelector(".offer-like-count").textContent = String(count || 0);
    button.querySelector(".offer-like-text").textContent = liked ? "いいね済み" : "いいね！";
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
      if (button.dataset.liked === "true") return;

      const currentCount = Number(button.querySelector(".offer-like-count").textContent || "0");
      setButtonState(button, true, currentCount + 1);
      markLiked(offerName, button.dataset.likeDate || likeDate);

      try {
        const response = await fetch("/api/likes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offer_name: offerName }),
        });
        const json = await response.json();
        if (json.likeDate) {
          button.dataset.likeDate = json.likeDate;
          markLiked(offerName, json.likeDate);
        }
        if (Number.isFinite(Number(json.count))) {
          setButtonState(button, true, Number(json.count));
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

  const enhanceOfferLikes = async () => {
    if (location.pathname !== "/" && location.pathname !== "/free-poikatsu") return;

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

export default function Head() {
  return (
    <>
      <style>{`
        .offer-like-button {
          display: inline-flex;
          min-height: 44px;
          width: 100%;
          max-width: 260px;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          border-radius: 999px;
          border: 2px solid #f9a8d4;
          background: #fff;
          color: #db2777;
          font-weight: 950;
          box-shadow: 0 10px 24px rgba(236, 72, 153, 0.14);
          transition: transform 0.15s ease, background 0.15s ease;
        }
        .offer-like-button:hover { transform: scale(1.04); background: #fff1f7; }
        .offer-like-button[data-liked="true"] { background: linear-gradient(135deg, #ec4899, #fb7185); color: #fff; border-color: transparent; }
        .offer-like-icon { font-size: 1.25rem; line-height: 1; }
        .offer-like-count { display: inline-grid; min-width: 1.9rem; height: 1.9rem; place-items: center; border-radius: 999px; background: rgba(255,255,255,0.9); color: #db2777; padding: 0 0.35rem; }
        .offer-like-button[data-liked="true"] .offer-like-count { background: rgba(255,255,255,0.95); color: #db2777; }
        @media (max-width: 720px) {
          body header div:has(> a[href="/about-poikatsu"]) {
            grid-template-columns: 1fr !important;
            justify-content: stretch !important;
            overflow-x: visible !important;
            gap: 0.8rem !important;
          }
          body header a[href="/about-poikatsu"],
          body header a[href="/free-poikatsu"] {
            width: 100% !important;
            max-width: 100% !important;
          }
          main article {
            text-align: center !important;
          }
          main article h3,
          main article p {
            text-align: center !important;
          }
          main article > div,
          main article div:has(> h3),
          main article div:has(> a[href*="/reviews/"]),
          main article div:has(> button) {
            justify-items: center !important;
            align-items: center !important;
          }
          main article .ranking-image-box {
            margin-left: auto !important;
            margin-right: auto !important;
          }
          .offer-like-button {
            max-width: 260px;
          }
        }
      `}</style>
      <script dangerouslySetInnerHTML={{ __html: offerLikesScript }} />
    </>
  );
}
