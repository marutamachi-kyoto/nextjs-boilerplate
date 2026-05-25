"use client";

import { useEffect } from "react";

const quotePattern = /(「[^」]+」)/g;

const highlightQuotedKeywords = () => {
  document.querySelectorAll<HTMLElement>('article[id^="ranking-"] p').forEach((paragraph) => {
    if (paragraph.querySelector(".trend-reason-keyword")) return;

    const text = paragraph.textContent || "";
    if (!quotePattern.test(text)) {
      quotePattern.lastIndex = 0;
      return;
    }
    quotePattern.lastIndex = 0;

    const fragment = document.createDocumentFragment();
    text.split(quotePattern).forEach((part) => {
      if (!part) return;

      if (/^「[^」]+」$/.test(part)) {
        const span = document.createElement("span");
        span.className = "trend-reason-keyword";
        span.textContent = part;
        fragment.appendChild(span);
        return;
      }

      fragment.appendChild(document.createTextNode(part));
    });

    paragraph.replaceChildren(fragment);
  });
};

export default function OfferLikes() {
  useEffect(() => {
    let timer: number | null = null;

    const scheduleHighlight = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(highlightQuotedKeywords, 80);
    };

    scheduleHighlight();
    const observer = new MutationObserver(scheduleHighlight);

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      if (timer) window.clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return null;
}
