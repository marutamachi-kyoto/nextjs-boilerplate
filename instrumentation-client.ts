const MOPPY_BANNER_URL = "https://img.moppy.jp/pub/pc/friend/300x250-1.jpg";
const MOPPY_BANNER_ALT =
  "累計会員数1,400万人突破！内職/副業/お小遣い稼ぎするならモッピー！";

const bootMoppyCtaAdjustments = () => {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const updateMoppyCtas = () => {
    document.querySelectorAll("section").forEach((section) => {
      const moppyLink = section.querySelector<HTMLAnchorElement>(
        'a[href*="pc.moppy.jp/entry/invite.php"]'
      );
      if (!moppyLink) return;

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

bootMoppyCtaAdjustments();

export {};
