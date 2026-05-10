import { MetadataRoute } from "next";

const BASE_URL = "https://poikatu-ai.vercel.app";

const offers = [
  "rakuten-mobile",
  "nobunaga-hadou",
  "smbc-card-nl",
  "paypay-card",
  "tiktok-lite",
  "rakuten-sec",
  "rakuten-market",
  "sbi-sumishin-bank",
  "amazon-prime",
  "merge-mansion",
  "u-next",
  "d-card-gold",
  "saison-card-international",
  "au-kabucom-sec",
  "ponta-pass",
  "mercari",
  "line-manga",
  "epos-card",
  "monex-sec",
  "aeon-card-waon",
  "ahamo",
  "youtube-premium",
  "mynapoint-support",
  "dbarai",
  "yahoo-card",
  "sony-bank",
  "nanatsu-grand-cross",
  "bluelock-pwc",
  "trima",
  "visa-line-pay-card",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const offerUrls = offers.map((slug) => ({
    url: `${BASE_URL}/offers/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },

    ...offerUrls,
  ];
}
