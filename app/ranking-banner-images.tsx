"use client";

import { useEffect } from "react";

type ScoreItem = {
  offer_name?: string;
  trend_keyword?: string;
  category?: string;
  primary_site_url?: string | null;
};

const normalizeText = (value?: string | null) => {
  return (value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[「」『』【】\[\]（）()・･]/g, "")
    .replace(/[ーｰ−]/g, "-")
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

const fetchBannerImage = async (offerName: string, currentUrl?: string | null) => {
  const params = new URLSearchParams({ offer: offerName });
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

const addBannerImage = (article: HTMLElement, offerName: string, imageUrl: string) => {
  if (article.querySelector(".ranking-banner-slot")) return;

  const rankColumn = article.firstElementChild;
  if (!rankColumn) return;

  const slot = document.createElement("div");
  slot.className = "ranking-banner-slot";

  const image = document.createElement("img");
  image.src = imageUrl;
  image.alt = `${offerName}のバナー画像`;
  image.loading = "lazy";

  slot.appendChild(image);
  rankColumn.insertAdjacentElement("afterend", slot);
  article.classList.add("ranking-image-list");
};

export default function RankingBannerImages() {
  useEffect(() => {
    let cancelled = false;

    const applyImages = async () => {
      const scoreItems = await fetchScoreItems();
      if (cancelled) return;

      const articles = Array.from(
        document.querySelectorAll<HTMLElement>('article[id^="ranking-"]')
      ).slice(0, 50);

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

    const timers = [800, 1800, 3200].map((delay) =>
      window.setTimeout(applyImages, delay)
    );

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  return null;
}
