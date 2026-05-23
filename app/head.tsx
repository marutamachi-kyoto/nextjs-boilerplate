export default function Head() {
  return (
    <>
      <style>{`
        @media (max-width: 720px) {
          body header div:has(> a[href="/about-poikatsu"]) {
            grid-template-columns: 1fr !important;
            justify-content: stretch !important;
            overflow-x: visible !important;
            gap: 0.8rem !important;
          }
          body header a[href="/about-poikatsu"],
          body header a[href="/free-poikatsu"] {
            width: 100% !important;
            max-width: 100% !important;
          }
          main article {
            text-align: center !important;
          }
          main article h3,
          main article p {
            text-align: center !important;
          }
          main article > div,
          main article div:has(> h3),
          main article div:has(> a[href*="/reviews/"]),
          main article div:has(> button) {
            justify-items: center !important;
            align-items: center !important;
          }
          main article .ranking-image-box {
            margin-left: auto !important;
            margin-right: auto !important;
          }
        }
      `}</style>
    </>
  );
}
