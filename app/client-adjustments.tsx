"use client";

import { useEffect } from "react";

const MOPPY_INVITE_URL =
  "https://pc.moppy.jp/entry/invite.php?invite=ut3GA1ce&openExternalBrowser=1";

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
    .replace(/[\u300c\u300d\u300e\u300f\u3010\u3011\[\]\uff08\uff09()\u30fb\uff65]/g, "")
    .replace(/[\u30fc\uff70\u2212]/g, "-")
    .trim();
};

const isMoppyOfferUrl = (url?: string) => {
  return Boolean(
    url && url.includes("pc.moppy.jp/") && !url.includes("/entry/invite.php")
  );
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

const textKey = (element: Element) => {
  return (element.textContent || "").replace(/\s+/g, "").trim();
};

export default function ClientAdjustments() {
  useEffect(() => {
    const applyAdjustments = () => {
      const header = document.querySelector("header");

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

      document.querySelectorAll('a, button').forEach((element) => {
        const text = textKey(element);
        if (text.includes("無料でできるポイ活特集")) {
          element.remove();
        }
      });

      const aboutLink = document.querySelector('header a[href="/about-poikatsu"]') as
        | HTMLElement
        | null;
      const updatedAtBadge = Array.from(
        document.querySelectorAll("header div, header span")
      ).find((element) => textKey(element).startsWith("最終更新：")) as
        | HTMLElement
        | undefined;

      if (updatedAtBadge && aboutLink) {
        const group = updatedAtBadge.parentElement as HTMLElement;
        if (group) {
          group.style.display = "flex";
          group.style.flexWrap = "wrap";
          group.style.alignItems = "center";
          group.style.gap = "0.75rem";
          group.style.marginTop = "2rem";
          group.style.width = "100%";
        }

        aboutLink.style.marginTop = "0";
        aboutLink.style.marginLeft = "0";
        aboutLink.style.padding = "0.65rem 1.1rem";
        aboutLink.style.fontSize = "0.875rem";
        aboutLink.style.lineHeight = "1.2";
        aboutLink.style.minHeight = "auto";
        aboutLink.style.width = "fit-content";
        aboutLink.style.boxShadow = "0 10px 20px rgba(15, 23, 42, 0.08)";
        const icon = aboutLink.querySelector("span") as HTMLElement | null;
        if (icon) {
          icon.style.fontSize = "1rem";
          icon.style.marginRight = "0.4rem";
        }
        if (aboutLink.previousElementSibling !== updatedAtBadge) {
          updatedAtBadge.insertAdjacentElement("afterend", aboutLink);
        }
      }

      const freePage = document.querySelector("main.min-h-screen") as HTMLElement | null;
      if (!freePage) return;

      const firstFreeSection = freePage.querySelector("section:first-child");
      firstFreeSection?.querySelectorAll("img, picture").forEach((element) => {
        (element as HTMLElement).style.display = "none";
      });

      firstFreeSection?.querySelectorAll("div").forEach((element) => {
        const text = textKey(element);
        if (
          text.includes("モッピーでポイ活を始める") &&
          text.includes("広告・紹介リンク")
        ) {
          element.remove();
        }
      });

      document.querySelectorAll("div, span").forEach((element) => {
        const text = (element.textContent || "").trim();
        if (text === "ポイ活サイト最大手！" || text === "最大手！") {
          element.textContent = "最大手";
          const target = element as HTMLElement;
          target.style.display = "inline-flex";
          target.style.width = "fit-content";
          target.style.maxWidth = "fit-content";
          target.style.paddingLeft = "0.85rem";
          target.style.paddingRight = "0.85rem";
          target.style.whiteSpace = "nowrap";
        }
      });

      freePage.querySelectorAll("section article p").forEach((element) => {
        const text = (element.textContent || "").trim();
        if (text && !text.startsWith("※")) {
          element.remove();
        }
      });
    };

    const handleMoppyButtonClick = async (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const text = textKey(target);
      if (text.includes("無料ポイ活特集") || text.includes("無料でできるポイ活特集")) {
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
      const url = isMoppyOfferUrl(matchedItem?.primary_site_url)
        ? matchedItem!.primary_site_url!
        : getMoppySearchUrl(offerName) || MOPPY_INVITE_URL;

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

    const timers = [0, 300, 800, 1600, 3000, 5000].map((delay) =>
      window.setTimeout(applyAdjustments, delay)
    );
    const observer = new MutationObserver(() => applyAdjustments());
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("click", handleMoppyButtonClick, true);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      observer.disconnect();
      document.removeEventListener("click", handleMoppyButtonClick, true);
    };
  }, []);

  return null;
}
