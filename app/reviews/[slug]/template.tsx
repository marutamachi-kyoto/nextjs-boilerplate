import Script from "next/script";

const reviewBackButtonScript = `
(() => {
  const updateReviewPageChrome = () => {
    const links = Array.from(document.querySelectorAll('a[href="/#ranking-section"]'));

    links.forEach((link) => {
      const text = (link.textContent || "").trim();
      if (!text.includes("ランキングに戻る")) return;

      link.setAttribute("href", "/");
      link.textContent = "← TOPページに戻る";
      link.className = "mb-6 inline-flex min-h-[54px] items-center justify-center rounded-full border-2 border-slate-200 bg-white px-6 text-base font-black text-slate-700 shadow-lg transition hover:scale-105 hover:bg-slate-50";
    });

    Array.from(document.querySelectorAll("main section p")).forEach((element) => {
      const text = (element.textContent || "").trim();
      if (!text.endsWith("のポイ活") && text !== "ポイ活") return;
      if (!element.className.includes("rounded-full")) return;
      element.remove();
    });
  };

  updateReviewPageChrome();
  [300, 900, 1800, 3200].forEach((delay) => window.setTimeout(updateReviewPageChrome, delay));
})();
`;

export default function ReviewTemplate({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Script
        id="review-back-button-normalizer"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: reviewBackButtonScript }}
      />
    </>
  );
}
