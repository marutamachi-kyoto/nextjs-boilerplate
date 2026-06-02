"use client";

import { useEffect } from "react";

type RelatedWordsResponse = {
  words?: unknown[];
};

const CONCURRENCY = 4;

const getReasonParagraph = (article: HTMLElement) => {
  const heading = article.querySelector("h3");
  return heading?.parentElement?.parentElement?.querySelector("p") || null;
};

const renderReason = (paragraph: HTMLParagraphElement, words: string[]) => {
  if (words.length < 2) return;

  const first = document.createElement("span");
  first.className = "trend-reason-keyword";
  first.textContent = `「${words[0]}」`;

  const second = document.createElement("span");
  second.className = "trend-reason-keyword";
  second.textContent = `「${words[1]}」`;

  paragraph.replaceChildren(
    "Googleの検索で",
    first,
    "や",
    second,
    "が一緒に調べられています。"
  );
};

export default function RankingRelatedReasons() {
  useEffect(() => {
    let cancelled = false;
    const articles = Array.from(
      document.querySelectorAll<HTMLElement>('main article[id^="ranking-"]')
    );

    const updateReasons = async () => {
      let nextIndex = 0;

      await Promise.all(
        Array.from({ length: CONCURRENCY }, async () => {
          while (!cancelled && nextIndex < articles.length) {
            const article = articles[nextIndex];
            nextIndex += 1;

            const offerName = article.querySelector("h3")?.textContent?.trim();
            const paragraph = getReasonParagraph(article);
            if (!offerName || !paragraph) continue;

            try {
              const params = new URLSearchParams({ offer: offerName });
              const response = await fetch(`/api/related-search-words?${params.toString()}`, {
                cache: "no-store",
              });
              if (!response.ok) continue;

              const json = (await response.json()) as RelatedWordsResponse;
              const words = Array.isArray(json.words)
                ? json.words.filter((word): word is string => typeof word === "string")
                : [];

              if (!cancelled) renderReason(paragraph, words.slice(0, 2));
            } catch {}
          }
        })
      );
    };

    updateReasons();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
