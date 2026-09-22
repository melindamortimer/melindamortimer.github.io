import { AudioEngine } from "./audio.js";
import { MoonlightGame } from "./game.js";
import { InputManager } from "./input.js";
import { LEVELS, getLevel } from "./levels.js";
import { loadSave, recordCompletion, saveData } from "./storage.js";

const byId = (id) => document.getElementById(id);

const ui = {
  canvas: byId("game-canvas"),
  loading: byId("loading-screen"),
  title: byId("title-screen"),
  levels: byId("level-screen"),
  settings: byId("settings-screen"),
  pause: byId("pause-screen"),
  complete: byId("complete-screen"),
  gameover: byId("gameover-screen"),
  hud: byId("hud"),
  health: byId("health-display"),
  fish: byId("fish-count"),
  fishDisplay: byId("fish-display"),
  yarn: byId("yarn-status"),
  levelName: byId("level-name"),
  time: byId("time-display"),
  toast: byId("toast"),
  touchControls: document.querySelector(".touch-controls"),
  levelList: byId("level-list"),
  completeTitle: byId("complete-title"),
  completeSubtitle: byId("complete-subtitle"),
  completeStats: byId("complete-stats"),
  completeLevels: byId("complete-levels"),
  muteToggle: byId("mute-toggle"),
  motionToggle: byId("motion-toggle"),
  shakeToggle: byId("shake-toggle"),
  shakeDescription: byId("shake-description"),
};

const screens = [ui.loading, ui.title, ui.levels, ui.settings, ui.pause, ui.complete, ui.gameover].filter(Boolean);
const dialogScreens = new Set([ui.levels, ui.settings, ui.pause, ui.complete, ui.gameover].filter(Boolean));
const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

let save = loadSave();
let selectedLevelIndex = 0;
let toastTimer = 0;
let activeScreen = ui.loading;
let dialogReturnFocus = null;
let game;
let input;
let audio;
let levelLoadSequence = 0;

// Keep this object stable for the lifetime of the game. MoonlightGame holds the
// same reference, so themes can be attached after boot without rebuilding the
// renderer or duplicating the always-needed rooftop artwork.
const loadedThemes = Object.create(null);
const themeLoadPromises = new Map();

const hudCache = {
  health: null,
  fish: null,
  totalFish: null,
  yarn: null,
  levelName: null,
  time: null,
};

const assetPaths = {
  cat: "assets/sprites/miso-animation-sheet-v3.png",
  themes: {
    rooftop: {
      far: "assets/backgrounds/moon-sky.png",
      mid: "assets/backgrounds/city-skyline.png",
      near: "assets/backgrounds/near-roofs.png",
      atlas: "assets/sprites/world-atlas.png",
    },
    laundry: {
      far: "assets/backgrounds/lantern-laundry-far.png",
      near: "assets/backgrounds/lantern-laundry-near.png",
      atlas: "assets/sprites/lantern-laundry-atlas.png",
      cloth: "assets/sprites/laundry-cloth-sheet.png",
    },
    market: {
      far: "assets/backgrounds/midnight-market-far.png",
      near: "assets/backgrounds/midnight-market-near.png",
      atlas: "assets/sprites/midnight-market-atlas.png",
    },
  },
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  });
}

function isOptionalThemeAsset(theme, key) {
  return theme === "laundry" && key === "cloth";
}

async function loadThemeAssets(theme) {
  if (loadedThemes[theme]) return loadedThemes[theme];
  if (themeLoadPromises.has(theme)) return themeLoadPromises.get(theme);

  const paths = assetPaths.themes[theme];
  if (!paths) throw new Error(`No artwork is configured for the ${theme} district.`);

  const loadPromise = (async () => {
    const entries = await Promise.all(
      Object.entries(paths).map(async ([key, src]) => {
        try {
          return [key, await loadImage(src)];
        } catch (error) {
          if (isOptionalThemeAsset(theme, key)) {
            console.warn("Animated laundry cloth could not be loaded; continuing without it.", error);
            return [key, null];
          }
          throw error;
        }
      }),
    );
    const themeAssets = Object.fromEntries(entries);
    loadedThemes[theme] = themeAssets;
    return themeAssets;
  })();

  themeLoadPromises.set(theme, loadPromise);
  try {
    return await loadPromise;
  } finally {
    // Failed required loads remain retryable; successful loads are served from
    // loadedThemes. In-flight callers still share the same promise.
    if (themeLoadPromises.get(theme) === loadPromise) themeLoadPromises.delete(theme);
  }
}

