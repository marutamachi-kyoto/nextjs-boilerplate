import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://poikatu-ai.vercel.app";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SitemapPage = {
  url: string;
  lastModified: Date;
  changeFrequency: "daily" | "weekly" | "monthly";
  priority: number;
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function getLatestRankingUpdatedAt() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) return new Date();

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabase
      .from("rankings")
      .select("updated_at")
      .not("updated_at", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data?.updated_at) return new Date();
    return new Date(data.updated_at);
  } catch {
    return new Date();
  }
}

function getPages(lastModified: Date): SitemapPage[] {
  return [
    {
      url: BASE_URL,
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/about-poikatsu`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
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
  const lastModified = await getLatestRankingUpdatedAt();

  return new Response(renderSitemapXml(getPages(lastModified)), {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
