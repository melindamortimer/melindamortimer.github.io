import {
  CAT_DRAW_SIZE,
  getCatFramePlacement,
  getCatSourceRect,
  resolveCatPose,
} from "./cat-animation.js";

const VIEW_W = 960;
const VIEW_H = 540;
const FIXED_STEP = 1 / 60;
const PLAYER_W = 38;
const PLAYER_H = 42;
const DEFAULT_THEME = "rooftop";

const PARALLAX_STYLES = {
  rooftop: {
    far: { scale: 1.08, travel: 0.28, drift: 6, speed: 0.11, alpha: 1 },
    mid: { scale: 1.13, travel: 0.62, drift: 10, speed: 0.16, alpha: 0.68 },
    near: { scale: 1.2, travel: 0.96, drift: 14, speed: 0.21, alpha: 0.58 },
  },
  laundry: {
    far: { scale: 1.1, travel: 0.34, drift: 7, speed: 0.1, alpha: 1 },
    mid: { scale: 1.15, travel: 0.64, drift: 10, speed: 0.15, alpha: 0.7 },
    near: { scale: 1.22, travel: 0.98, drift: 15, speed: 0.2, alpha: 0.66 },
  },
  market: {
    far: { scale: 1.1, travel: 0.3, drift: 6, speed: 0.09, alpha: 1 },
    mid: { scale: 1.15, travel: 0.6, drift: 9, speed: 0.14, alpha: 0.7 },
    near: { scale: 1.22, travel: 0.98, drift: 13, speed: 0.19, alpha: 0.69 },
  },
};

const COMPLETION_CELEBRATION_SECONDS = 0.7;
const VIEW_CULL_MARGIN = 180;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const approach = (value, target, amount) => {
  if (value < target) return Math.min(value + amount, target);
  if (value > target) return Math.max(value - amount, target);
  return target;
};

const intersects = (a, b) =>
  a.x < b.x + b.w &&
  a.x + a.w > b.x &&
  a.y < b.y + b.h &&
  a.y + a.h > b.y;

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
};