async function loadBootAssets() {
  const [cat] = await Promise.all([
    loadImage(assetPaths.cat),
    loadThemeAssets("rooftop"),
  ]);

  return {
    cat,
    themes: loadedThemes,
  };
}

function setLoadingMessage(message = "Chasing moonbeams…") {
  const copy = ui.loading?.querySelector("p");
  if (copy) copy.textContent = message;
  ui.loading?.setAttribute("aria-label", message);
}

function scheduleThemePrefetch(levelIndex) {
  const nextTheme = LEVELS[levelIndex + 1]?.theme;
  if (!nextTheme || loadedThemes[nextTheme] || themeLoadPromises.has(nextTheme)) return;

  const prefetch = () => {
    void loadThemeAssets(nextTheme).catch((error) => {
      // Prefetching is deliberately best-effort. A later explicit selection
      // gets a fresh attempt and owns the visible error/recovery experience.
      console.warn(`Could not prefetch the ${nextTheme} theme.`, error);
    });
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(prefetch, { timeout: 3000 });
  } else {
    window.setTimeout(prefetch, 900);
  }
}

function setInert(element, inert) {
  if (!element) return;
  element.inert = inert;
  element.toggleAttribute("inert", inert);
}

function canReceiveFocus(element) {
  return Boolean(
    element
      && element.isConnected
      && !element.hidden
      && !element.disabled
      && !element.closest("[inert], [aria-hidden='true']"),
  );
}

function focusIntoScreen(target, preferredTarget) {
  if (!target) return;
  window.requestAnimationFrame(() => {
    const preferred = typeof preferredTarget === "function" ? preferredTarget() : preferredTarget;
    const fallback = target.querySelector(FOCUSABLE_SELECTOR) ?? target.querySelector(".panel");
    const focusTarget = canReceiveFocus(preferred) ? preferred : fallback;
    if (canReceiveFocus(focusTarget)) focusTarget.focus({ preventScroll: true });
  });
}

/**
 * The one screen-state boundary for visual visibility, assistive visibility,
 * focus entry, and gameplay input. Title remains a normal screen; overlays
 * marked as dialogs make every background surface inert.
 */
function activateScreen(target, { showHud = false, focusTarget = null, opener = undefined } = {}) {
  const targetIsDialog = dialogScreens.has(target);
  if (targetIsDialog) {
    dialogReturnFocus = opener === undefined ? document.activeElement : opener;
  } else {
    dialogReturnFocus = null;
  }

  activeScreen = target;
  screens.forEach((screen) => {
    const isActive = screen === target;
    screen.classList.toggle("is-active", isActive);
    screen.setAttribute("aria-hidden", String(!isActive));
    setInert(screen, !isActive);
  });

  const gameplayActive = !target && showHud;
  ui.hud?.classList.toggle("is-active", showHud);
  ui.hud?.setAttribute("aria-hidden", String(!gameplayActive));
  ui.touchControls?.setAttribute("aria-hidden", String(!gameplayActive));
  ui.canvas?.setAttribute("aria-hidden", String(!gameplayActive));
  setInert(ui.hud, !gameplayActive);
  setInert(ui.touchControls, !gameplayActive);
  setInert(ui.canvas, !gameplayActive);
  input?.setEnabled(gameplayActive);

  if (target) focusIntoScreen(target, focusTarget);
}

function getDialogFocusables(dialog) {
  if (!dialog) return [];
  return [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)].filter(canReceiveFocus);
}

function trapDialogFocus(event) {
  if (event.key !== "Tab" || !dialogScreens.has(activeScreen)) return;
  const focusables = getDialogFocusables(activeScreen);
  if (!focusables.length) {
    event.preventDefault();
    activeScreen.querySelector(".panel")?.focus({ preventScroll: true });
    return;
  }

  const first = focusables[0];
  const last = focusables.at(-1);
  if (!activeScreen.contains(document.activeElement)) {
    event.preventDefault();
    first.focus({ preventScroll: true });
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus({ preventScroll: true });
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus({ preventScroll: true });
  }
}

function clearToast() {
  clearTimeout(toastTimer);
  toastTimer = 0;
  if (!ui.toast) return;
  ui.toast.classList.remove("is-active");
  ui.toast.textContent = "";
}

function resolveToastCopy(message) {
  const lockedGoal = String(message).match(/^(\d+) moonfish still lighting (?:the rooftops|the way)$/);
  const template = game?.level?.copy?.goalLocked;
  if (!lockedGoal || !template) return message;
  return template.replace("{remaining}", lockedGoal[1]);
}

