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
    .replace(/[「」『』【】\[\]（）()・･]/g, "")
    .replace(/[ーｰ−]/g, "-")
    .trim();
};

const isDirectMoppyUrl = (url?: string) => {
  return Boolean(
    url && url.includes("pc.moppy.jp/") && !url.includes("/entry/invite.php")
  );
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

export default function ClientAdjustments() {
  useEffect(() => {
    const applyAdjustments = () => {
      const header = document.querySelector("header");
      if (!header) return;

      const heroCopy = Array.from(header.querySelectorAll("p")).find((paragraph) => {
        const text = paragraph.textContent || "";
        return (
          text.includes("ランキングに反映しています") ||
          text.includes("毎日更新しています")
        );
      });

      if (heroCopy && heroCopy.getAttribute("data-copy-adjusted") !== "true") {
        heroCopy.innerHTML =
          "「Google検索」のデータをもとに、" +
          '<span class="text-pink-600">いま世間で注目されているポイ活</span>' +
          "をAIが判定し、" +
          '<span class="text-pink-600">毎日更新</span>' +
          "しています" +
          '<span class="text-[#27313f]">（0:00～1:00頃）</span>';
        heroCopy.setAttribute("data-copy-adjusted", "true");
      }

      Array.from(header.querySelectorAll("a, button")).forEach((element) => {
        const text = (element.textContent || "").replace(/\s+/g, "");
        if (text.includes("無料でできるポイ活特集")) {
          element.remove();
        }
      });

      Array.from(document.querySelectorAll("main div, section div")).forEach((element) => {
        if (element.getAttribute("data-promo-removed") === "true") return;
        const text = (element.textContent || "").replace(/\s+/g, "");
        if (
          text.includes("ポイ活サイト最大手") &&
          text.includes("モッピーでポイ活を始める") &&
          text.includes("会員登録")
        ) {
          element.setAttribute("data-promo-removed", "true");
          element.remove();
        }
      });

      Array.from(document.querySelectorAll("main span, main div")).forEach((element) => {
        const htmlElement = element as HTMLElement;
        if (htmlElement.dataset.labelAdjusted === "true") return;
        const text = (element.textContent || "").trim();
        if (text === "ポイ活サイト最大手！" || text === "最大手！") {
          element.textContent = "最大手";
          htmlElement.dataset.labelAdjusted = "true";
          htmlElement.style.display = "inline-flex";
          htmlElement.style.width = "fit-content";
          htmlElement.style.maxWidth = "fit-content";
          htmlElement.style.paddingLeft = "1rem";
          htmlElement.style.paddingRight = "1rem";
        }
      });

      const updatedAtBadge = Array.from(header.querySelectorAll("div")).find((element) => {
        const text = (element.textContent || "").trim();
        const childDivCount = element.querySelectorAll("div").length;
        return text.startsWith("最終更新") && childDivCount === 0;
      });
      const aboutLink = Array.from(header.querySelectorAll("a")).find((element) =>
        (element.textContent || "").includes("ポイ活とは？")
      );

      if (updatedAtBadge?.parentElement && aboutLink) {
        const group = updatedAtBadge.parentElement as HTMLElement;
        group.style.display = "flex";
        group.style.flexWrap = "wrap";
        group.style.alignItems = "center";
        group.style.gap = "1rem";
        group.style.marginTop = "2rem";
        aboutLink.style.marginTop = "0";
        aboutLink.style.marginLeft = "0";
        if (aboutLink.previousElementSibling !== updatedAtBadge) {
          updatedAtBadge.insertAdjacentElement("afterend", aboutLink);
        }
      }
    };

    const handleMoppyButtonClick = async (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

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
      const url = isDirectMoppyUrl(matchedItem?.primary_site_url)
        ? matchedItem!.primary_site_url!
        : MOPPY_INVITE_URL;

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

    const timers = [0, 300, 1000].map((delay) =>
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
