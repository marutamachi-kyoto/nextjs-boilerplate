export const dynamic = "force-dynamic";
export const revalidate = 0;

const MOPPY_ORIGIN = "https://pc.moppy.jp";
const MOPPY_FETCH_TIMEOUT_MS = 3500;
const MAX_SEARCH_CANDIDATES = 3;
const MIN_IMAGE_SCORE = 100;

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

const normalizeForMatch = (value?: string | null) => {
  return (value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[\u300c\u300d\u300e\u300f\u3010\u3011\[\]\uff08\uff09()\u30fb\uff65]/g, "")
    .replace(/[\u30fc\uff70\u2212]/g, "-")
    .trim();
};

const getSearchCandidates = (offerName: string) => {
  const candidates = new Set<string>();
  const add = (value: string) => {
    const candidate = normalizeSpaces(value);
    if (candidate.length >= 2) candidates.add(candidate);
  };

  add(offerName);
  add(
    offerName
      .replace(/\u3010[^\u3011]*\u3011/g, " ")
      .replace(/\[[^\]]*\]/g, " ")
      .replace(/\uff1c[^\uff1e]*\uff1e/g, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/\u203b[^\u203b]*\u203b/g, " ")
      .replace(/\u2605[^\s\u3000]*/g, " ")
      .replace(/[\uff08(][^\uff09)]*[\uff09)]/g, " ")
  );
  add(offerName.split(/[\uff08(]/)[0]);
  offerName.split(/[\uff0f/]/).forEach(add);

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

const isHardBlockedImageUrl = (url?: string) => {
  if (!url) return true;

  const lowerUrl = url.toLowerCase();
  const blockedPatterns = [
    "ad-track.jp/ad/p/img",
    "ad-track.jp/ad/p/",
    "doubleclick",
    "pixel",
    "1x1",
    "qr.php",
    "hamburger-menu",
    "icon_square",
    "global/common/icon",
    "global/pc/lp/common",
    "cashback/logo",
    "aboutmoppy",
    "loading",
    "noimage",
  ];

  return blockedPatterns.some((pattern) => lowerUrl.includes(pattern));
};

const getAttribute = (html: string, attributeName: string) => {
  const match = html.match(new RegExp(`${attributeName}=["']([^"']+)["']`, "i"));
  return match ? decodeHtmlEntities(match[1]) : "";
};

const scoreImageCandidate = (tag: string, imageUrl: string, offerName: string) => {
  if (isHardBlockedImageUrl(imageUrl)) return -1;

  const alt = getAttribute(tag, "alt");
  const gaLabel = getAttribute(tag, "data-ga-label");
  const gaAction = getAttribute(tag, "data-ga-action");
  const normalizedOffer = normalizeForMatch(offerName);
  const normalizedAlt = normalizeForMatch(alt);
  const normalizedLabel = normalizeForMatch(gaLabel);
  let score = 0;

  if (normalizedOffer) {
    if (normalizedAlt && (normalizedAlt.includes(normalizedOffer) || normalizedOffer.includes(normalizedAlt))) {
      score += 120;
    }
    if (normalizedLabel && (normalizedLabel.includes(normalizedOffer) || normalizedOffer.includes(normalizedLabel))) {
      score += 120;
    }
  }
  if (gaAction.includes("広告バナー")) score += 100;
  if (imageUrl.includes("h.accesstrade.net")) score += 70;
  if (imageUrl.includes("/ad/")) score += 30;
  if (imageUrl.includes("banner")) score += 20;
  if (imageUrl.includes("global/banners")) score -= 80;

  return score;
};

const getImageUrl = (html: string, baseUrl: string, offerName: string) => {
  const imageMatches = [...html.matchAll(/<img\b[^>]+src=["']([^"']+)["'][^>]*>/gi)];
  const candidates = imageMatches
    .map((match) => {
      const tag = match[0];
      const imageUrl = toAbsoluteUrl(match[1], baseUrl);
      return { imageUrl, score: scoreImageCandidate(tag, imageUrl, offerName) };
    })
    .filter((candidate) => candidate.score >= MIN_IMAGE_SCORE)
    .sort((a, b) => b.score - a.score);

  if (candidates[0]) return candidates[0].imageUrl;

  const ogImage = html.match(/<meta\b[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1];
  const absoluteOgImage = ogImage ? toAbsoluteUrl(ogImage, baseUrl) : undefined;
  if (!isHardBlockedImageUrl(absoluteOgImage)) return absoluteOgImage || null;

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
  const imageUrl = html ? getImageUrl(html, detailUrl, offerName) : null;

  return Response.json(
    { imageUrl, url: detailUrl, resolved: Boolean(imageUrl) },
    { headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate=3600" } }
  );
}
