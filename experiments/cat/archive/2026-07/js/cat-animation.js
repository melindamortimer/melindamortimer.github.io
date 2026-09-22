export const CAT_ATLAS_COLUMNS = 8;
export const CAT_ATLAS_ROWS = 4;
export const CAT_RUNTIME_CELL_SIZE = 132;
export const CAT_ATLAS_WIDTH = CAT_ATLAS_COLUMNS * CAT_RUNTIME_CELL_SIZE;
export const CAT_ATLAS_HEIGHT = CAT_ATLAS_ROWS * CAT_RUNTIME_CELL_SIZE;
export const CAT_FRAME_COUNT = CAT_ATLAS_COLUMNS * CAT_ATLAS_ROWS;
export const CAT_DRAW_SIZE = CAT_RUNTIME_CELL_SIZE;

// Kept as the mean phase length for compatibility with older callers.  The
// measured v3 poses cover different amounts of ground: contact phases advance
// by exactly the local paw retreat, while airborne transitions stay brisk.
export const RUN_FRAME_DISTANCE = 20;
export const RUN_PHASE_DISTANCES = Object.freeze([16, 20, 32, 18, 20, 20, 18, 16]);
export const RUN_CYCLE_DISTANCE = RUN_PHASE_DISTANCES.reduce((sum, value) => sum + value, 0);

export const CAT_NOMINAL_ROOT = Object.freeze({ x: 66, y: 74 });
export const CAT_NOMINAL_GROUND_LINE = 106;

export const CAT_FRAMES = Object.freeze({
  run: Object.freeze({
    nearContact: 0,
    shoulderLoad: 1,
    gather: 2,
    hindPush: 3,
    suspension: 4,
    farContact: 5,
    recovery: 6,
    loopReach: 7,
  }),
  jump: Object.freeze({
    anticipation: 8,
    release: 9,
    earlyRise: 10,
    lateRise: 11,
    apex: 12,
    earlyFall: 13,
    lateFall: 14,
    landImpact: 15,
    landRecovery: 16,
  }),
  idle: Object.freeze({
    neutral: 17,
    inhale: 18,
    blink: 19,
    tailSettle: 20,
  }),
  pounce: Object.freeze({
    launch: 21,
    extension: 22,
    recovery: 23,
  }),
  wall: Object.freeze({
    brace: 24,
    slide: 25,
  }),
  hurt: Object.freeze({
    impact: 26,
    recoil: 27,
    recover: 28,
  }),
  celebrate: Object.freeze({
    lift: 29,
    peak: 30,
    settle: 31,
  }),
});

export const CAT_FRAME_IDS = Object.freeze({
  "run.nearContact": CAT_FRAMES.run.nearContact,
  "run.shoulderLoad": CAT_FRAMES.run.shoulderLoad,
  "run.gather": CAT_FRAMES.run.gather,
  "run.hindPush": CAT_FRAMES.run.hindPush,
  "run.suspension": CAT_FRAMES.run.suspension,
  "run.farContact": CAT_FRAMES.run.farContact,
  "run.recovery": CAT_FRAMES.run.recovery,
  "run.loopReach": CAT_FRAMES.run.loopReach,
  "jump.anticipation": CAT_FRAMES.jump.anticipation,
  "jump.release": CAT_FRAMES.jump.release,
  "jump.earlyRise": CAT_FRAMES.jump.earlyRise,
  "jump.lateRise": CAT_FRAMES.jump.lateRise,
  "jump.apex": CAT_FRAMES.jump.apex,
  "jump.earlyFall": CAT_FRAMES.jump.earlyFall,
  "jump.lateFall": CAT_FRAMES.jump.lateFall,
  "jump.landImpact": CAT_FRAMES.jump.landImpact,
  "jump.landRecovery": CAT_FRAMES.jump.landRecovery,
  "idle.neutral": CAT_FRAMES.idle.neutral,
  "idle.inhale": CAT_FRAMES.idle.inhale,
  "idle.blink": CAT_FRAMES.idle.blink,
  "idle.tailSettle": CAT_FRAMES.idle.tailSettle,
  "pounce.launch": CAT_FRAMES.pounce.launch,
  "pounce.extension": CAT_FRAMES.pounce.extension,
  "pounce.recovery": CAT_FRAMES.pounce.recovery,
  "wall.brace": CAT_FRAMES.wall.brace,
  "wall.slide": CAT_FRAMES.wall.slide,
  "hurt.impact": CAT_FRAMES.hurt.impact,
  "hurt.recoil": CAT_FRAMES.hurt.recoil,
  "hurt.recover": CAT_FRAMES.hurt.recover,
  "celebrate.lift": CAT_FRAMES.celebrate.lift,
  "celebrate.peak": CAT_FRAMES.celebrate.peak,
  "celebrate.settle": CAT_FRAMES.celebrate.settle,
});

