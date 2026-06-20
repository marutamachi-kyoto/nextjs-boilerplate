const BASE_URL = "https://poikatu-ai.vercel.app";

export const revalidate = 3600;

type SitemapPage = {
  url: string;
  lastModified: Date;
  changeFrequency: "daily" | "weekly" | "monthly";
  priority: number;
};

const OFFER_SLUGS = [
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

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getPages(now: Date): SitemapPage[] {
  return [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/about-poikatsu`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...OFFER_SLUGS.map((slug) => ({
      url: `${BASE_URL}/offers/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}

function renderSitemapXml(pages: SitemapPage[]) {
  const urls = pages
    .map((page) =>
      [
        "  <url>",
        `    <loc>${escapeXml(page.url)}</loc>`,
        `    <lastmod>${page.lastModified.toISOString()}</lastmod>`,
        `    <changefreq>${page.changeFrequency}</changefreq>`,
        `    <priority>${page.priority.toFixed(1)}</priority>`,
        "  </url>",
      ].join("\n")
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export async function GET() {
  return new Response(renderSitemapXml(getPages(new Date())), {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
