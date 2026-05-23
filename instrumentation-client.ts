const updateMoppyCtaCopy = () => {
  document.querySelectorAll("section").forEach((section) => {
    const moppyLink = section.querySelector(
      'a[href*="pc.moppy.jp/entry/invite.php"]'
    );
    if (!moppyLink) return;

    const copy = Array.from(section.querySelectorAll("p")).find((element) => {
      const text = element.textContent || "";
      return text.includes("はじめての人は") && text.includes("会員登録");
    });
    if (!copy || copy.getAttribute("data-moppy-copy-updated") === "true") return;

    copy.innerHTML =
      'はじめての人は、<span style="color:#e6007e;font-weight:950;">業界最大手</span>のモッピーの<span style="color:#e6007e;font-weight:950;">会員登録（無料）</span>からスタート';
    copy.setAttribute("data-moppy-copy-updated", "true");
  });
};

const scheduleMoppyCtaCopyUpdates = () => {
  updateMoppyCtaCopy();
  [120, 400, 1000, 2200, 4200, 7000].forEach((delay) => {
    window.setTimeout(updateMoppyCtaCopy, delay);
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", scheduleMoppyCtaCopyUpdates, {
    once: true,
  });
} else {
  scheduleMoppyCtaCopyUpdates();
}

new MutationObserver(updateMoppyCtaCopy).observe(document.documentElement, {
  childList: true,
  subtree: true,
});

export {};