const point = (x, y, extra = {}) => Object.freeze({ x, y, ...extra });
const contact = (paw, x) => point(x, CAT_NOMINAL_GROUND_LINE, { paw });

const FRAME_SPECS = [
  ["run.nearContact", "contact", [contact("nearFore", 98)]],
  // These coordinates are measured from the keyed runtime pixels.  Their
  // matching phase distances keep each genuinely planted paw fixed in world
  // space instead of making mathematically convenient metadata claims.
  ["run.shoulderLoad", "contact", [contact("nearFore", 82)]],
  ["run.gather", "contact", [contact("nearHind", 58)]],
  ["run.hindPush", "contact", [contact("nearHind", 26)]],
  ["run.suspension", "root", []],
  ["run.farContact", "contact", [contact("nearFore", 79)]],
  ["run.recovery", "contact", [contact("nearHind", 36)]],
  ["run.loopReach", "root", []],
  // Non-run contacts are also sampled from the final keyed pixels. The jump
  // crouch and impact intentionally resolve onto a single lowest paw before
  // the recovery pose restores the wider standing base.
  ["jump.anticipation", "contact", [contact("nearFore", 71)]],
  ["jump.release", "root", []],
  ["jump.earlyRise", "root", []],
  ["jump.lateRise", "root", []],
  ["jump.apex", "root", []],
  ["jump.earlyFall", "root", []],
  ["jump.lateFall", "root", []],
  ["jump.landImpact", "contact", [contact("nearFore", 69)]],
  ["jump.landRecovery", "contact", [contact("nearFore", 83), contact("nearHind", 42)]],
  ["idle.neutral", "contact", [contact("nearFore", 83), contact("nearHind", 42)]],
  ["idle.inhale", "contact", [contact("nearFore", 83), contact("nearHind", 42)]],
  ["idle.blink", "contact", [contact("nearFore", 83), contact("nearHind", 42)]],
  ["idle.tailSettle", "contact", [contact("nearFore", 83), contact("nearHind", 42)]],
  ["pounce.launch", "root", []],
  ["pounce.extension", "root", []],
  ["pounce.recovery", "root", []],
  ["wall.brace", "root", [], point(89, 65, { paw: "nearFore" })],
  ["wall.slide", "root", [], point(89, 63, { paw: "nearFore" })],
  ["hurt.impact", "root", []],
  ["hurt.recoil", "root", []],
  ["hurt.recover", "root", []],
  ["celebrate.lift", "root", []],
  ["celebrate.peak", "root", []],
  ["celebrate.settle", "root", []],
];

// These values are the assembly contract for the v3 runtime atlas. Generated
// frames are aligned to the nominal root before export, and any residual
// correction stays within the documented two-pixel limit.
export const CAT_FRAME_META = Object.freeze(FRAME_SPECS.map((spec, index) => {
  const [id, anchor, contacts, wallContact = null] = spec;
  return Object.freeze({
    index,
    id,
    clip: id.split(".")[0],
    anchor,
    root: point(CAT_NOMINAL_ROOT.x, CAT_NOMINAL_ROOT.y),
    rootCorrection: id === "run.loopReach" ? point(0, -2) : point(0, 0),
    contactLine: anchor === "contact" ? CAT_NOMINAL_GROUND_LINE : null,
    contacts: Object.freeze(contacts),
    wallContact,
  });
}));

const POUNCE_CLIP = Object.freeze(Object.values(CAT_FRAMES.pounce));

export const CAT_CLIPS = Object.freeze({
  run: Object.freeze(Object.values(CAT_FRAMES.run)),
  takeoff: Object.freeze([CAT_FRAMES.jump.anticipation, CAT_FRAMES.jump.release]),
  rise: Object.freeze([CAT_FRAMES.jump.earlyRise, CAT_FRAMES.jump.lateRise]),
  apex: Object.freeze([CAT_FRAMES.jump.apex]),
  fall: Object.freeze([CAT_FRAMES.jump.earlyFall, CAT_FRAMES.jump.lateFall]),
  land: Object.freeze([CAT_FRAMES.jump.landImpact, CAT_FRAMES.jump.landRecovery]),
  idle: Object.freeze(Object.values(CAT_FRAMES.idle)),
  pounce: POUNCE_CLIP,
  // The physics controller's established state name remains `dash`; artwork
  // and production documentation call the same responsive move a pounce.
  dash: POUNCE_CLIP,
  wall: Object.freeze(Object.values(CAT_FRAMES.wall)),
  hurt: Object.freeze(Object.values(CAT_FRAMES.hurt)),
  celebrate: Object.freeze(Object.values(CAT_FRAMES.celebrate)),
});

