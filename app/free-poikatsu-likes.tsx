"use client";

import { useEffect, useState } from "react";

type LikesResponse = {
  counts?: Record<string, number>;
  likeDate?: string;
};

let likesRequest: Promise<LikesResponse> | null = null;

const getLikes = () => {
  if (!likesRequest) {
    likesRequest = fetch("/api/likes", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { counts: {} }))
      .catch(() => ({ counts: {} }));
  }

  return likesRequest;
};

const getStorageKey = (offerName: string, likeDate: string) => {
  return `poikatu-liked:${likeDate || "today"}:${offerName}`;
};

type FreeOfferLikeButtonProps = {
  offerName: string;
  compact?: boolean;
};

export default function FreeOfferLikeButton({
  offerName,
  compact = false,
}: FreeOfferLikeButtonProps) {
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeDate, setLikeDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getLikes().then((data) => {
      if (!isMounted) return;

      const date = data.likeDate || "";
      setLikeDate(date);
      setCount(Math.max(0, Number(data.counts?.[offerName] || 0)));

      try {
        setLiked(window.localStorage.getItem(getStorageKey(offerName, date)) === "1");
      } catch {
        setLiked(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [offerName]);

  const toggleLike = async () => {
    if (isSaving) return;

    const nextLiked = !liked;
    const optimisticCount = Math.max(0, count + (nextLiked ? 1 : -1));

    setLiked(nextLiked);
    setCount(optimisticCount);
    setIsSaving(true);

    try {
      const key = getStorageKey(offerName, likeDate);
      if (nextLiked) {
        window.localStorage.setItem(key, "1");
      } else {
        window.localStorage.removeItem(key);
      }
    } catch {
      // localStorageが使えない環境でも、サーバー側の記録は続ける。
    }

    try {
      const response = await fetch("/api/likes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          offer_name: offerName,
          action: nextLiked ? "like" : "unlike",
        }),
      });

      if (!response.ok) throw new Error("Failed to save like");

      const data = await response.json();
      if (typeof data.count === "number") {
        setCount(Math.max(0, data.count));
      }
      if (typeof data.likeDate === "string") {
        setLikeDate(data.likeDate);
      }
    } catch {
      setLiked(!nextLiked);
      setCount(count);

      try {
        const key = getStorageKey(offerName, likeDate);
        if (!nextLiked) {
          window.localStorage.setItem(key, "1");
        } else {
          window.localStorage.removeItem(key);
        }
      } catch {
        // noop
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      type="button"
      aria-pressed={liked}
      onClick={toggleLike}
      disabled={isSaving}
      className={`flex items-center justify-center gap-2 border-2 font-black shadow-md transition hover:scale-105 disabled:cursor-wait disabled:opacity-70 ${
        compact
          ? "min-h-8 rounded-full px-3 py-1 text-xs"
          : "mt-4 min-h-[50px] w-full rounded-2xl px-4 text-sm"
      } ${
        liked
          ? "border-pink-500 bg-pink-500 text-white shadow-pink-100"
          : "border-pink-300 bg-white text-pink-600 shadow-pink-50 hover:bg-pink-50"
      }`}
    >
      <span aria-hidden="true">{liked ? "♥" : "♡"}</span>
      <span>{liked ? "いいね済み" : "いいね！"}</span>
      <span className={liked ? "text-white" : "text-pink-500"}> {count}</span>
    </button>
  );
}