export class MoonlightGame {
  constructor({ canvas, assets, input, audio, settings, events = {} }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.ctx.imageSmoothingEnabled = false;
    this.assets = assets;
    this.input = input;
    this.audio = audio;
    this.settings = settings;
    this.events = events;
    this.mode = "menu";
    this.level = null;
    this.player = null;
    this.cameraX = 0;
    this.elapsed = 0;
    this.runStarted = false;
    this.ambientTime = 0;
    this.accumulator = 0;
    this.lastTimestamp = 0;
    this.shake = 0;
    this.particles = [];
    this.toastCooldown = 0;
    this.completionDelay = 0;
    this.completionStats = null;
    this.completionNotified = false;
    this.raf = 0;
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  setSettings(settings) {
    this.settings = settings;
  }

  showMenu() {
    this.mode = "menu";
    this.level = null;
    this.player = null;
    this.cameraX = 0;
    this.particles.length = 0;
    this.completionDelay = 0;
    this.completionStats = null;
    this.completionNotified = false;
  }

  loadLevel(source) {
    this.level = {
      ...source,
      platforms: source.platforms.map((platform, index) => {
        const baseX = platform.x;
        const baseY = platform.y;
        const offset = platform.type === "moving"
          ? Math.sin(platform.phase || 0) * (platform.range || 80)
          : 0;
        return {
          ...platform,
          x: platform.axis === "x" ? baseX + offset : baseX,
          y: platform.axis === "y" ? baseY + offset : baseY,
          id: `${source.id}-platform-${index}`,
          baseX,
          baseY,
          dx: 0,
          dy: 0,
          crumbleTimer: 0,
          respawnTimer: 0,
          inactive: false,
        };
      }),
      fish: source.fish.map((fish, index) => ({ ...fish, id: index, collected: false })),
      yarn: { ...source.yarn, collected: false },
      checkpoint: { ...source.checkpoint, active: false },
      enemies: source.enemies.map((enemy, index) => ({
        ...enemy,
        id: index,
        direction: index % 2 ? -1 : 1,
        bob: index * 1.7,
      })),
    };

    this.player = this.createPlayer(source.spawn);
    this.cameraX = clamp(source.spawn.x - 180, 0, Math.max(0, source.width - VIEW_W));
    this.elapsed = 0;
    this.runStarted = false;
    this.accumulator = 0;
    this.shake = 0;
    this.particles.length = 0;
    this.completionDelay = 0;
    this.completionStats = null;
    this.completionNotified = false;
    this.mode = "playing";
    this.emitHud();
    this.events.toast?.(`${source.name} — ${source.subtitle}`);
  }

  createPlayer(spawn) {
    return {
      x: spawn.x,
      y: spawn.y,
      w: PLAYER_W,
      h: PLAYER_H,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: false,
      groundPlatform: null,
      wallDir: 0,
      coyote: 0,
      jumpBuffer: 0,
      dashTimer: 0,
      dashAvailable: true,
      invulnerable: 0,
      health: 3,
      spawnX: spawn.x,
      spawnY: spawn.y,
      fish: 0,
      yarn: false,
      animationTime: 0,
      strideDistance: 0,
      takeoffTimer: 0,
      landingTimer: 0,
      hurtPoseTimer: 0,
      landSquash: 0,
      state: "idle",
    };
  }

  pause() {
    if (this.mode === "playing") this.mode = "paused";
  }

  resume() {
    if (this.mode === "paused") {
      this.mode = "playing";
      this.lastTimestamp = performance.now();
      this.accumulator = 0;
    }
  }

  loop(timestamp) {
    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const frameDelta = Math.min((timestamp - this.lastTimestamp) / 1000, 0.05);
    this.lastTimestamp = timestamp;
    this.ambientTime += frameDelta;

    let stepped = false;
    if (this.mode === "playing") {
      this.accumulator += frameDelta;
      let steps = 0;
      while (this.accumulator >= FIXED_STEP && steps < 4) {
        this.update(FIXED_STEP);
        this.accumulator -= FIXED_STEP;
        steps += 1;
        stepped = true;
        if (this.mode !== "playing") {
          this.accumulator = 0;
          break;
        }
      }
    } else if (this.mode === "complete") {
      this.updateParticles(frameDelta);
      this.advancePlayerAnimation(frameDelta);
      if (!this.completionNotified && this.completionStats) {
        this.completionDelay = Math.max(0, this.completionDelay - frameDelta);
        if (this.completionDelay <= 0) this.finishCompletion();
      }
    }

    this.render();
    if (stepped || this.mode !== "playing") this.input.endFrame();
    this.raf = requestAnimationFrame(this.loop);
  }

  update(dt) {
    if (this.mode !== "playing" || !this.player || !this.level) return;

    if (this.input.consume("pause")) {
      this.events.pause?.();
      return;
    }
    if (this.input.consume("restart")) {
      this.events.restart?.();
      return;
    }

    const player = this.player;
    const jumpPressed = this.input.consume("jump");
    const dashPressed = this.input.consume("dash");
    const move = (this.input.isDown("right") ? 1 : 0) - (this.input.isDown("left") ? 1 : 0);
    if (jumpPressed || dashPressed || move) this.runStarted = true;
    if (this.runStarted) this.elapsed += dt;
    this.toastCooldown = Math.max(0, this.toastCooldown - dt);
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    player.takeoffTimer = Math.max(0, player.takeoffTimer - dt);
    player.landingTimer = Math.max(0, player.landingTimer - dt);
    player.hurtPoseTimer = Math.max(0, player.hurtPoseTimer - dt);
    player.landSquash = Math.max(0, player.landSquash - dt * 5);
    this.shake = Math.max(0, this.shake - dt * 8);

    this.updatePlatforms(dt);
    if (player.grounded && player.groundPlatform && !player.groundPlatform.inactive) {
      player.x += player.groundPlatform.dx;
      player.y += player.groundPlatform.dy;
    }
    const animationStartX = player.x;

    if (jumpPressed) player.jumpBuffer = 0.12;
    else player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);

    if (player.grounded) player.coyote = 0.12;
    else player.coyote = Math.max(0, player.coyote - dt);

    if (move) player.facing = move;

    if (dashPressed && player.dashAvailable && player.dashTimer <= 0) {
      player.dashTimer = 0.17;
      player.dashAvailable = false;
      player.vx = player.facing * 600;
      player.vy = -35;
      this.setPlayerState("dash");
      this.audio.play("dash");
      this.burst(player.x + player.w / 2, player.y + player.h / 2, "#f7d477", 10, 140);
      if (!this.settings.reducedMotion && this.settings.screenShake) this.shake = 0.34;
    }

    if (player.jumpBuffer > 0) {
      if (player.coyote > 0) this.performJump();
      else if (player.wallDir) {
        player.vx = -player.wallDir * 360;
        player.facing = -player.wallDir;
        this.performJump(620);
      }
    }

    if (player.dashTimer > 0) {
      player.dashTimer -= dt;
      player.vx = player.facing * 600;
      player.vy += 180 * dt;
    } else {
      const targetVx = move * 270;
      const acceleration = player.grounded ? 2350 : 1250;
      const deceleration = player.grounded ? 2600 : 700;
      player.vx = approach(player.vx, targetVx, (move ? acceleration : deceleration) * dt);
      const shortJump = !this.input.isDown("jump") && player.vy < -220;
      player.vy = Math.min(player.vy + 1720 * (shortJump ? 2.15 : 1) * dt, 790);
    }

    const wasGrounded = player.grounded;
    const impactVelocity = player.vy;
    const previousBottom = player.y + player.h;
    const previousWall = player.wallDir;
    player.grounded = false;
    player.groundPlatform = null;
    player.wallDir = 0;

    player.x += player.vx * dt;
    this.resolveHorizontal(player, previousWall);
    player.y += player.vy * dt;
    this.resolveVertical(player, previousBottom);

    if (!wasGrounded && player.grounded) {
      player.dashAvailable = true;
      player.landingTimer = 0.12;
      player.landSquash = 1;
      if (Math.abs(impactVelocity) > 240) this.audio.play("land");
      this.burst(player.x + player.w / 2, player.y + player.h, "#f7e4c0", 5, 75);
    }

    if (player.wallDir && !player.grounded && player.vy > 150) {
      player.vy = Math.min(player.vy, 150);
    }

    player.x = clamp(player.x, 0, this.level.width - player.w);
    if (player.y > VIEW_H + 170) {
      this.fallOut();
      if (this.mode !== "playing") {
        this.emitHud();
        return;
      }
    }

    this.updateEnemies(dt);
    this.checkCollectibles();
    this.checkHazards();
    if (this.mode !== "playing") {
      this.updateParticles(dt);
      this.emitHud();
      return;
    }
    this.checkCheckpoint();
    this.checkGoal();
    if (this.mode !== "playing") {
      this.updateParticles(dt);
      this.emitHud();
      return;
    }
    this.updateParticles(dt);
    this.updateCamera(dt);
    this.updatePlayerState(dt, Math.abs(player.x - animationStartX));
    this.emitHud();
  }