const timeline = (...entries) => Object.freeze(entries.map(([frame, duration]) =>
  Object.freeze({ frame, duration })));

export const CAT_TIMELINES = Object.freeze({
  idle: timeline(
    [CAT_FRAMES.idle.neutral, 3.2],
    [CAT_FRAMES.idle.inhale, 0.24],
    [CAT_FRAMES.idle.neutral, 0.12],
    [CAT_FRAMES.idle.blink, 0.12],
    [CAT_FRAMES.idle.neutral, 0.9],
    [CAT_FRAMES.idle.tailSettle, 0.36],
    [CAT_FRAMES.idle.neutral, 0.1],
  ),
  takeoff: timeline(
    [CAT_FRAMES.jump.anticipation, 0.035],
    [CAT_FRAMES.jump.release, 0.045],
  ),
  land: timeline(
    [CAT_FRAMES.jump.landImpact, 0.07],
    [CAT_FRAMES.jump.landRecovery, 0.05],
  ),
  pounce: timeline(
    // The established controller exposes about 85ms of rendered pounce state,
    // so all three drawings complete inside that responsive action window.
    [CAT_FRAMES.pounce.launch, 0.025],
    [CAT_FRAMES.pounce.extension, 0.035],
    [CAT_FRAMES.pounce.recovery, 0.025],
  ),
  wall: timeline(
    [CAT_FRAMES.wall.brace, 0.14],
    [CAT_FRAMES.wall.slide, 0.14],
  ),
  hurt: timeline(
    [CAT_FRAMES.hurt.impact, 0.07],
    [CAT_FRAMES.hurt.recoil, 0.24],
    [CAT_FRAMES.hurt.recover, 0.13],
  ),
  celebrate: timeline(
    [CAT_FRAMES.celebrate.lift, 0.16],
    [CAT_FRAMES.celebrate.peak, 0.26],
    [CAT_FRAMES.celebrate.settle, 0.28],
  ),
});

export const CAT_JUMP_VELOCITY_THRESHOLDS = Object.freeze({
  lateRise: -360,
  lateFall: 360,
});

const REDUCED_MOTION_FRAMES = Object.freeze({
  idle: CAT_FRAMES.idle.neutral,
  run: CAT_FRAMES.run.nearContact,
  takeoff: CAT_FRAMES.jump.release,
  rise: CAT_FRAMES.jump.lateRise,
  apex: CAT_FRAMES.jump.apex,
  fall: CAT_FRAMES.jump.lateFall,
  land: CAT_FRAMES.jump.landImpact,
  pounce: CAT_FRAMES.pounce.extension,
  dash: CAT_FRAMES.pounce.extension,
  wall: CAT_FRAMES.wall.brace,
  hurt: CAT_FRAMES.hurt.recoil,
  celebrate: CAT_FRAMES.celebrate.peak,
});

function safeFrameIndex(frame) {
  const numericFrame = Number.isFinite(frame) ? Math.floor(frame) : 0;
  return Math.max(0, Math.min(CAT_FRAME_COUNT - 1, numericFrame));
}

function frameFromTimeline(time, entries, { loop = false } = {}) {
  const total = entries.reduce((sum, entry) => sum + entry.duration, 0);
  const elapsed = Math.max(0, Number.isFinite(time) ? time : 0);
  let cursor = loop ? elapsed % total : Math.min(elapsed, total);
  for (const entry of entries) {
    if (cursor < entry.duration) return entry.frame;
    cursor -= entry.duration;
  }
  return entries.at(-1).frame;
}

function catState(player) {
  return CAT_CLIPS[player?.state] ? player.state : "idle";
}

