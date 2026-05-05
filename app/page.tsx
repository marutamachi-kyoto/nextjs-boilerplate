"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [data, setData] = useState<any>({});
  const [active, setActive] = useState("");

  useEffect(() => {
    fetch("/api/rankings")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        const first = Object.keys(json)[0];
        setActive(first);
      });
  }, []);

  const categories = Object.keys(data);
  const offers = data[active] || [];

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">ポイ活AI判定</h1>

      {/* カテゴリ */}
      <div className="flex gap-2 overflow-x-auto mb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-3 py-1 rounded-full ${
              active === cat ? "bg-red-500 text-white" : "bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ランキング */}
      {offers.map((o: any, i: number) => (
        <div key={i} className="bg-white p-3 rounded-xl mb-2 shadow">
          <div className="flex justify-between">
            <div>
              <span className="font-bold mr-2">{i + 1}位</span>
              {o.offer_title}
            </div>
            <div className="text-red-500 font-bold">
              {o.reward}円
            </div>
          </div>

          <a
            href={o.url}
            className="block mt-2 bg-red-500 text-white text-center py-2 rounded"
          >
            {o.point_site}で申し込む
          </a>
        </div>
      ))}
    </div>
  );
}