  performJump(power = 650) {
    const player = this.player;
    player.vy = -power;
    player.grounded = false;
    player.groundPlatform = null;
    player.coyote = 0;
    player.jumpBuffer = 0;
    player.dashAvailable = true;
    player.takeoffTimer = 0.08;
    player.landingTimer = 0;
    this.setPlayerState("takeoff");
    this.audio.play("jump");
    this.burst(player.x + player.w / 2, player.y + player.h, "#b7d9d4", 4, 65);
  }

  updatePlatforms(dt) {
    for (const platform of this.level.platforms) {
      platform.dx = 0;
      platform.dy = 0;
      const oldX = platform.x;
      const oldY = platform.y;

      if (platform.type === "moving") {
        const offset = Math.sin(this.elapsed * (platform.speed || 1.2) + (platform.phase || 0)) * (platform.range || 80);
        if (platform.axis === "y") platform.y = platform.baseY + offset;
        else platform.x = platform.baseX + offset;
      }

      platform.dx = platform.x - oldX;
      platform.dy = platform.y - oldY;

      if (platform.type === "crumble") {
        if (platform.crumbleTimer > 0) {
          platform.crumbleTimer -= dt;
          if (platform.crumbleTimer <= 0) {
            platform.inactive = true;
            platform.respawnTimer = 2.2;
          }
        } else if (platform.inactive) {
          platform.respawnTimer -= dt;
          if (platform.respawnTimer <= 0) platform.inactive = false;
        }
      }
    }
  }

  resolveHorizontal(player) {
    for (const platform of this.level.platforms) {
      if (platform.inactive || platform.type === "ledge" || platform.type === "awning" || platform.type === "crumble" || platform.type === "moving") continue;
      if (!intersects(player, platform)) continue;
      if (player.vx > 0) {
        player.x = platform.x - player.w;
        player.wallDir = 1;
      } else if (player.vx < 0) {
        player.x = platform.x + platform.w;
        player.wallDir = -1;
      }
      player.vx = 0;
    }
  }

  resolveVertical(player, previousBottom) {
    for (const platform of this.level.platforms) {
      if (platform.inactive || !intersects(player, platform)) continue;
      const isOneWay = platform.type !== "solid";
      const approachingTop = player.vy >= 0 && previousBottom <= platform.y + Math.max(8, platform.dy + 8);

      if (approachingTop) {
        player.y = platform.y - player.h;
        if (platform.type === "awning") {
          player.vy = -790;
          player.dashAvailable = true;
          this.audio.play("jump");
          this.burst(player.x + player.w / 2, platform.y, "#ff9a7a", 12, 155);
        } else {
          player.vy = 0;
          player.grounded = true;
          player.groundPlatform = platform;
          if (platform.type === "crumble" && platform.crumbleTimer <= 0) platform.crumbleTimer = 0.48;
        }
      } else if (!isOneWay && player.vy < 0) {
        player.y = platform.y + platform.h;
        player.vy = 40;
      }
    }
  }

  updateEnemies(dt) {
    for (const enemy of this.level.enemies) {
      enemy.x += enemy.speed * 82 * enemy.direction * dt;
      if (enemy.x <= enemy.minX) {
        enemy.x = enemy.minX;
        enemy.direction = 1;
      } else if (enemy.x >= enemy.maxX) {
        enemy.x = enemy.maxX;
        enemy.direction = -1;
      }
      enemy.bob += dt * 4;
    }
  }

  checkCollectibles() {
    const player = this.player;
    for (const fish of this.level.fish) {
      if (fish.collected) continue;
      const hitbox = { x: fish.x - 18, y: fish.y - 18, w: 36, h: 36 };
      if (intersects(player, hitbox)) {
        fish.collected = true;
        player.fish += 1;
        this.audio.play("collect");
        this.burst(fish.x, fish.y, "#f8d371", 15, 180);
        if (player.fish === this.level.fish.length) {
          this.audio.play("unlock");
          this.events.toast?.(
            this.level.copy?.goalOpened || "All moonfish found — the way home is open!",
          );
          this.burst(this.level.goal.x, this.level.goal.y - 30, "#ffcf72", 22, 220);
        }
      }
    }

    if (!this.level.yarn.collected) {
      const yarn = { x: this.level.yarn.x - 18, y: this.level.yarn.y - 18, w: 36, h: 36 };
      if (intersects(player, yarn)) {
        this.level.yarn.collected = true;
        player.yarn = true;
        this.audio.play("yarn");
        this.events.toast?.("Secret yarn found!");
        this.burst(this.level.yarn.x, this.level.yarn.y, "#f6b84c", 20, 210);
      }
    }
  }

