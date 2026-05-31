export const dynamic = "force-dynamic";
export const revalidate = 0;

const MOPPY_ORIGIN = "https://pc.moppy.jp";

const isMoppySearchUrl = (url?: string | null) => {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return parsed.hostname === "pc.moppy.jp" && parsed.pathname.startsWith("/search/");
  } catch {
    return false;
  }
};

const isMoppyDetailUrl = (url?: string | null) => {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "pc.moppy.jp" && parsed.pathname === "/ad/detail.php"
    );
  } catch {
    return false;
  }
};

const getMoppySearchUrl = (offerName: string) => {
  return `${MOPPY_ORIGIN}/search/?word=${encodeURIComponent(offerName)}`;
};

const decodeHtmlEntities = (value: string) => {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
};

const toAbsoluteMoppyUrl = (href: string) => {
  const decodedHref = decodeHtmlEntities(href.trim());

  try {
    return new URL(decodedHref, MOPPY_ORIGIN).toString();
  } catch {
    return null;
  }
};

async function resolveDetailUrl(searchUrl: string) {
  const response = await fetch(searchUrl, {
    cache: "no-store",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) return null;

  const html = await response.text();
  const matches = html.matchAll(/href=["']([^"']*\/ad\/detail\.php[^"']*)["']/g);

  for (const match of matches) {
    const detailUrl = toAbsoluteMoppyUrl(match[1]);
    if (isMoppyDetailUrl(detailUrl)) return detailUrl;
  }

  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const offerName = (searchParams.get("offer") || "").trim();
  const providedUrl = (searchParams.get("url") || "").trim();

  if (isMoppyDetailUrl(providedUrl)) {
    return Response.json(
      { url: providedUrl, resolved: true },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }

  const searchUrl = isMoppySearchUrl(providedUrl)
    ? providedUrl
    : offerName
      ? getMoppySearchUrl(offerName)
      : "";

  if (!searchUrl) {
    return Response.json(
      { url: null, resolved: false, error: "offer is required" },
      {
        status: 400,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    );
  }

  try {
    const detailUrl = await resolveDetailUrl(searchUrl);

    return Response.json(
      { url: detailUrl, resolved: Boolean(detailUrl), searchUrl },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      { url: null, resolved: false, searchUrl },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }
}
