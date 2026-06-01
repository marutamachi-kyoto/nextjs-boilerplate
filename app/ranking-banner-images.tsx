"use client";

import { useEffect } from "react";

type ScoreItem = {
  offer_name?: string;
  trend_keyword?: string;
  category?: string;
  primary_site_url?: string | null;
};

const BANNER_LOOKUP_VERSION = "20260601-offer-banners-v2";
const SCORE_LOOKUP_TIMEOUT_MS = 1800;

const normalizeText = (value?: string | null) => {
  return (value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[\u300c\u300d\u300e\u300f\u3010\u3011\[\]\uff08\uff09()\u30fb\uff65]/g, "")
    .replace(/[\u30fc\uff70\u2212]/g, "-")
    .trim();
};

const findMatchedItem = (items: ScoreItem[], offerName: string) => {
  const normalizedOfferName = normalizeText(offerName);
  if (!normalizedOfferName) return null;

  return (
    items.find((item) => normalizeText(item.offer_name) === normalizedOfferName) ||
    items.find((item) => {
      const candidates = [item.offer_name, item.trend_keyword, item.category]
        .map(normalizeText)
        .filter(Boolean);

      return candidates.some(
        (candidate) =>
          candidate === normalizedOfferName ||
          (candidate.length >= 5 &&
            (candidate.includes(normalizedOfferName) ||
              normalizedOfferName.includes(candidate)))
      );
    }) ||
    null
  );
};

const fetchScoreItems = async () => {
  try {
    const response = await fetch("/api/score", { cache: "no-store" });
    if (!response.ok) return [];

    const json = await response.json();
    return Array.isArray(json.data) ? (json.data as ScoreItem[]) : [];
  } catch {
    return [];
  }
};

const fetchScoreItemsWithTimeout = async () => {
  const timeoutPromise: Promise<ScoreItem[]> = new Promise((resolve) => {
    window.setTimeout(() => resolve([]), SCORE_LOOKUP_TIMEOUT_MS);
  });

  return Promise.race([fetchScoreItems(), timeoutPromise]);
};

const fetchBannerImage = async (offerName: string, currentUrl?: string | null) => {
  const params = new URLSearchParams({
    offer: offerName,
    v: BANNER_LOOKUP_VERSION,
  });
  if (currentUrl) params.set("url", currentUrl);

  try {
    const response = await fetch(`/api/ranking-banner-image?${params.toString()}`);
    if (!response.ok) return null;

    const json = await response.json();
    return typeof json.imageUrl === "string" && json.imageUrl ? json.imageUrl : null;
  } catch {
    return null;
  }
};

const applyArticleLayout = (article: HTMLElement) => {
  if (window.innerWidth >= 1280) {
    article.style.gridTemplateColumns = "58px 150px minmax(0, 1fr) 220px 210px";
  } else {
    article.style.removeProperty("grid-template-columns");
  }
};

const addBannerImage = (article: HTMLElement, offerName: string, imageUrl: string) => {
  if (article.querySelector(".ranking-banner-slot")) return;

  const rankColumn = article.firstElementChild;
  if (!rankColumn) return;

  const slot = document.createElement("div");
  slot.className = "ranking-banner-slot";
  slot.dataset.rankingImage = "true";
  slot.style.width = "150px";
  slot.style.maxWidth = "100%";
  slot.style.aspectRatio = "1.35 / 1";
  slot.style.overflow = "hidden";
  slot.style.borderRadius = "16px";
  slot.style.background = "#ffffff";
  slot.style.border = "1px solid #f9cfe2";
  slot.style.boxShadow = "0 10px 22px rgba(236, 72, 153, 0.12)";
  slot.style.alignSelf = "center";
  slot.style.justifySelf = "center";

  const image = document.createElement("img");
  image.src = imageUrl;
  image.alt = `${offerName}のバナー画像`;
  image.loading = "lazy";
  image.style.display = "block";
  image.style.width = "100%";
  image.style.height = "100%";
  image.style.objectFit = "cover";

  slot.appendChild(image);
  rankColumn.insertAdjacentElement("afterend", slot);
  article.classList.add("ranking-image-list");
  applyArticleLayout(article);
};

export default function RankingBannerImages() {
  useEffect(() => {
    let cancelled = false;
    const resizedArticles = new Set<HTMLElement>();

    const onResize = () => {
      resizedArticles.forEach(applyArticleLayout);
    };

    const applyImages = async () => {
      const articles = Array.from(
        document.querySelectorAll<HTMLElement>('article[id^="ranking-"]')
      ).slice(0, 50);
      if (!articles.length) return;

      const scoreItems = await fetchScoreItemsWithTimeout();
      if (cancelled) return;

      const queue = articles.map((article) => async () => {
        if (cancelled || article.dataset.bannerChecked === "true") return;
        article.dataset.bannerChecked = "true";

        const offerName = article.querySelector("h3")?.textContent?.trim();
        if (!offerName) return;

        const matchedItem = findMatchedItem(scoreItems, offerName);
        const imageUrl = await fetchBannerImage(
          offerName,
          matchedItem?.primary_site_url
        );
        if (!imageUrl || cancelled) return;

        addBannerImage(article, offerName, imageUrl);
        resizedArticles.add(article);
      });

      const concurrency = 4;
      let nextIndex = 0;
      await Promise.all(
        Array.from({ length: concurrency }, async () => {
          while (!cancelled && nextIndex < queue.length) {
            const task = queue[nextIndex];
            nextIndex += 1;
            await task();
          }
        })
      );
    };

    window.addEventListener("resize", onResize);
    const timers = [500, 1400, 2800, 5000].map((delay) =>
      window.setTimeout(applyImages, delay)
    );

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  return null;
}