  checkCheckpoint() {
    const checkpoint = this.level.checkpoint;
    if (checkpoint.active) return;
    const hitbox = { x: checkpoint.x - 32, y: checkpoint.y - 82, w: 64, h: 138 };
    if (intersects(this.player, hitbox)) {
      checkpoint.active = true;
      this.player.spawnX = checkpoint.x;
      this.player.spawnY = checkpoint.y - this.player.h - 4;
      this.audio.play("checkpoint");
      this.events.toast?.("Respawn lantern lit");
      this.burst(checkpoint.x, checkpoint.y - 32, "#ffbf61", 24, 180);
    }
  }

  checkHazards() {
    if (this.player.invulnerable > 0 || this.player.dashTimer > 0) return;
    for (const enemy of this.level.enemies) {
      const hitbox = { x: enemy.x - 21, y: enemy.y - 34, w: 42, h: 36 };
      if (intersects(this.player, hitbox)) {
        this.hurt(this.player.x < enemy.x ? -1 : 1);
        return;
      }
    }

    for (const vent of this.level.vents) {
      if (!this.isVentActive(vent)) continue;
      const hitbox = { x: vent.x - 18, y: vent.y - 92, w: 36, h: 84 };
      if (intersects(this.player, hitbox)) {
        this.hurt(this.player.x < vent.x ? -1 : 1);
        return;
      }
    }
  }

  isVentActive(vent) {
    return this.getVentSignal(vent) > 0.12;
  }

  getVentSignal(vent) {
    return Math.sin(this.elapsed * 3.3 + (vent.phase || 0));
  }

  hurt(direction) {
    const player = this.player;
    if (!player || this.mode !== "playing" || player.health <= 0 || player.invulnerable > 0) return false;
    player.health -= 1;
    player.invulnerable = 1.35;
    player.vx = direction * 330;
    player.vy = -430;
    player.dashTimer = 0;
    player.hurtPoseTimer = 0.44;
    this.setPlayerState("hurt");
    this.audio.play("hurt");
    this.burst(player.x + player.w / 2, player.y + player.h / 2, "#ff6f6a", 18, 210);
    if (!this.settings.reducedMotion && this.settings.screenShake) this.shake = 0.8;
    if (player.health <= 0) {
      this.mode = "gameover";
      this.audio.stopMusic();
      this.events.gameover?.();
    }
    return true;
  }

  fallOut() {
    const player = this.player;
    if (!player || this.mode !== "playing" || player.health <= 0) return false;
    const takesDamage = player.invulnerable <= 0;
    if (takesDamage) {
      player.health -= 1;
      player.hurtPoseTimer = 0.32;
      this.setPlayerState("hurt");
      this.audio.play("hurt");
    }
    if (player.health <= 0) {
      this.mode = "gameover";
      this.audio.stopMusic();
      this.events.gameover?.();
      return true;
    }
    player.x = player.spawnX;
    player.y = player.spawnY;
    player.vx = 0;
    player.vy = 0;
    player.invulnerable = 1.25;
    player.dashAvailable = true;
    this.cameraX = clamp(player.x - 220, 0, Math.max(0, this.level.width - VIEW_W));
    this.events.toast?.("Miso lands safely back at the lantern");
    if (!this.settings.reducedMotion && this.settings.screenShake) this.shake = 0.6;
    return takesDamage;
  }

  checkGoal() {
    if (this.mode !== "playing" || !this.player || !this.level) return false;
    const goal = this.level.goal;
    const hitbox = { x: goal.x - 52, y: goal.y - 100, w: 104, h: 164 };
    if (!intersects(this.player, hitbox)) return false;

    if (this.player.fish < this.level.fish.length) {
      if (this.toastCooldown <= 0) {
        const remaining = this.level.fish.length - this.player.fish;
        const goalLocked = this.level.copy?.goalLocked?.replace("{remaining}", String(remaining));
        this.events.toast?.(goalLocked || `${remaining} moonfish still lighting the way`);
        this.toastCooldown = 1.8;
      }
      return false;
    }

    this.mode = "complete";
    this.setPlayerState("celebrate");
    this.player.vx = 0;
    this.player.dashTimer = 0;
    this.player.invulnerable = 0;
    this.audio.play("complete");
    this.audio.stopMusic();
    this.burst(goal.x, goal.y - 45, "#ffe39a", 36, 250);
    this.completionStats = {
      levelId: this.level.id,
      levelName: this.level.name,
      time: this.elapsed,
      timeLabel: formatTime(this.elapsed),
      fish: this.player.fish,
      totalFish: this.level.fish.length,
      yarn: this.player.yarn,
    };
    this.completionDelay = this.settings.reducedMotion ? 0.18 : COMPLETION_CELEBRATION_SECONDS;
    this.completionNotified = false;
    return true;
  }

  finishCompletion() {
    if (this.completionNotified || !this.completionStats || this.mode !== "complete") return false;
    this.completionNotified = true;
    this.events.complete?.(this.completionStats);
    return true;
  }