// Kept numeric for callers and tests written against the v2 controller. The
// named manifest above is the source of truth; this function remains a small
// compatibility boundary for the renderer.
export function resolveCatFrame(player, reducedMotion = false) {
  const state = catState(player);
  const stateTime = Math.max(0, player?.animationTime || 0);

  if (reducedMotion) return REDUCED_MOTION_FRAMES[state];

  if (state === "run") {
    const distance = Math.max(0, player?.strideDistance || 0);
    const cycleDistance = distance % RUN_CYCLE_DISTANCE;
    let boundary = 0;
    for (let index = 0; index < CAT_CLIPS.run.length; index += 1) {
      boundary += RUN_PHASE_DISTANCES[index];
      if (cycleDistance < boundary) return CAT_CLIPS.run[index];
    }
    return CAT_CLIPS.run[0];
  }

  if (state === "idle") return frameFromTimeline(stateTime, CAT_TIMELINES.idle, { loop: true });
  if (state === "takeoff") return frameFromTimeline(stateTime, CAT_TIMELINES.takeoff);
  if (state === "rise") {
    const velocity = Number.isFinite(player?.vy) ? player.vy : 0;
    return velocity < CAT_JUMP_VELOCITY_THRESHOLDS.lateRise
      ? CAT_FRAMES.jump.earlyRise
      : CAT_FRAMES.jump.lateRise;
  }
  if (state === "apex") return CAT_FRAMES.jump.apex;
  if (state === "fall") {
    const velocity = Number.isFinite(player?.vy) ? player.vy : 0;
    return velocity < CAT_JUMP_VELOCITY_THRESHOLDS.lateFall
      ? CAT_FRAMES.jump.earlyFall
      : CAT_FRAMES.jump.lateFall;
  }
  if (state === "land") return frameFromTimeline(stateTime, CAT_TIMELINES.land);
  if (state === "dash" || state === "pounce") {
    return frameFromTimeline(stateTime, CAT_TIMELINES.pounce);
  }
  if (state === "wall") return frameFromTimeline(stateTime, CAT_TIMELINES.wall, { loop: true });
  if (state === "hurt") return frameFromTimeline(stateTime, CAT_TIMELINES.hurt);
  if (state === "celebrate") return frameFromTimeline(stateTime, CAT_TIMELINES.celebrate);

  return CAT_FRAMES.idle.neutral;
}

export function resolveCatPose(player, reducedMotion = false) {
  const frame = resolveCatFrame(player, reducedMotion);
  const state = catState(player);
  const pose = {
    frame,
    frameId: CAT_FRAME_META[frame].id,
    offsetY: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    afterimages: 0,
  };

  if (!reducedMotion && (state === "dash" || state === "pounce")) {
    pose.afterimages = 2;
  }

  return pose;
}

export function getCatFrameMeta(frame) {
  return CAT_FRAME_META[safeFrameIndex(frame)];
}

export function getCatFramePlacement(frame, drawSize = CAT_DRAW_SIZE) {
  const meta = getCatFrameMeta(frame);
  const scale = drawSize / CAT_RUNTIME_CELL_SIZE;
  const correctionX = meta.rootCorrection.x;
  const correctionY = meta.rootCorrection.y;
  const rootToGround = CAT_NOMINAL_GROUND_LINE - CAT_NOMINAL_ROOT.y;
  const anchorY = meta.anchor === "contact"
    ? meta.contactLine
    : meta.root.y + rootToGround;

  return Object.freeze({
    x: (-meta.root.x + correctionX) * scale,
    y: (-anchorY + correctionY) * scale,
    anchor: meta.anchor,
  });
}

export function getCatSourceRect(image, frame) {
  const width = image?.naturalWidth || image?.width || 0;
  const height = image?.naturalHeight || image?.height || 0;
  if (width !== CAT_ATLAS_WIDTH || height !== CAT_ATLAS_HEIGHT) {
    throw new Error(
      `Miso animation atlas must be an exact 8 × 4 grid of 132px cells; received ${width} × ${height}.`,
    );
  }

  const safeFrame = safeFrameIndex(frame);
  return {
    sx: (safeFrame % CAT_ATLAS_COLUMNS) * CAT_RUNTIME_CELL_SIZE,
    sy: Math.floor(safeFrame / CAT_ATLAS_COLUMNS) * CAT_RUNTIME_CELL_SIZE,
    sw: CAT_RUNTIME_CELL_SIZE,
    sh: CAT_RUNTIME_CELL_SIZE,
  };
}

// Retained as a compatibility export for diagnostics built around the v2
// baseline API. Runtime drawing now uses getCatFramePlacement() instead.
export const CAT_FRAME_BASELINES = Object.freeze(
  CAT_FRAME_META.map((meta) => meta.anchor === "contact"
    ? meta.contactLine
    : meta.root.y + CAT_NOMINAL_GROUND_LINE - CAT_NOMINAL_ROOT.y),
);

export function getCatFrameBaseline(frame, drawSize = CAT_DRAW_SIZE) {
  return -getCatFramePlacement(frame, drawSize).y;
}
