const siteUrl = "https://poikatu-ai.vercel.app";

export const revalidate = 86400;

export function GET() {
const body = `User-agent: *
Allow: /
Disallow: /api/click
Disallow: /api/likes
Disallow: /api/update-rankings

Sitemap: ${siteUrl}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
