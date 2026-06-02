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
    .replace(/[・･]/g, "")
    .replace(/[ーｰ−]/g, "-")
    .replace(/[\[\]【】!！?？。、"'「」『』()（）]/g, "")
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

export default function TrendKeywordJumps() {
  useEffect(() => {
    const section = document.getElementById("trend-keywords");
    if (!section) return;

    const heading = section.querySelector("h2");
    if (heading) {
      heading.textContent = "🔍 Googleトレンド由来のポイ活関連ワード";
    }

    let tags: TrendTag[] = [];

    fetch("/api/trends", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { data: [] }))
      .then((json) => {
        tags = Array.isArray(json.data) ? json.data : [];
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
