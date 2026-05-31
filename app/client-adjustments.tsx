"use client";

import { useEffect } from "react";

const MOPPY_INVITE_URL =
  "https://pc.moppy.jp/entry/invite.php?invite=ut3GA1ce&openExternalBrowser=1";
const MOPPY_RESOLVE_TIMEOUT_MS = 3500;

type ScoreItem = {
  category?: string;
  trend_keyword?: string;
  offer_name?: string;
  primary_site_url?: string;
};

const normalizeText = (value?: string | null) => {
  return (value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[「」『』【】\[\]（）()・･]/g, "")
    .replace(/[ーｰ−]/g, "-")
    .trim();
};

const isMoppyOfferUrl = (url?: string) => {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return parsed.hostname === "pc.moppy.jp" && parsed.pathname === "/ad/detail.php";
  } catch {
    return false;
  }
};

const getMoppySearchUrl = (offerName: string) => {
  return `https://pc.moppy.jp/search/?word=${encodeURIComponent(offerName)}`;
};

let scoreItemsPromise: Promise<ScoreItem[]> | null = null;

const getScoreItems = () => {
  if (!scoreItemsPromise) {
    scoreItemsPromise = fetch("/api/score", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { data: [] }))
      .then((json) => (Array.isArray(json.data) ? json.data : []))
      .catch(() => []);
  }

  return scoreItemsPromise;
};

const fetchWithTimeout = async (url: string) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    MOPPY_RESOLVE_TIMEOUT_MS
  );

  try {
    return await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
};

const resolveMoppyDetailUrl = async (offerName: string, currentUrl?: string) => {
  if (isMoppyOfferUrl(currentUrl)) return currentUrl!;

  try {
    const params = new URLSearchParams({ offer: offerName });
    if (currentUrl) params.set("url", currentUrl);

    const response = await fetchWithTimeout(`/api/moppy-url?${params.toString()}`);
    const json = await response.json();

    if (isMoppyOfferUrl(json.url)) return json.url as string;
  } catch (error) {}

  return getMoppySearchUrl(offerName) || MOPPY_INVITE_URL;
};