function showToast(message, duration = 2200) {
  if (!ui.toast) return;
  clearToast();
  ui.toast.textContent = resolveToastCopy(message);
  ui.toast.classList.add("is-active");
  toastTimer = window.setTimeout(clearToast, duration);
}

function setButtonState(button, active, activeText, inactiveText) {
  if (!button) return;
  button.setAttribute("aria-pressed", String(active));
  const label = button.querySelector("[data-setting-label]");
  if (label) label.textContent = active ? activeText : inactiveText;
  else button.textContent = active ? activeText : inactiveText;
}

function refreshSettings() {
  setButtonState(ui.muteToggle, save.settings.muted, "Sound off", "Sound on");
  setButtonState(ui.motionToggle, save.settings.reducedMotion, "Reduced motion", "Full motion");

  if (ui.shakeToggle) {
    const shakeOverridden = save.settings.reducedMotion && save.settings.screenShake;
    ui.shakeToggle.setAttribute("aria-pressed", String(save.settings.screenShake));
    ui.shakeToggle.dataset.overridden = String(shakeOverridden);
    const state = ui.shakeToggle.querySelector("[data-setting-label]");
    if (state) {
      state.textContent = !save.settings.screenShake
        ? "Screen shake off"
        : shakeOverridden
          ? "On with full motion"
          : "Screen shake on";
    }
    if (ui.shakeDescription) {
      ui.shakeDescription.textContent = shakeOverridden
        ? "Reduced motion keeps shake off; this preference returns with full motion."
        : "A little impact on pounces and bumps.";
    }
  }

  audio?.setMuted(save.settings.muted);
  game?.setSettings(save.settings);
}

function persistSettings() {
  save = saveData(save);
  refreshSettings();
}

function populateLevels() {
  if (!ui.levelList) return;
  ui.levelList.replaceChildren();

  LEVELS.forEach((level, index) => {
    const unlocked = index < save.unlocked;
    const best = save.bestTimes[level.id];
    const requirement = level.copy?.unlockRequirement ?? "Complete the previous district to unlock.";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "level-card";
    button.setAttribute("aria-disabled", String(!unlocked));
    button.setAttribute(
      "aria-label",
      unlocked
        ? `${level.name}. ${level.subtitle}${best ? `. Best time ${formatStoredTime(best)}.` : ". New district."}`
        : `${level.name}, locked. ${requirement}`,
    );
    button.dataset.level = level.id;
    button.dataset.theme = level.theme;
    button.innerHTML = `
      <span class="level-card__number">${String(index + 1).padStart(2, "0")}</span>
      <span class="level-card__preview" aria-hidden="true"></span>
      <span class="level-card__copy">
        <strong>${level.name}</strong>
        <small>${unlocked ? level.subtitle : requirement}</small>
      </span>
      <span class="level-card__record">${best ? `Best ${formatStoredTime(best)}` : unlocked ? "New" : "Locked"}</span>
    `;
    button.addEventListener("click", () => {
      if (unlocked) {
        startLevel(level.id);
      } else {
        audio.play("click");
        showToast(requirement);
      }
    });
    ui.levelList.append(button);
  });
}

function formatStoredTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function resetHudCache() {
  Object.keys(hudCache).forEach((key) => {
    hudCache[key] = null;
  });
}

function recoverFromThemeLoadFailure(level, returnScreen, error) {
  console.error(`Could not load the ${level.name} theme.`, error);
  setLoadingMessage();

  if (returnScreen === ui.levels || returnScreen === ui.complete) {
    populateLevels();
    activateScreen(ui.levels, {
      focusTarget: () => ui.levelList?.querySelector(`[data-level="${level.id}"]`) ?? byId("close-levels"),
      opener: null,
    });
  } else {
    showTitle();
  }

  showToast(`${level.name} artwork could not be loaded. Please try again.`, 4200);
}

async function startLevel(id) {
  const level = getLevel(id);
  const requestSequence = ++levelLoadSequence;
  const returnScreen = activeScreen;
  clearToast();

  if (!loadedThemes[level.theme]) {
    setLoadingMessage(`Unfurling ${level.name}…`);
    activateScreen(ui.loading, { focusTarget: ui.loading });
    try {
      await loadThemeAssets(level.theme);
    } catch (error) {
      if (requestSequence === levelLoadSequence) {
        recoverFromThemeLoadFailure(level, returnScreen, error);
      }
      return;
    }
    setLoadingMessage();
  }

  // Ignore a stale async selection if another level request superseded it.
  if (requestSequence !== levelLoadSequence) return;

  selectedLevelIndex = LEVELS.findIndex((item) => item.id === level.id);
  resetHudCache();
  audio.startMusic();
  void audio.resume();
  game.loadLevel(level);
  activateScreen(null, { showHud: true });
  ui.canvas?.focus({ preventScroll: true });
  scheduleThemePrefetch(selectedLevelIndex);
}

