"use client";

import { useEffect } from "react";

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

      if (heroCopy) {
        heroCopy.innerHTML =
          "「Google検索」のデータをもとに、いま世間で注目されているポイ活をAIが判定し、" +
          '<span class="text-pink-600">毎日更新</span>' +
          "しています" +
          '<span class="text-[#27313f]">（0:00～1:00頃）</span>';
      }

      Array.from(header.querySelectorAll("a, button")).forEach((element) => {
        const text = (element.textContent || "").replace(/\s+/g, "");
        if (text.includes("無料でできるポイ活特集")) {
          element.remove();
        }
      });
    };

    applyAdjustments();

    const observer = new MutationObserver(applyAdjustments);
    observer.observe(document.documentElement, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