  setPlayerState(nextState) {
    const player = this.player;
    if (!player || player.state === nextState) return false;
    player.state = nextState;
    player.animationTime = 0;
    if (nextState === "run") {
      player.strideDistance = 0;
    }
    return true;
  }

  advancePlayerAnimation(dt = 0, horizontalDistance = 0) {
    const player = this.player;
    if (!player) return;
    player.animationTime += Math.max(0, dt);
    if (player.state === "run" && player.grounded) {
      player.strideDistance += Math.max(0, horizontalDistance);
    }
  }

  updatePlayerState(dt = 0, horizontalDistance = 0) {
    const player = this.player;
    if (!player) return;

    let nextState = "idle";
    if (this.mode === "complete" || player.state === "celebrate") nextState = "celebrate";
    else if (player.hurtPoseTimer > 0) nextState = "hurt";
    else if (player.dashTimer > 0) nextState = "dash";
    else if (player.takeoffTimer > 0) nextState = "takeoff";
    else if (!player.grounded && player.wallDir && player.vy > 0) nextState = "wall";
    else if (player.grounded && player.landingTimer > 0) nextState = "land";
    else if (!player.grounded && player.vy < -130) nextState = "rise";
    else if (!player.grounded && player.vy <= 120) nextState = "apex";
    else if (!player.grounded) nextState = "fall";
    else if (Math.abs(player.vx) > 28) nextState = "run";

    this.setPlayerState(nextState);
    this.advancePlayerAnimation(dt, horizontalDistance);
  }

  updateCamera(dt) {
    const lookAhead = this.settings.reducedMotion ? 0 : this.player.vx * 0.16;
    const target = clamp(this.player.x - 265 + lookAhead, 0, Math.max(0, this.level.width - VIEW_W));
    const easing = this.settings.reducedMotion ? 3.2 : 5.4;
    this.cameraX += (target - this.cameraX) * Math.min(1, dt * easing);
  }

  emitHud() {
    if (!this.level || !this.player) return;
    this.events.hud?.({
      health: this.player.health,
      fish: this.player.fish,
      totalFish: this.level.fish.length,
      yarn: this.player.yarn,
      levelName: this.level.name,
      time: formatTime(this.elapsed),
    });
  }