function restartLevel() {
  if (!game?.level) return;
  clearToast();
  resetHudCache();
  audio.startMusic();
  game.loadLevel(getLevel(game.level.id));
  activateScreen(null, { showHud: true });
  ui.canvas?.focus({ preventScroll: true });
}

function pauseGame() {
  if (!game || game.mode !== "playing") return;
  clearToast();
  game.pause();
  activateScreen(ui.pause, {
    showHud: true,
    focusTarget: byId("resume-game"),
    opener: byId("pause-button"),
  });
  audio.play("click");
}

function resumeGame() {
  if (!game || game.mode !== "paused") return;
  clearToast();
  game.resume();
  activateScreen(null, { showHud: true });
  audio.play("click");
  ui.canvas?.focus({ preventScroll: true });
}

function showTitle({ focusTarget = byId("start-game") } = {}) {
  clearToast();
  audio?.stopMusic();
  game?.showMenu();
  activateScreen(ui.title, { focusTarget });
}

function returnToTitle() {
  const returnTarget = dialogReturnFocus;
  showTitle({ focusTarget: returnTarget ?? byId("start-game") });
}

function openLevelSelect(opener = document.activeElement) {
  clearToast();
  audio.play("click");
  populateLevels();
  activateScreen(ui.levels, {
    focusTarget: () => ui.levelList?.querySelector(".level-card") ?? byId("close-levels"),
    opener,
  });
}

function openSettings(opener = document.activeElement) {
  clearToast();
  audio.play("click");
  activateScreen(ui.settings, { focusTarget: ui.muteToggle, opener });
}

function handleHud(state) {
  if (ui.health && hudCache.health !== state.health) {
    ui.health.innerHTML = Array.from({ length: 3 }, (_, index) =>
      `<span class="hud-heart${index >= state.health ? " is-empty" : ""}" aria-hidden="true"></span>`,
    ).join("");
    ui.health.setAttribute("aria-label", `${state.health} of 3 hearts remaining`);
    hudCache.health = state.health;
  }

  if (hudCache.fish !== state.fish || hudCache.totalFish !== state.totalFish) {
    if (ui.fish) ui.fish.textContent = `${state.fish} / ${state.totalFish}`;
    ui.fishDisplay?.setAttribute("aria-label", `${state.fish} of ${state.totalFish} moonfish collected`);
    hudCache.fish = state.fish;
    hudCache.totalFish = state.totalFish;
  }

  if (ui.yarn && hudCache.yarn !== state.yarn) {
    ui.yarn.textContent = state.yarn ? "Yarn found" : "Yarn hidden";
    ui.yarn.classList.toggle("is-found", state.yarn);
    hudCache.yarn = state.yarn;
  }

  if (ui.levelName && hudCache.levelName !== state.levelName) {
    ui.levelName.textContent = state.levelName;
    hudCache.levelName = state.levelName;
  }

  // The engine can emit HUD state every fixed step; the formatted value only
  // changes once per second, so the DOM timer is never rewritten faster.
  if (ui.time && hudCache.time !== state.time) {
    ui.time.textContent = state.time;
    ui.time.setAttribute("aria-label", `Elapsed time ${state.time}`);
    hudCache.time = state.time;
  }
}

