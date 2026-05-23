const siteUrl = "https://poikatu-ai.vercel.app";

const reviewPaths = [
  "%E6%A5%BD%E5%A4%A9%E3%82%AB%E3%83%BC%E3%83%89",
  "PayPay%E3%82%AB%E3%83%BC%E3%83%89",
  "U-NEXT",
  "%E6%A5%BD%E5%A4%A9%E3%83%A2%E3%83%90%E3%82%A4%E3%83%AB",
  "SBI%E8%A8%BC%E5%88%B8",
  "%E6%A5%BD%E5%A4%A9%E9%8A%80%E8%A1%8C",
  "NURO%E5%85%89",
  "d%E3%82%AB%E3%83%BC%E3%83%89",
  "%E4%B8%89%E4%BA%95%E4%BD%8F%E5%8F%8B%E3%82%AB%E3%83%BC%E3%83%89",
  "au%20PAY%20%E3%82%AB%E3%83%BC%E3%83%89",
  "%E3%82%A4%E3%82%AA%E3%83%B3%E3%82%AB%E3%83%BC%E3%83%89",
  "JCB%E3%82%AB%E3%83%BC%E3%83%89W",
  "%E3%82%A8%E3%83%9D%E3%82%B9%E3%82%AB%E3%83%BC%E3%83%89",
  "%E3%83%AA%E3%82%AF%E3%83%AB%E3%83%BC%E3%83%88%E3%82%AB%E3%83%BC%E3%83%89",
  "%E6%A5%BD%E5%A4%A9%E5%B8%82%E5%A0%B4",
  "Amazon",
  "Yahoo!%E3%82%B7%E3%83%A7%E3%83%83%E3%83%94%E3%83%B3%E3%82%B0",
  "d%E6%89%95%E3%81%84",
  "au%20PAY",
  "TikTok%20Lite",
];

const buildUrl = (path = "") => `${siteUrl}${path}`;

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const urlEntry = (url: string, changefreq: string, priority: number) => `  <url>
    <loc>${escapeXml(url)}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`;

export const revalidate = 86400;

export function GET() {
  const urls = [
    urlEntry(buildUrl("/"), "daily", 1),
    urlEntry(buildUrl("/about-poikatsu"), "monthly", 0.8),
    urlEntry(buildUrl("/free-poikatsu"), "daily", 0.9),
    ...reviewPaths.map((path) =>
      urlEntry(buildUrl(`/reviews/${path}`), "weekly", 0.7)
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