  burst(x, y, color, count = 8, speed = 100) {
    const total = this.settings.reducedMotion ? Math.ceil(count / 3) : count;
    for (let i = 0; i < total; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const force = speed * (0.35 + Math.random() * 0.65);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * force,
        vy: Math.sin(angle) * force - 30,
        life: 0.45 + Math.random() * 0.45,
        maxLife: 0.9,
        size: 2 + Math.random() * 4,
        color,
      });
    }
  }

  updateParticles(dt) {
    for (const particle of this.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 340 * dt;
      particle.vx *= 0.985;
    }
    this.particles = this.particles.filter((particle) => particle.life > 0);
  }

  render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    this.drawBackground();

    const shakeMagnitude = this.settings.screenShake && !this.settings.reducedMotion ? this.shake * 7 : 0;
    const shakeX = shakeMagnitude ? (Math.random() - 0.5) * shakeMagnitude : 0;
    const shakeY = shakeMagnitude ? (Math.random() - 0.5) * shakeMagnitude : 0;
    ctx.translate(Math.round(shakeX), Math.round(shakeY));

    if (this.level) {
      ctx.save();
      ctx.translate(-Math.round(this.cameraX), 0);
      this.drawWorld();
      ctx.restore();
    } else {
      this.drawMenuWorld();
    }
    ctx.restore();
  }

  drawBackground() {
    const ctx = this.ctx;
    const theme = this.getThemeAssets();
    if (!theme?.far) {
      ctx.fillStyle = "#10152d";
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      return;
    }
    const style = PARALLAX_STYLES[this.getThemeName()] || PARALLAX_STYLES[DEFAULT_THEME];
    this.drawParallaxLayer(theme.far, style.far, 0);
    this.drawParallaxLayer(theme.mid, style.mid, 1.9);
    this.drawParallaxLayer(theme.near, style.near, 3.7);
    this.drawThemeSceneProps();
    this.drawThemeAtmosphere();
  }

  drawParallaxLayer(image, style, phase = 0) {
    if (!image || !style) return;
    const ctx = this.ctx;
    const transform = this.getParallaxTransform(style, phase);

    ctx.save();
    ctx.globalAlpha = style.alpha;
    ctx.drawImage(image, transform.x, transform.y, transform.width, transform.height);
    ctx.restore();
  }

  getParallaxTransform(style, phase = 0) {
    const width = VIEW_W * style.scale;
    const height = VIEW_H * style.scale;
    const overscan = Math.max(0, width - VIEW_W);
    const maxCamera = Math.max(1, (this.level?.width || VIEW_W) - VIEW_W);
    const progress = clamp(this.cameraX / maxCamera, 0, 1);
    const travel = overscan * style.travel;
    const buffer = Math.max(0, (overscan - travel) / 2);
    const ambientDrift = this.settings.reducedMotion
      ? 0
      : Math.sin(this.ambientTime * Math.PI * 2 * style.speed + phase) * Math.min(style.drift, buffer * 0.72);
    const x = clamp(-buffer - travel * progress + ambientDrift, -overscan, 0);
    const y = (VIEW_H - height) * 0.52;
    return {
      x: Math.round(x),
      y: Math.round(y),
      width: Math.ceil(width),
      height: Math.ceil(height),
    };
  }

  getThemeName() {
    return this.level?.theme || DEFAULT_THEME;
  }

  getThemeAssets() {
    if (this.assets.themes) {
      return this.assets.themes[this.getThemeName()] || this.assets.themes[DEFAULT_THEME];
    }

    // Retain support for the original flat asset shape in lightweight test harnesses.
    return {
      far: this.assets.sky,
      mid: this.assets.skyline,
      near: this.assets.roofs,
      atlas: this.assets.atlas,
    };
  }

  drawThemeAtmosphere() {
    const theme = this.getThemeName();
    const ctx = this.ctx;
    const motionTime = this.settings.reducedMotion ? this.ambientTime * 0.18 : this.ambientTime;
    ctx.save();

    if (theme === DEFAULT_THEME) {
      const sparkleCount = this.settings.reducedMotion ? 3 : 7;
      for (let index = 0; index < sparkleCount; index += 1) {
        const x = 94 + ((index * 173 - this.cameraX * 0.025) % 850);
        const y = 68 + ((index * 71) % 220);
        const pulse = this.settings.reducedMotion ? 0.14 : (Math.sin(motionTime * 1.4 + index * 1.9) + 1) * 0.14;
        ctx.globalAlpha = 0.14 + pulse;
        this.drawAtlas(14, x, y, 18, 18);
      }

      const smokeCount = this.settings.reducedMotion ? 1 : 3;
      for (let index = 0; index < smokeCount; index += 1) {
        const rise = (motionTime * (9 + index * 2) + index * 34) % 82;
        const x = 165 + index * 298 - this.cameraX * 0.045 + Math.sin(motionTime * 0.7 + index) * 6;
        const y = 338 - rise;
        ctx.globalAlpha = 0.1 + (1 - rise / 82) * 0.16;
        this.drawAtlas(15, x, y, 42, 42);
      }
    } else if (theme === "laundry") {
      const moteCount = this.settings.reducedMotion ? 5 : 12;
      ctx.fillStyle = "rgba(255, 235, 196, 0.42)";
      for (let index = 0; index < moteCount; index += 1) {
        const travel = index * 173 + motionTime * (16 + (index % 4) * 5) - this.cameraX * 0.025;
        const x = ((travel % (VIEW_W + 100)) + VIEW_W + 100) % (VIEW_W + 100) - 50;
        const y = 74 + ((index * 83) % 330) + Math.sin(motionTime * 1.4 + index) * 13;
        const width = 3 + (index % 3) * 2;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-0.22 + Math.sin(motionTime + index) * 0.16);
        ctx.fillRect(-width / 2, -1, width, 2);
        ctx.restore();
      }

      ctx.strokeStyle = "rgba(244, 224, 201, 0.17)";
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      for (let index = 0; index < 3; index += 1) {
        const drift = this.settings.reducedMotion ? 0 : (motionTime * (24 + index * 4)) % (VIEW_W + 260);
        const x = -180 + drift;
        const y = 150 + index * 105;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.bezierCurveTo(x + 54, y - 15, x + 104, y + 16, x + 170, y - 2);
        ctx.stroke();
      }
    } else if (theme === "market") {
      const dropCount = this.settings.reducedMotion ? 14 : 34;
      ctx.strokeStyle = "rgba(182, 217, 224, 0.27)";
      ctx.lineWidth = 1.25;
      ctx.lineCap = "round";
      for (let index = 0; index < dropCount; index += 1) {
        const x = ((index * 79 + this.cameraX * 0.035) % (VIEW_W + 50)) - 25;
        const fall = index * 59 + motionTime * (185 + (index % 5) * 16);
        const y = (fall % (VIEW_H + 80)) - 60;
        const length = 10 + (index % 4) * 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - length * 0.28, y + length);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  drawThemeSceneProps() {
    if (this.getThemeName() !== "laundry") return;
    const cloth = this.getThemeAssets()?.cloth;
    if (!cloth) return;

    const cellW = cloth.naturalWidth / 4;
    const cellH = cloth.naturalHeight / 2;
    const frame = this.settings.reducedMotion ? 0 : Math.floor(this.ambientTime * 3.4) % 4;
    const style = (PARALLAX_STYLES[this.getThemeName()] || PARALLAX_STYLES[DEFAULT_THEME]).near;
    const layer = this.getParallaxTransform(style, 3.7);
    const placements = [
      // These sit directly over the matching painted sheets already attached
      // to the left-hand clothesline, so the motion reads as part of the art.
      { x: 0.014, y: 0.282, row: 0, width: 152, height: 188 },
      { x: 0.117, y: 0.315, row: 1, width: 152, height: 188 },
    ];

    this.ctx.save();
    this.ctx.globalAlpha = 0.74;
    for (const placement of placements) {
      const x = layer.x + layer.width * placement.x;
      const y = layer.y + layer.height * placement.y;
      if (x + placement.width < -60 || x > VIEW_W + 60) continue;
      this.ctx.drawImage(
        cloth,
        frame * cellW,
        placement.row * cellH,
        cellW,
        cellH,
        Math.round(x),
        Math.round(y),
        placement.width,
        placement.height,
      );
    }
    this.ctx.restore();
  }

  drawMenuWorld() {
    const ctx = this.ctx;
    const baseY = 466;
    this.drawPlatform({ x: -30, y: baseY, w: 390, h: 80, type: "solid", inactive: false }, 0);
    this.drawPlatform({ x: 680, y: 438, w: 320, h: 105, type: "solid", inactive: false }, 0);
    const bob = Math.sin(this.ambientTime * 2.2) * 2;
    this.drawCat({
      x: 190,
      y: baseY - PLAYER_H + bob,
      w: PLAYER_W,
      h: PLAYER_H,
      facing: 1,
      state: "idle",
      animationTime: this.ambientTime,
      strideDistance: 0,
      invulnerable: 0,
      landSquash: 0,
    });
    this.drawAtlas(4, 742, 350 + Math.sin(this.ambientTime * 2.8) * 8, 62, 62);
  }

  drawWorld() {
    for (const platform of this.level.platforms) {
      if (this.isWorldItemVisible(platform.x, platform.w)) this.drawPlatform(platform);
    }
    if (this.isWorldItemVisible(this.level.checkpoint.x - 70, 140)) this.drawCheckpoint();
    if (this.isWorldItemVisible(this.level.goal.x - 100, 200)) this.drawGoal();
    this.drawCollectibles();
    this.drawVents();
    this.drawEnemies();
    this.drawPlayer();
    this.drawParticles();
  }

  drawPlatform(platform) {
    if (platform.inactive) return;
    if (platform.type === "solid" && platform.h > 44) {
      this.drawFoundationTexture(platform);
    }

    if (platform.type === "awning") {
      this.drawAtlas(2, platform.x - 14, platform.y - 40, platform.w + 28, 92);
      return;
    }

    const atlasIndex = platform.type === "crumble" ? 3 : platform.type === "ledge" || platform.type === "moving" ? 1 : 0;
    const chunkWidth = atlasIndex === 1 ? 108 : 132;
    for (let offset = 0; offset < platform.w; offset += chunkWidth - 14) {
      const width = Math.min(chunkWidth, platform.w - offset + 18);
      const wobble = platform.type === "crumble" && platform.crumbleTimer > 0 ? Math.sin(this.elapsed * 55 + offset) * 2 : 0;
      // The atlas cells carry roughly 15–19px of transparent top padding at
      // this draw size. Offset the cap so its visible rim matches the actual
      // collision surface and Miso's planted paws do not appear to float.
      this.drawAtlas(atlasIndex, platform.x + offset - 12 + wobble, platform.y - 42, width + 24, 86);
    }
  }

  drawFoundationTexture(platform) {
    const atlas = this.getThemeAssets()?.atlas;
    if (!atlas) return;
    const ctx = this.ctx;
    const cellW = atlas.naturalWidth / 4;
    const cellH = atlas.naturalHeight / 4;
    const sourceX = cellW * 0.16;
    const sourceY = cellH * 0.58;
    const sourceW = cellW * 0.68;
    const sourceH = cellH * 0.23;
    const tileW = this.getThemeName() === "laundry" ? 92 : 104;
    const tileH = this.getThemeName() === "market" ? 36 : 40;

    ctx.save();
    ctx.beginPath();
    ctx.rect(platform.x + 3, platform.y + 18, Math.max(0, platform.w - 6), Math.max(0, platform.h - 18));
    ctx.clip();
    ctx.globalAlpha = 0.96;
    let row = 0;
    for (let y = platform.y + 18; y < platform.y + platform.h; y += tileH) {
      const stagger = row % 2 ? -tileW / 2 : 0;
      for (let x = platform.x + stagger; x < platform.x + platform.w; x += tileW) {
        ctx.drawImage(atlas, sourceX, sourceY, sourceW, sourceH, x, y, tileW + 1, tileH + 1);
      }
      row += 1;
    }
    ctx.restore();
  }

  isWorldItemVisible(x, width = 0, margin = VIEW_CULL_MARGIN) {
    return x + width >= this.cameraX - margin && x <= this.cameraX + VIEW_W + margin;
  }

  drawCollectibles() {
    for (const fish of this.level.fish) {
      if (fish.collected || !this.isWorldItemVisible(fish.x - 36, 72)) continue;
      const bob = Math.sin(this.elapsed * 3.2 + fish.id * 1.7) * 6;
      this.drawAtlas(4, fish.x - 31, fish.y - 31 + bob, 62, 62);
    }
    if (!this.level.yarn.collected && this.isWorldItemVisible(this.level.yarn.x - 36, 72)) {
      const bob = Math.sin(this.elapsed * 2.5 + 0.8) * 5;
      this.drawAtlas(5, this.level.yarn.x - 32, this.level.yarn.y - 32 + bob, 64, 64);
    }
  }

  drawCheckpoint() {
    const checkpoint = this.level.checkpoint;
    const pulse = checkpoint.active ? 1 + Math.sin(this.elapsed * 4) * 0.035 : 1;
    this.ctx.save();
    this.ctx.translate(checkpoint.x, checkpoint.y);
    this.ctx.scale(pulse, pulse);
    this.drawAtlas(7, -60, -102, 120, 120);
    this.ctx.restore();
  }

  drawGoal() {
    const goal = this.level.goal;
    const open = this.player.fish === this.level.fish.length;
    if (open) {
      const glow = this.ctx.createRadialGradient(goal.x, goal.y - 48, 5, goal.x, goal.y - 48, 90);
      glow.addColorStop(0, "rgba(255, 211, 111, 0.34)");
      glow.addColorStop(1, "rgba(255, 211, 111, 0)");
      this.ctx.fillStyle = glow;
      this.ctx.fillRect(goal.x - 100, goal.y - 145, 200, 170);
    }
    this.drawAtlas(open ? 12 : 13, goal.x - 84, goal.y - 132, 168, 168);
  }

  drawEnemies() {
    for (const enemy of this.level.enemies) {
      if (!this.isWorldItemVisible(enemy.x - 40, 80)) continue;
      const bob = Math.sin(enemy.bob) * 3;
      const angry = Math.abs(this.player.x - enemy.x) < 170;
      this.drawAtlas(angry ? 9 : 8, enemy.x - 30, enemy.y - 58 + bob, 60, 60, enemy.direction < 0);
    }
  }

  drawVents() {
    for (const vent of this.level.vents) {
      if (!this.isWorldItemVisible(vent.x - 44, 88)) continue;
      this.drawAtlas(10, vent.x - 34, vent.y - 57, 68, 68);
      const signal = this.getVentSignal(vent);
      if (signal <= -0.44) continue;
      const active = signal > 0.12;
      const warningStrength = clamp((signal + 0.44) / 0.56, 0, 1);
      const puff = active
        ? 0.7 + (Math.sin(this.elapsed * 7 + (vent.phase || 0)) + 1) * 0.2
        : 0.36 + warningStrength * 0.22;
      this.ctx.globalAlpha = active ? 0.42 : 0.08 + warningStrength * 0.16;
      this.drawAtlas(
        15,
        vent.x - 34 * puff,
        vent.y - (active ? 110 : 80),
        68 * puff,
        68 * puff,
      );
      this.ctx.globalAlpha = 1;
    }
  }

  drawPlayer() {
    if (
      this.mode === "playing"
      && this.player.invulnerable > 0
      && Math.floor(this.player.invulnerable * 14) % 2 === 0
    ) return;
    this.drawCat(this.player);
  }

  drawCat(player) {
    const sheet = this.assets.cat;
    if (!sheet) return;
    const pose = resolveCatPose(player, this.settings.reducedMotion);

    for (let index = pose.afterimages; index > 0; index -= 1) {
      this.drawCatPose(player, pose, -player.facing * index * 16, 0.08 + index * 0.04);
    }
    this.drawCatPose(player, pose);
  }

  drawCatPose(player, pose, offsetX = 0, alpha = 1) {
    const sheet = this.assets.cat;
    const source = getCatSourceRect(sheet, pose.frame);
    const placement = getCatFramePlacement(pose.frame, CAT_DRAW_SIZE);
    const squash = player.landSquash ? player.landSquash * 0.1 : 0;
    const centerX = player.x + player.w / 2;
    const bottom = player.y + player.h + 2;

    this.ctx.save();
    this.ctx.globalAlpha *= alpha;
    this.ctx.translate(centerX + offsetX, bottom + pose.offsetY);
    if (player.facing < 0) this.ctx.scale(-1, 1);
    this.ctx.rotate(pose.rotation);
    this.ctx.scale(
      pose.scaleX * (1 + squash),
      pose.scaleY * (1 - squash),
    );
    this.ctx.drawImage(
      sheet,
      source.sx,
      source.sy,
      source.sw,
      source.sh,
      placement.x,
      placement.y,
      CAT_DRAW_SIZE,
      CAT_DRAW_SIZE,
    );
    this.ctx.restore();
  }

  drawParticles() {
    for (const particle of this.particles) {
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = particle.color;
      this.ctx.save();
      this.ctx.translate(particle.x, particle.y);
      this.ctx.rotate((1 - alpha) * 2);
      const size = particle.size * (0.5 + alpha * 0.5);
      this.ctx.fillRect(-size / 2, -size / 2, size, size);
      this.ctx.restore();
    }
    this.ctx.globalAlpha = 1;
  }

  drawAtlas(index, x, y, w, h, flip = false) {
    const atlas = this.getThemeAssets()?.atlas;
    if (!atlas) return;
    const cellW = atlas.naturalWidth / 4;
    const cellH = atlas.naturalHeight / 4;
    const column = index % 4;
    const row = Math.floor(index / 4);
    this.ctx.save();
    if (flip) {
      this.ctx.translate(x * 2 + w, 0);
      this.ctx.scale(-1, 1);
    }
    this.ctx.drawImage(atlas, column * cellW, row * cellH, cellW, cellH, x, y, w, h);
    this.ctx.restore();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
  }
}

export { formatTime, VIEW_W, VIEW_H };