function handleComplete(stats) {
  clearToast();
  save = recordCompletion(save, stats.levelId, stats.time, stats.yarn);
  populateLevels();
  const level = getLevel(stats.levelId);
  const hasNext = selectedLevelIndex < LEVELS.length - 1;

  if (ui.completeTitle) {
    ui.completeTitle.textContent = hasNext ? `${stats.levelName} cleared!` : "Moonlight mastered!";
  }
  if (ui.completeSubtitle) {
    ui.completeSubtitle.textContent = level.copy?.completionSubtitle ?? "The district glows a little brighter.";
  }
  if (ui.completeStats) {
    const best = save.bestTimes[stats.levelId];
    ui.completeStats.innerHTML = `
      <li><span>Moonfish</span><strong>${stats.fish} / ${stats.totalFish}</strong></li>
      <li><span>Secret yarn</span><strong>${stats.yarn ? "Found" : "Still hidden"}</strong></li>
      <li><span>Run time</span><strong>${stats.timeLabel}</strong></li>
      <li><span>Best time</span><strong>${formatStoredTime(best)}</strong></li>
    `;
  }

  const nextButton = byId("next-level");
  if (nextButton) {
    nextButton.hidden = !hasNext;
    nextButton.disabled = !hasNext;
  }
  if (ui.completeLevels) {
    ui.completeLevels.classList.toggle("button--primary", !hasNext);
    ui.completeLevels.classList.toggle("button--quiet", hasNext);
  }

  const primaryAction = hasNext ? nextButton : ui.completeLevels;
  activateScreen(ui.complete, {
    showHud: true,
    focusTarget: primaryAction,
    opener: null,
  });
}

function handleGameOver() {
  clearToast();
  activateScreen(ui.gameover, {
    focusTarget: byId("gameover-retry"),
    opener: null,
  });
}

function handleDialogKeydown(event) {
  if (!dialogScreens.has(activeScreen)) return;
  trapDialogFocus(event);

  const closesPause = activeScreen === ui.pause && event.code === "KeyP";
  if (event.key !== "Escape" && !closesPause) return;
  event.preventDefault();
  event.stopPropagation();

  if (activeScreen === ui.pause) resumeGame();
  else if (activeScreen === ui.levels || activeScreen === ui.settings) returnToTitle();
  else showTitle();
}

function wireButtons() {
  byId("start-game")?.addEventListener("click", () => startLevel(LEVELS[0].id));
  byId("open-levels")?.addEventListener("click", (event) => openLevelSelect(event.currentTarget));
  byId("open-settings")?.addEventListener("click", (event) => openSettings(event.currentTarget));
  byId("close-levels")?.addEventListener("click", returnToTitle);
  byId("close-settings")?.addEventListener("click", returnToTitle);
  byId("pause-button")?.addEventListener("click", pauseGame);
  byId("resume-game")?.addEventListener("click", resumeGame);
  byId("restart-game")?.addEventListener("click", restartLevel);
  byId("quit-game")?.addEventListener("click", showTitle);
  byId("replay-level")?.addEventListener("click", restartLevel);
  byId("next-level")?.addEventListener("click", () => {
    const next = LEVELS[selectedLevelIndex + 1];
    if (next) startLevel(next.id);
  });
  ui.completeLevels?.addEventListener("click", () => openLevelSelect(byId("open-levels")));
  byId("complete-title-action")?.addEventListener("click", showTitle);
  byId("gameover-retry")?.addEventListener("click", restartLevel);
  byId("gameover-quit")?.addEventListener("click", showTitle);

  ui.muteToggle?.addEventListener("click", () => {
    save.settings.muted = !save.settings.muted;
    persistSettings();
  });
  ui.motionToggle?.addEventListener("click", () => {
    save.settings.reducedMotion = !save.settings.reducedMotion;
    save.settings.reducedMotionExplicit = true;
    persistSettings();
  });
  ui.shakeToggle?.addEventListener("click", () => {
    save.settings.screenShake = !save.settings.screenShake;
    persistSettings();
  });

  try {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    motionPreference.addEventListener?.("change", (event) => {
      if (save.settings.reducedMotionExplicit) return;
      save.settings.reducedMotion = event.matches;
      persistSettings();
    });
  } catch {
    // Older browsers keep the loaded preference; the setting remains editable.
  }

  document.addEventListener("keydown", handleDialogKeydown, true);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && game?.mode === "playing") pauseGame();
  });
}

async function boot() {
  try {
    const assets = await loadBootAssets();
    input = new InputManager(document);
    audio = new AudioEngine(save.settings.muted);
    game = new MoonlightGame({
      canvas: ui.canvas,
      assets,
      input,
      audio,
      settings: save.settings,
      events: {
        hud: handleHud,
        toast: showToast,
        pause: pauseGame,
        restart: restartLevel,
        complete: handleComplete,
        gameover: handleGameOver,
      },
    });
    wireButtons();
    refreshSettings();
    populateLevels();
    showTitle();
  } catch (error) {
    console.error(error);
    if (ui.loading) {
      ui.loading.innerHTML = `
        <div class="loading-error" role="alert">
          <strong>The moon went behind a cloud.</strong>
          <span>${error.message}</span>
          <button type="button" onclick="location.reload()">Try again</button>
        </div>
      `;
    }
  }
}

boot();
