const SAVE_KEY = 'miso-moonlight-save-v1';

function prefersReducedMotion() {
  try {
    return Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  } catch {
    return false;
  }
}

function defaults() {
  return {
    unlocked: 1,
    bestTimes: {},
    yarn: [],
    settings: {
      muted: false,
      reducedMotion: false,
      reducedMotionExplicit: false,
      screenShake: true,
    },
  };
}

function normalize(data) {
  const source = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  const save = defaults();

  if (Number.isFinite(source.unlocked)) {
    save.unlocked = Math.max(1, Math.floor(source.unlocked));
  }

  if (source.bestTimes && typeof source.bestTimes === 'object' && !Array.isArray(source.bestTimes)) {
    Object.entries(source.bestTimes).forEach(([levelId, time]) => {
      if (Number.isFinite(time) && time >= 0) save.bestTimes[levelId] = time;
    });
  }

  if (Array.isArray(source.yarn)) {
    source.yarn.forEach((levelId) => {
      if (typeof levelId !== 'string' && typeof levelId !== 'number') return;
      if (!save.yarn.some((savedId) => String(savedId) === String(levelId))) {
        save.yarn.push(levelId);
      }
    });
  }

  const settings = source.settings;
  if (settings && typeof settings === 'object' && !Array.isArray(settings)) {
    if (typeof settings.muted === 'boolean') save.settings.muted = settings.muted;
    if (typeof settings.reducedMotion === 'boolean') {
      // Existing saves predate the explicit marker, so preserve their value as
      // a deliberate preference instead of silently replacing it with the OS setting.
      save.settings.reducedMotionExplicit =
        typeof settings.reducedMotionExplicit === 'boolean'
          ? settings.reducedMotionExplicit
          : true;
      save.settings.reducedMotion = save.settings.reducedMotionExplicit
        ? settings.reducedMotion
        : prefersReducedMotion();
    }
    if (typeof settings.screenShake === 'boolean') {
      save.settings.screenShake = settings.screenShake;
    }
  }

  return save;
}

function freshDefaults() {
  const save = defaults();
  save.settings.reducedMotion = prefersReducedMotion();
  return save;
}

function storage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadSave() {
  try {
    const raw = storage()?.getItem(SAVE_KEY);
    return raw ? normalize(JSON.parse(raw)) : freshDefaults();
  } catch {
    return freshDefaults();
  }
}

export function saveData(data) {
  const save = normalize(data);
  try {
    storage()?.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // In-memory play still works when storage is blocked or full.
  }
  return save;
}

export function recordCompletion(data, levelId, time, yarnFound) {
  const save = normalize(data ?? loadSave());
  const key = String(levelId);
  const previousBest = save.bestTimes[key];
  const validTime = Number.isFinite(time) && time >= 0;

  if (validTime && (previousBest === undefined || time < previousBest)) {
    save.bestTimes[key] = time;
  }

  if (yarnFound && !save.yarn.some((savedId) => String(savedId) === key)) {
    save.yarn.push(levelId);
  }

  const numericId = Number(levelId);
  if (Number.isInteger(numericId) && numericId >= 0) {
    save.unlocked = Math.max(save.unlocked, numericId + 1);
  } else if (previousBest === undefined) {
    // Named levels have no intrinsic order, so advance only on first completion.
    save.unlocked += 1;
  }

  return saveData(save);
}

export function resetProgress() {
  try {
    storage()?.removeItem(SAVE_KEY);
  } catch {
    // Returning defaults is enough when storage cannot be accessed.
  }
  return freshDefaults();
}
