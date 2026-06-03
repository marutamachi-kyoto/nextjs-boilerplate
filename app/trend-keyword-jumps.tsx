"use client";

import { useEffect } from "react";

type TrendTag = {
  word: string;
  target_offer_name?: string;
};

const normalizeText = (value?: string | null) => {
  return (value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[\u30fb\uff65]/g, "")
    .replace(/[\u30fc\uff70\u2212]/g, "-")
    .replace(/[\[\]\u3010\u3011!\uff01?\uff1f\u3002\u3001"' \u300c\u300d\u300e\u300f()\uff08\uff09]/g, "")
    .trim();
};

const findRankingArticle = (targetOfferName: string) => {
  const targetKey = normalizeText(targetOfferName);
  if (!targetKey) return null;

  const articles = Array.from(
    document.querySelectorAll<HTMLElement>('main article[id^="ranking-"]')
  );

  return (
    articles.find((article) => {
      const headingKey = normalizeText(article.querySelector("h3")?.textContent);
      return headingKey === targetKey;
    }) || null
  );
};

const PILL_CLASS =
  "rounded-full bg-pink-100 px-5 py-3 text-base font-black text-pink-600 underline decoration-2 underline-offset-4 transition hover:scale-105 hover:bg-pink-200 active:scale-95";

export default function TrendKeywordJumps() {
  useEffect(() => {
    const section = document.getElementById("trend-keywords");
    if (!section) return;

    const heading = section.querySelector("h2");
    if (heading) {
      heading.textContent =
        "\ud83d\udd0d \u3044\u307eGoogle\u691c\u7d22\u3055\u308c\u3066\u3044\u308b\u30dd\u30a4\u6d3b\u95a2\u9023\u30ef\u30fc\u30c9";
    }

    let tags: TrendTag[] = [];
    const tagContainer = section.querySelector<HTMLElement>(
      ".flex.flex-wrap.items-center.gap-3"
    );

    const renderTags = () => {
      if (!tagContainer || tags.length === 0) return;

      tagContainer.replaceChildren(
        ...tags.map((tag) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = PILL_CLASS;
          button.textContent = tag.word;
          return button;
        })
      );
    };

    fetch("/api/trends", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { data: [] }))
      .then((json) => {
        tags = Array.isArray(json.data) ? json.data : [];
        renderTags();
      })
      .catch(() => {});

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const control = target?.closest<HTMLAnchorElement | HTMLButtonElement>("a,button");
      if (!control || !section.contains(control)) return;

      const word = (control.textContent || "").trim();
      const matchedTag = tags.find((tag) => normalizeText(tag.word) === normalizeText(word));
      if (!matchedTag?.target_offer_name) return;

      const article = findRankingArticle(matchedTag.target_offer_name);
      if (!article) return;

      event.preventDefault();
      article.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    section.addEventListener("click", handleClick);

    return () => {
      section.removeEventListener("click", handleClick);
    };
  }, []);

  return null;
}
