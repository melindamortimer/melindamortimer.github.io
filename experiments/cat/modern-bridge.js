// Viewer integration only. The archived game's source remains unchanged.
(() => {
  const loading = document.getElementById("loading-screen");
  const observer = new MutationObserver(announceReady);
  function announceReady() {
    if (!loading.classList.contains("is-active")) {
      observer.disconnect();
      parent.postMessage({ type: "cat-ready" }, location.origin);
    }
  }
  observer.observe(loading, { attributes: true, attributeFilter: ["class"] });
  announceReady();
  window.addEventListener("keydown", (event) => {
    if (event.shiftKey && event.code === "Escape") {
      event.preventDefault();
      parent.postMessage({ type: "cat-exit" }, location.origin);
    }
  });
})();
