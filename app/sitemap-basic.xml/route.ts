const BASE_URL = "https://poikatu-ai.vercel.app";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const now = new Date().toISOString();

  const urls = [
    {
      loc: BASE_URL,
      lastmod: now,
      changefreq: "daily",
      priority: "1.0",
    },
    {
      loc: `${BASE_URL}/about-poikatsu`,
      lastmod: now,
      changefreq: "weekly",
      priority: "0.9",
    },
    {
      loc: `${BASE_URL}/reviews/${encodeURIComponent("楽天カード")}`,
      lastmod: now,
      changefreq: "daily",
      priority: "0.7",
    },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