const findMatchedScoreItem = (items: ScoreItem[], offerName: string) => {
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

const compactText = (element: Element) => {
  return (element.textContent || "").replace(/\s+/g, "").trim();
};

const hideReactOwnedElement = (element: Element) => {
  if (!(element instanceof HTMLElement)) return;
  element.style.display = "none";
  element.setAttribute("aria-hidden", "true");
};

export default function ClientAdjustments() {
  useEffect(() => {
    const applyAdjustments = () => {
      const header = document.querySelector("header");

      const aboutLink = header?.querySelector(
        'a[href="/about-poikatsu"]'
      ) as HTMLElement | null;
      const heroActionRow = aboutLink?.parentElement;
      if (aboutLink && heroActionRow instanceof HTMLElement) {
        heroActionRow.style.display = "flex";
        heroActionRow.style.flexDirection = "column";
        heroActionRow.style.alignItems = "flex-start";
        heroActionRow.style.gap = "1rem";
        aboutLink.style.marginTop = "0";
        aboutLink.style.fontSize = "0.95rem";
        aboutLink.style.padding = "0.75rem 1.5rem";
      }

      const tabButtons = Array.from(document.querySelectorAll("button")).filter(
        (button) => {
          const text = compactText(button);
          return text === "注目ポイ活ランキング" || text === "無料ポイ活特集";
        }
      ) as HTMLButtonElement[];
      const tabContainer = tabButtons[0]?.parentElement;
      if (tabContainer instanceof HTMLElement && tabButtons.length >= 2) {
        tabContainer.style.display = "flex";
        tabContainer.style.gap = "0";
        tabContainer.style.padding = "0";
        tabContainer.style.borderRadius = "1.25rem";
        tabContainer.style.overflow = "hidden";
        tabContainer.style.background = "#ffffff";
        tabContainer.style.border = "1px solid #f9cfe2";
        tabContainer.style.boxShadow = "0 10px 24px rgba(236, 72, 153, 0.10)";

        tabButtons.forEach((button) => {
          const isActive = button.className.toString().includes("text-white");
          button.style.flex = "1 1 0";
          button.style.minHeight = "58px";
          button.style.borderRadius = "0";
          button.style.background = "transparent";
          button.style.boxShadow = "none";
          button.style.color = isActive ? "#111827" : "#64748b";
          button.style.borderBottom = isActive
            ? "4px solid #ec4899"
            : "4px solid transparent";
          button.style.fontWeight = isActive ? "900" : "800";
        });
      }

      const heroCopy = header?.querySelector("h1 + div p") as HTMLElement | null;
      if (heroCopy && heroCopy.dataset.copyAdjusted !== "true") {
        heroCopy.innerHTML =
          "「Google検索」のデータをもとに、" +
          '<span class="text-pink-600">いま世間で注目されているポイ活</span>' +
          "をAIが判定し、" +
          '<span class="text-pink-600">毎日更新</span>' +
          "しています" +
          '<span class="text-[#27313f]">（0:00～1:00頃）</span>';
        heroCopy.dataset.copyAdjusted = "true";
      }

      header?.querySelectorAll("a, button, div, span").forEach((element) => {
        const text = compactText(element);
        if (!text.includes("無料でできるポイ活特集")) return;

        const removable = element.closest("a, button") ||
          (element instanceof HTMLElement && element.children.length <= 1 ? element : null);
        if (removable instanceof HTMLElement) {
          removable.style.display = "none";
          removable.setAttribute("aria-hidden", "true");
        }
      });

      const freePage = document.querySelector("main.min-h-screen") as HTMLElement | null;
      const isFreePanel = Boolean(freePage?.textContent?.includes("無料でできるポイ活一覧"));
      if (!freePage || !isFreePanel) return;

      const firstFreeSection = freePage.querySelector("section:first-child");
      firstFreeSection?.querySelectorAll("img, picture").forEach((element) => {
        hideReactOwnedElement(element);
      });

      firstFreeSection?.querySelectorAll("div").forEach((element) => {
        const text = compactText(element);
        if (
          text.includes("モッピーでポイ活を始める") &&
          text.includes("広告・紹介リンク")
        ) {
          hideReactOwnedElement(element);
        }
      });

      freePage.querySelectorAll("div, span").forEach((element) => {
        const text = (element.textContent || "").trim();
        if (text === "ポイ活サイト最大手！" || text === "最大手！" || text === "最大手") {
          element.textContent = "ポイ活サイト最大手！";
          const target = element as HTMLElement;
          target.style.display = "inline-flex";
          target.style.alignItems = "center";
          target.style.justifyContent = "center";
          target.style.width = "fit-content";
          target.style.maxWidth = "fit-content";
          target.style.marginLeft = "auto";
          target.style.marginRight = "auto";
          target.style.paddingLeft = "1.5rem";
          target.style.paddingRight = "1.5rem";
          target.style.paddingTop = "0.5rem";
          target.style.paddingBottom = "0.5rem";
          target.style.borderRadius = "9999px";
          target.style.whiteSpace = "nowrap";
          target.style.background = "#ec4899";
          target.style.color = "#ffffff";
          target.style.boxShadow = "0 10px 22px rgba(236, 72, 153, 0.28)";
        }
      });

      freePage.querySelectorAll("section article p").forEach((element) => {
        const text = (element.textContent || "").trim();
        if (text && !text.startsWith("※")) {
          hideReactOwnedElement(element);
        }
      });
    };

    const handleMoppyButtonClick = async (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const text = compactText(target);
      if (
        text.includes("無料ポイ活特集") ||
        text.includes("無料でできるポイ活特集") ||
        text.includes("注目ポイ活ランキング")
      ) {
        window.setTimeout(applyAdjustments, 100);
        window.setTimeout(applyAdjustments, 500);
        window.setTimeout(applyAdjustments, 1200);
      }

      const button = target.closest("button");
      if (!button || !(button.textContent || "").includes("モッピーで探す")) return;

      const article = button.closest("article");
      const offerName = article?.querySelector("h3")?.textContent?.trim();
      if (!article || !offerName) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const openedWindow = window.open("", "_blank");
      const items = await getScoreItems();
      const matchedItem = findMatchedScoreItem(items, offerName);
      const url = await resolveMoppyDetailUrl(
        offerName,
        matchedItem?.primary_site_url
      );

      try {
        await fetch("/api/click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: matchedItem?.category || offerName,
            site_name: "モッピー",
          }),
        });
      } catch (error) {}

      if (openedWindow) {
        openedWindow.opener = null;
        openedWindow.location.href = url;
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    };

    const timers = [0, 500, 1200, 2400, 4000].map((delay) =>
      window.setTimeout(applyAdjustments, delay)
    );
    document.addEventListener("click", handleMoppyButtonClick, true);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      document.removeEventListener("click", handleMoppyButtonClick, true);
    };
  }, []);

  return null;
}
