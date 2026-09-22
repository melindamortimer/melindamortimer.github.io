(() => {
  "use strict";
  const builds = {
    may: {
      directory: "2025-05",
      title: "Gemini · May 2025 movement prototype",
      date: "May 19, 2025 · Movement prototype",
      instructions: "Arrow keys to move · Space to jump",
      alt: "May 2025 prototype: cat selector above a pale blue movement area.",
    },
    july: {
      directory: "2026-07",
      title: "GPT 5.6 Sol · July 2026 · Miso’s Moonlight Run",
      date: "July 2026 · GPT 5.6 Sol · Miso’s Moonlight Run",
      instructions:
        "A/D or arrows to move · Space to jump · Shift to pounce · Esc to pause · Shift+Esc to leave game",
      alt: "Miso’s Moonlight Run: an illustrated moonlit rooftop platformer.",
      modern: true,
    },
  };
  const get = (id) => document.getElementById(id);
  const stage = get("game-stage");
  if (!stage) return;
  const tabs = [...document.querySelectorAll("[data-build]")];
  const keys = [...document.querySelectorAll("[data-key]")];
  const held = new Set();
  let selected = "may";
  let frame = null;
  let readyTimer;
  let ready = false;

  function scale() {
    const modern = Boolean(builds[selected].modern);
    stage.classList.toggle("modern-game", modern);
    if (modern) {
      stage.style.height = `${stage.clientWidth <= 640 ? stage.clientWidth + 48 : Math.min(640, (stage.clientWidth * 9) / 16)}px`;
      if (frame) frame.style.transform = "none";
      return;
    }
    const factor = Math.min(1, stage.clientWidth / 840);
    stage.style.height = `${560 * factor}px`;
    if (frame)
      frame.style.transform = `translateX(-${420 * factor}px) scale(${factor})`;
  }
  function sendKey(code, pressed) {
    if (!frame || !ready) return;
    // The archived iframe is sandboxed with an opaque origin; source identity is checked by its bridge.
    frame.contentWindow.postMessage({ type: "cat-key", code, pressed }, "*");
    if (pressed) held.add(code);
    else held.delete(code);
  }
  function releaseKeys() {
    for (const code of [...held]) sendKey(code, false);
    keys.forEach((button) => button.classList.remove("held"));
  }
  function stop(focus = false) {
    releaseKeys();
    clearTimeout(readyTimer);
    if (frame) frame.remove();
    frame = null;
    ready = false;
    get("game-preview").hidden = false;
    get("preview-action").hidden = false;
    get("stop-game").hidden = true;
    get("touch-controls").hidden = true;
    get("restart").disabled = true;
    get("build-status").textContent = builds[selected].date;
    if (focus) get("start-game").focus({ preventScroll: true });
  }
  function play(focus = true) {
    stop();
    const build = builds[selected];
    frame = document.createElement("iframe");
    frame.title = build.title;
    // The modern game is trusted, first-party archived code. Its ES modules and
    // local save data need a normal origin; the legacy script stays sandboxed.
    if (!build.modern) frame.setAttribute("sandbox", "allow-scripts");
    frame.src = `experiments/cat/archive/${build.directory}/preview.html`;
    frame.dataset.focusOnReady = String(focus);
    get("game-preview").hidden = true;
    get("preview-action").hidden = true;
    get("stop-game").hidden = false;
    get("build-status").textContent = "Loading archived build…";
    stage.append(frame);
    scale();
    readyTimer = setTimeout(() => {
      if (!ready) {
        stop(true);
        get("build-status").textContent =
          "Could not load the game. Try again or use Open original.";
      }
    }, 30000);
  }
  function selectBuild(key, focusTab = false) {
    const wasPlaying = Boolean(frame);
    stop();
    selected = key;
    const build = builds[key];
    tabs.forEach((tab) => {
      const active = tab.dataset.build === key;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focusTab) tab.focus({ preventScroll: true });
    });
    get("game-panel").setAttribute("aria-labelledby", `tab-${key}`);
    get("game-preview").src = `images/cat-${key}.jpg`;
    get("game-preview").alt = build.alt;
    get("original-link").href =
      `experiments/cat/archive/${build.directory}/index.html`;
    get("game-instructions").textContent = build.instructions;
    get("build-status").textContent = build.date;
    get("jump-key").hidden = key !== "may";
    scale();
    if (wasPlaying) play(false);
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectBuild(tab.dataset.build));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
        return;
      event.preventDefault();
      let target =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? tabs.length - 1
            : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) %
              tabs.length;
      selectBuild(tabs[target].dataset.build, true);
    });
  });
  keys.forEach((button) => {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      button.classList.add("held");
      sendKey(button.dataset.key, true);
    });
    const release = () => {
      button.classList.remove("held");
      sendKey(button.dataset.key, false);
    };
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
    button.addEventListener("keydown", (event) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        sendKey(button.dataset.key, true);
      }
    });
    button.addEventListener("keyup", (event) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        release();
      }
    });
    button.addEventListener("blur", release);
  });
  window.addEventListener("message", (event) => {
    if (!frame || event.source !== frame.contentWindow) return;
    if (event.data?.type === "cat-ready") {
      ready = true;
      clearTimeout(readyTimer);
      get("restart").disabled = false;
      get("touch-controls").hidden = Boolean(builds[selected].modern);
      get("build-status").textContent = `Playing · ${builds[selected].date}`;
      if (frame.dataset.focusOnReady === "true")
        frame.focus({ preventScroll: true });
    }
    if (event.data?.type === "cat-exit") {
      releaseKeys();
      get("stop-game").focus({ preventScroll: true });
    }
  });
  get("start-game").addEventListener("click", () => play());
  get("stop-game").addEventListener("click", () => stop(true));
  get("restart").addEventListener("click", () => play());
  window.addEventListener("blur", releaseKeys);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) releaseKeys();
  });
  new ResizeObserver(scale).observe(stage);
  scale();
})();
