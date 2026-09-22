// Viewer-only adapter. The historical script.js, style.css and index.html stay untouched.
(() => {
  "use strict";
  const allowed = new Set([
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Space",
  ]);
  const pressed = new Set();
  const keyFor = (code) => (code === "Space" ? " " : code);
  function dispatch(code, down) {
    document.dispatchEvent(
      new KeyboardEvent(down ? "keydown" : "keyup", {
        code,
        key: keyFor(code),
        bubbles: true,
        cancelable: true,
      }),
    );
  }
  function release() {
    for (const code of [...pressed]) dispatch(code, false);
  }
  document.addEventListener(
    "keydown",
    (event) => {
      if (allowed.has(event.code)) {
        event.preventDefault();
        pressed.add(event.code);
      }
      if (event.code === "Escape") {
        release();
        parent.postMessage({ type: "cat-exit" }, "*");
      }
    },
    true,
  );
  document.addEventListener(
    "keyup",
    (event) => {
      pressed.delete(event.code);
    },
    true,
  );
  window.addEventListener("blur", release);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) release();
  });
  window.addEventListener("message", (event) => {
    if (
      event.source !== parent ||
      event.data?.type !== "cat-key" ||
      !allowed.has(event.data.code) ||
      typeof event.data.pressed !== "boolean"
    )
      return;
    dispatch(event.data.code, event.data.pressed);
  });
  document
    .getElementById("prev-cat")
    .setAttribute("aria-label", "Previous cat");
  document.getElementById("next-cat").setAttribute("aria-label", "Next cat");
  parent.postMessage({ type: "cat-ready" }, "*");
})();
