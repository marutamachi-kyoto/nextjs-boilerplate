import Script from "next/script";

const freePoikatsuLinkScript = `
(() => {
  const insertFreePoikatsuLink = () => {
    const aboutLink = document.querySelector('a[href="/about-poikatsu"]');
    if (!aboutLink) return;
    if (document.querySelector('a[href="/free-poikatsu"]')) return;

    const link = document.createElement("a");
    link.href = "/free-poikatsu";
    link.className = aboutLink.className;
    link.style.color = "#e6007e";
    link.style.borderColor = "#ff9dcc";
    link.style.boxShadow = "0 12px 28px rgba(236, 15, 124, 0.12)";
    link.innerHTML = '<span style="display:inline-grid;width:1.6rem;height:1.6rem;place-items:center;border-radius:999px;background:linear-gradient(135deg,#ffd84d,#ff9f00);color:white;font-size:0.85rem;font-weight:900;margin-right:0.5rem;">0</span><span>無料でできるポイ活</span>';

    aboutLink.insertAdjacentElement("afterend", link);
  };

  const trimRankingKeywordDescriptions = () => {
    document.querySelectorAll("main article p").forEach((paragraph) => {
      const html = paragraph.innerHTML || "";
      const marker = "も一緒に調べられています。";
      if (!html.includes("Googleの検索動向で") || !html.includes(marker)) return;

      const endIndex = html.indexOf(marker) + marker.length;
      paragraph.innerHTML = html.slice(0, endIndex);
    });
  };

  const applyAdjustments = () => {
    insertFreePoikatsuLink();
    trimRankingKeywordDescriptions();
  };

  applyAdjustments();
  new MutationObserver(applyAdjustments).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });
})();
`;

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Script
        id="free-poikatsu-hero-link"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: freePoikatsuLinkScript }}
      />
    </>
  );
}
