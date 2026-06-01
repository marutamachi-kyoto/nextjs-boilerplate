export const dynamic = "force-dynamic";
export const revalidate = 0;

const MOPPY_ORIGIN = "https://pc.moppy.jp";
const MOPPY_FETCH_TIMEOUT_MS = 3500;
const MAX_SEARCH_CANDIDATES = 3;

const isMoppyDetailUrl = (url?: string | null) => {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return parsed.hostname === "pc.moppy.jp" && parsed.pathname === "/ad/detail.php";
  } catch {
    return false;
  }
};

const decodeHtmlEntities = (value: string) => {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2F;/gi, "/");
};

const toAbsoluteUrl = (url: string, baseUrl: string) => {
  const decodedUrl = decodeHtmlEntities(url.trim());

  try {
    return new URL(decodedUrl, baseUrl).toString();
  } catch {
    return decodedUrl;
  }
};

const normalizeSpaces = (value: string) => value.replace(/\s+/g, " ").trim();

const getSearchCandidates = (offerName: string) => {
  const candidates = new Set<string>();
  const add = (value: string) => {
    const candidate = normalizeSpaces(value);
    if (candidate.length >= 2) candidates.add(candidate);
  };

  add(offerName);
  add(
    offerName
      .replace(/【[^】]*】/g, " ")
      .replace(/\[[^\]]*\]/g, " ")
      .replace(/＜[^＞]*＞/g, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/※[^※]*※/g, " ")
      .replace(/★[^\s　]*/g, " ")
      .replace(/[（(][^）)]*[）)]/g, " ")
  );
  add(offerName.split(/[（(]/)[0]);
  offerName.split(/[／/]/).forEach(add);

  return Array.from(candidates).slice(0, MAX_SEARCH_CANDIDATES);
};

const fetchText = async (url: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MOPPY_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const resolveDetailUrl = async (offerName: string, providedUrl?: string | null) => {
  if (isMoppyDetailUrl(providedUrl)) return providedUrl!;

  for (const candidate of getSearchCandidates(offerName)) {
    const searchUrl = `${MOPPY_ORIGIN}/search/?word=${encodeURIComponent(candidate)}`;
    const html = await fetchText(searchUrl);
    if (!html) continue;

    const matches = html.matchAll(/href=["']([^"']*\/ad\/detail\.php[^"']*)["']/g);
    for (const match of matches) {
      const detailUrl = toAbsoluteUrl(match[1], MOPPY_ORIGIN);
      if (isMoppyDetailUrl(detailUrl)) return detailUrl;
    }
  }

  return null;
};

const isUsableImageUrl = (url?: string) => {
  if (!url) return false;

  const lowerUrl = url.toLowerCase();
  const blockedPatterns = [
    "ad-track.jp/ad/p/img",
    "ad-track.jp/ad/p/",
    "doubleclick",
    "pixel",
    "1x1",
    "logo",
    "icon",
    "loading",
    "noimage",
  ];

  return !blockedPatterns.some((pattern) => lowerUrl.includes(pattern));
};

const getImageUrl = (html: string, baseUrl: string) => {
  const imageMatches = [...html.matchAll(/<img\b[^>]+src=["']([^"']+)["'][^>]*>/gi)];

  for (const match of imageMatches) {
    const imageUrl = toAbsoluteUrl(match[1], baseUrl);
    if (isUsableImageUrl(imageUrl)) return imageUrl;
  }

  const ogImage = html.match(/<meta\b[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1];
  const absoluteOgImage = ogImage ? toAbsoluteUrl(ogImage, baseUrl) : undefined;
  if (isUsableImageUrl(absoluteOgImage)) return absoluteOgImage;

  return null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const offerName = (searchParams.get("offer") || "").trim();
  const providedUrl = (searchParams.get("url") || "").trim();

  if (!offerName) {
    return Response.json(
      { imageUrl: null, url: null, resolved: false, error: "offer is required" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const detailUrl = await resolveDetailUrl(offerName, providedUrl);
  if (!detailUrl) {
    return Response.json(
      { imageUrl: null, url: null, resolved: false },
      { headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate=3600" } }
    );
  }

  const html = await fetchText(detailUrl);
  const imageUrl = html ? getImageUrl(html, detailUrl) : null;

  return Response.json(
    { imageUrl, url: detailUrl, resolved: Boolean(imageUrl) },
    { headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate=3600" } }
  );
}
