const MOPPY_BANNER_URL = "https://img.moppy.jp/pub/pc/friend/300x250-1.jpg";
const MOPPY_BANNER_ALT =
  "累計会員数1,400万人突破！内職/副業/お小遣い稼ぎするならモッピー！";
const MOPPY_RESOLVE_TIMEOUT_MS = 3500;

const isMoppyDetailUrl = (url?: string | null) => {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return parsed.hostname === "pc.moppy.jp" && parsed.pathname === "/ad/detail.php";
  } catch {
    return false;
  }
};

const isMoppyOutboundUrl = (url?: string | null) => {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "pc.moppy.jp" &&
      (parsed.pathname === "/ad/detail.php" ||
        parsed.pathname === "/entry/invite.php" ||
        parsed.pathname.startsWith("/search/"))
    );
  } catch {
    return false;
  }
};

const resolveMoppyUrl = async (detailUrl: string) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    MOPPY_RESOLVE_TIMEOUT_MS
  );

  try {
    const params = new URLSearchParams({ url: detailUrl });
    const response = await fetch(`/api/moppy-url?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    });
    const json = await response.json();

    return isMoppyOutboundUrl(json.url) ? (json.url as string) : detailUrl;
  } catch {
    return detailUrl;
  } finally {
    window.clearTimeout(timeout);
  }
};

const bootMoppyOutboundRewrite = () => {
  if (typeof window === "undefined") return;
  if ((window as Window & { __poikatuMoppyOpenPatched?: boolean }).__poikatuMoppyOpenPatched) {
    return;
  }

  const patchedWindow = window as Window & {
    __poikatuMoppyOpenPatched?: boolean;
  };
  const originalOpen = window.open.bind(window);

  patchedWindow.__poikatuMoppyOpenPatched = true;
  window.open = ((url?: string | URL, target?: string, features?: string) => {
    const urlString = typeof url === "string" ? url : url?.toString();
    if (!isMoppyDetailUrl(urlString)) {
      return originalOpen(url as string | URL | undefined, target, features);
    }

    const openedWindow = originalOpen("", target || "_blank", features);
    const fallbackUrl = urlString!;

    resolveMoppyUrl(fallbackUrl).then((resolvedUrl) => {
      if (openedWindow) {
        openedWindow.opener = null;
        openedWindow.location.href = resolvedUrl;
      } else {
        originalOpen(resolvedUrl, target || "_blank", features);
      }
    });

    return openedWindow;
  }) as typeof window.open;
};

const bootMoppyCtaAdjustments = () => {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const updateMoppyCtas = () => {
    document.querySelectorAll("section").forEach((section) => {
      if (section.querySelector(".moppy-ranking-card")) return;

      const moppyLink = section.querySelector<HTMLAnchorElement>(
        'a[href*="pc.moppy.jp/entry/invite.php"]'
      );
      if (!moppyLink || moppyLink.closest(".moppy-ranking-card")) return;

      const copy = Array.from(section.querySelectorAll("p")).find((element) => {
        const text = element.textContent || "";
        return text.includes("はじめての人は") && text.includes("会員登録");
      });
      if (copy && copy.getAttribute("data-moppy-copy-updated") !== "true") {
        copy.innerHTML =
          'はじめての人は、<span style="color:#e6007e;font-weight:950;">業界最大手</span>のモッピーの<span style="color:#e6007e;font-weight:950;">会員登録（無料）</span>からスタート';
        copy.setAttribute("data-moppy-copy-updated", "true");
      }

      if (section.querySelector(".moppy-official-banner")) return;

      const bannerLink = document.createElement("a");
      bannerLink.className = "moppy-official-banner";
      bannerLink.href = moppyLink.href;
      bannerLink.target = "_blank";
      bannerLink.rel = "noopener noreferrer";
      bannerLink.style.display = "block";
      bannerLink.style.width = "min(300px, 100%)";
      bannerLink.style.margin = "1.5rem auto 0";
      bannerLink.style.borderRadius = "18px";
      bannerLink.style.overflow = "hidden";
      bannerLink.style.boxShadow = "0 18px 36px rgba(236, 72, 153, 0.16)";

      const image = document.createElement("img");
      image.src = MOPPY_BANNER_URL;
      image.alt = MOPPY_BANNER_ALT;
      image.width = 300;
      image.height = 250;
      image.loading = "lazy";
      image.decoding = "async";
      image.style.display = "block";
      image.style.width = "100%";
      image.style.height = "auto";

      bannerLink.appendChild(image);
      moppyLink.insertAdjacentElement("beforebegin", bannerLink);
    });
  };

  const scheduleMoppyCtaUpdates = () => {
    updateMoppyCtas();
    [120, 400, 1000, 2200, 4200, 7000].forEach((delay) => {
      window.setTimeout(updateMoppyCtas, delay);
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleMoppyCtaUpdates, {
      once: true,
    });
  } else {
    scheduleMoppyCtaUpdates();
  }

  new MutationObserver(updateMoppyCtas).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
};

bootMoppyOutboundRewrite();
bootMoppyCtaAdjustments();

export {};
