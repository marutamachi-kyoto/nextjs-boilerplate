export const dynamic = "force-dynamic";
export const revalidate = 0;

const MOPPY_ORIGIN = "https://pc.moppy.jp";
const MOPPY_FETCH_TIMEOUT_MS = 2200;
const MAX_SEARCH_CANDIDATES = 3;

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

const normalizeSpaces = (value: string) => value.replace(/\s+/g, " ").trim();

const getSearchCandidates = (offerName: string) => {
  const candidates = new Set<string>();
  const add = (value: string) => {
    const candidate = normalizeSpaces(value);
    if (candidate.length >= 2) candidates.add(candidate);
  };

  add(offerName);

  const withoutDecorations = offerName
    .replace(/【[^】]*】/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/＜[^＞]*＞/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/※[^※]*※/g, " ")
    .replace(/★[^\s　]*/g, " ")
    .replace(/[（(][^）)]*[）)]/g, " ");
  add(withoutDecorations);

  const beforeParen = offerName.split(/[（(]/)[0];
  add(beforeParen);

  const withoutRewardText = offerName
    .replace(/[0-9０-９,，]+\s*(円|P|ポイント|pt|相当)/gi, " ")
    .replace(/合計|最大|最短|限定|無料|高還元|超還元|新規|専用/g, " ");
  add(withoutRewardText);

  const slashParts = offerName.split(/[／/]/).map((part) => normalizeSpaces(part));
  slashParts.forEach(add);

  return Array.from(candidates).slice(0, MAX_SEARCH_CANDIDATES);
};

async function resolveDetailUrl(searchUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MOPPY_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(searchUrl, {
      cache: "no-store",
      signal: controller.signal,
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
  } catch (error) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
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

  const searchUrls = new Set<string>();
  if (isMoppySearchUrl(providedUrl)) searchUrls.add(providedUrl);
  if (offerName) {
    getSearchCandidates(offerName).forEach((candidate) => {
      searchUrls.add(getMoppySearchUrl(candidate));
    });
  }

  if (searchUrls.size === 0) {
    return Response.json(
      { url: null, resolved: false, error: "offer is required" },
      {
        status: 400,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    );
  }

  const results = await Promise.all(
    Array.from(searchUrls).map(async (searchUrl) => ({
      searchUrl,
      detailUrl: await resolveDetailUrl(searchUrl),
    }))
  );
  const resolved = results.find((result) => result.detailUrl);

  if (resolved?.detailUrl) {
    return Response.json(
      { url: resolved.detailUrl, resolved: true, searchUrl: resolved.searchUrl },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }

  return Response.json(
    { url: null, resolved: false, searchUrl: Array.from(searchUrls)[0] },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
  );
}
