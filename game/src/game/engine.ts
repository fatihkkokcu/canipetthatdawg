import { InputManager } from './input';
import { clamp, damp, dist2, len } from './math';
import { Particles } from './particles';
import { Player } from './player';
import {
  cameraZoom,
  drawAtmosphere,
  drawBoostPads,
  drawCollectibles,
  drawGround,
  drawJoystick,
  drawMinimap,
  drawMonolithBodies,
  drawMonolithShadows,
  drawPlayer,
  drawWorldEdge,
  type Camera,
} from './render';
import type { GestureName, HudState, RunResult, ThemeConfig } from './types';
import { World, WORLD_MARGIN } from './world';

export const ROUND_TIME = 90;
const FIXED_STEP = 1 / 120;
const MAX_FRAME = 0.1;
const MAX_COMBO = 8;
const COMBO_WINDOW = 5;
const BASE_POINTS = 10;
const HUD_INTERVAL = 0.08;

interface FloatingText {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}

type Phase = 'countdown' | 'running' | 'paused' | 'finished';

export interface EngineCallbacks {
  onHud: (hud: HudState) => void;
  onFinish: (result: RunResult) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private input = new InputManager();
  private particles = new Particles();
  private world: World;
  private player: Player;
  private theme: ThemeConfig;
  private cam: Camera = { x: 0, y: 0, shakeX: 0, shakeY: 0 };
  private floats: FloatingText[] = [];

  private phase: Phase = 'countdown';
  private rafId = 0;
  private lastTime = 0;
  private accumulator = 0;
  private time = 0;
  private countdown = 3;
  private timeLeft = ROUND_TIME;
  private score = 0;
  private combo = 1;
  private bestCombo = 1;
  private comboTimer = 0;
  private collected = 0;
  private crashes = 0;
  private best = 0;
  private shake = 0;
  private holdActive = false;
  private lastAction: string | null = null;
  private lastActionTimer = 0;
  private hudTimer = 0;
  private cooldowns: Record<GestureName, number> = { doubleTap: 0, swipe: 0, hold: 0 };

  private width = 0;
  private height = 0;
  private dpr = 1;

  constructor(theme: ThemeConfig, private cb: EngineCallbacks) {
    this.theme = theme;
    this.world = new World(Date.now() & 0xffffffff);
    this.player = new Player(theme);
    this.best = readBest(theme.id);
  }

  mount(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.input.attach(canvas);
    this.resize();
    window.addEventListener('resize', this.resize);
    window.addEventListener('orientationchange', this.resize);
    this.restart();
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.frame);
  }

  unmount(): void {
    cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('orientationchange', this.resize);
    this.input.detach();
    this.canvas = null;
    this.ctx = null;
  }

  restart(): void {
    this.world = new World((Math.random() * 0xffffffff) >>> 0);
    this.player.setTheme(this.theme);
    this.player.reset(this.world.center, this.world.center);
    this.particles.clear();
    this.floats.length = 0;
    this.cam.x = this.player.x;
    this.cam.y = this.player.y;
    this.cam.shakeX = 0;
    this.cam.shakeY = 0;
    this.phase = 'countdown';
    this.countdown = 3;
    this.timeLeft = ROUND_TIME;
    this.score = 0;
    this.combo = 1;
    this.bestCombo = 1;
    this.comboTimer = 0;
    this.collected = 0;
    this.crashes = 0;
    this.shake = 0;
    this.holdActive = false;
    this.lastAction = null;
    this.lastActionTimer = 0;
    this.cooldowns = { doubleTap: 0, swipe: 0, hold: 0 };
    this.best = readBest(this.theme.id);
    this.input.reset();
    this.input.setEnabled(true);
    this.emitHud();
  }

  pause(): void {
    if (this.phase !== 'running' && this.phase !== 'countdown') return;
    this.phase = 'paused';
    this.input.setEnabled(false);
    this.emitHud();
  }

  resume(): void {
    if (this.phase !== 'paused') return;
    this.phase = this.countdown > 0 ? 'countdown' : 'running';
    this.input.setEnabled(true);
    this.lastTime = performance.now();
    this.emitHud();
  }

  get isPaused(): boolean {
    return this.phase === 'paused';
  }

  private resize = (): void => {
    const canvas = this.canvas;
    if (!canvas || !this.ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    this.width = w;
    this.height = h;
    this.dpr = dpr;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  };

  private frame = (now: number): void => {
    this.rafId = requestAnimationFrame(this.frame);
    const raw = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = clamp(raw, 0, MAX_FRAME);

    if (this.phase === 'paused') {
      this.render();
      return;
    }

    this.input.update();
    this.accumulator += dt;
    let steps = 0;
    while (this.accumulator >= FIXED_STEP && steps < 8) {
      this.step(FIXED_STEP);
      this.accumulator -= FIXED_STEP;
      steps += 1;
    }
    if (steps === 8) this.accumulator = 0;

    this.hudTimer -= dt;
    if (this.hudTimer <= 0) {
      this.hudTimer = HUD_INTERVAL;
      this.emitHud();
    }
    this.render();
  };

  private step(dt: number): void {
    this.time += dt;

    if (this.phase === 'countdown') {
      this.countdown -= dt;
      // Drain gestures so a pre-start tap does not fire the moment play begins.
      this.input.consumeGestures();
      if (this.countdown <= 0) {
        this.countdown = 0;
        this.phase = 'running';
      }
      this.updateCamera(dt);
      this.particles.update(dt);
      return;
    }
    if (this.phase !== 'running') return;

    this.handleGestures();

    for (const key of ['doubleTap', 'swipe', 'hold'] as GestureName[]) {
      if (this.cooldowns[key] > 0) this.cooldowns[key] = Math.max(0, this.cooldowns[key] - dt);
    }

    const braking = this.theme.abilities.hold.kind === 'brake' && this.holdActive;
    this.player.update(dt, this.input.axisX, this.input.axisY, braking);
    this.clampToArena();
    this.spawnTrail(dt);
    this.checkCollisions();

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0 && this.combo > 1) this.combo = 1;
    }
    if (this.lastActionTimer > 0) this.lastActionTimer -= dt;
    else this.lastAction = null;

    this.particles.update(dt);
    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i];
      f.life -= dt;
      f.y -= 46 * dt;
      if (f.life <= 0) this.floats.splice(i, 1);
    }

    this.shake = Math.max(0, this.shake - dt * 26);
    this.updateCamera(dt);

    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.finish();
    }
  }

  private handleGestures(): void {
    const events = this.input.consumeGestures();
    if (events.length === 0) return;
    const a = this.theme.abilities;
    for (const e of events) {
      switch (e.name) {
        case 'doubleTap':
          this.tryAbility('doubleTap', a.doubleTap.label, 0, 0);
          break;
        case 'swipe':
          this.tryAbility('swipe', a.swipe.label, e.dx, e.dy);
          break;
        case 'holdStart':
          this.holdActive = true;
          if (a.hold.kind === 'brake') {
            this.flashAction(a.hold.label);
          } else {
            this.tryAbility('hold', a.hold.label, 0, 0);
          }
          break;
        case 'holdEnd':
          this.holdActive = false;
          break;
        case 'tap':
          break;
      }
    }
  }

  private tryAbility(slot: GestureName, label: string, dx: number, dy: number): void {
    if (this.cooldowns[slot] > 0) return;
    const ability = this.theme.abilities[slot];
    if (ability.kind === 'hop' && this.player.airborne) return;
    this.cooldowns[slot] = ability.cooldown;
    this.player.useAbility(ability, dx, dy);
    this.flashAction(label);
    if (ability.style > 0) {
      this.addScore(ability.style, this.player.x, this.player.y - 26, label);
    }
    this.spawnAbilityFx(ability.kind);
  }

  private spawnAbilityFx(kind: string): void {
    const pal = this.theme.palette;
    const p = this.player;
    if (kind === 'hop') {
      this.particles.burst(p.x, p.y, 12, 120, pal.groundLight, 'dot');
      this.particles.spawn(p.x, p.y, 0, 0, 0.45, 10, pal.uiSoft, 'ring', 0.5);
    } else if (kind === 'boost') {
      this.particles.spawn(p.x, p.y, 0, 0, 0.5, 14, pal.glow, 'ring', 0.5);
    } else if (kind === 'dash') {
      this.particles.burst(p.x, p.y, 14, 240, pal.uiSoft, 'spark');
    } else if (kind === 'shield') {
      this.particles.spawn(p.x, p.y, 0, 0, 0.55, 18, pal.glow, 'ring', 0.5);
    }
  }

  /**
   * Dust kicked up by the ride. The scarf already draws the path, so this only
   * fires when there is something to say: a drift, a boost, a thruster.
   */
  private spawnTrail(dt: number): void {
    const p = this.player;
    const pal = this.theme.palette;
    if (p.airborne) return;

    const cos = Math.cos(p.heading);
    const sin = Math.sin(p.heading);
    const lateral = Math.abs(-p.vx * sin + p.vy * cos);
    const drifting = lateral > 90;
    const thrusting = this.theme.id === 'space' && this.input.axisMagnitude > 0.2;

    let rate = 0;
    if (drifting) rate += 1.5;
    if (p.boosting) rate += 1.7;
    if (thrusting) rate += 1.1;
    if (rate === 0) return;
    if (Math.random() > rate * dt * 21) return;

    const bx = p.x - cos * 15;
    const by = p.y - sin * 15;
    const jitter = () => (Math.random() - 0.5) * 70;
    const color = p.boosting ? pal.glow : drifting ? pal.groundLight : pal.ribbon;
    this.particles.spawn(
      bx,
      by,
      -cos * 45 + jitter(),
      -sin * 45 + jitter(),
      drifting ? 0.75 : 0.4,
      drifting ? 5 : 3,
      color,
      thrusting && !drifting ? 'spark' : 'dot',
      2.4,
    );
  }

  private clampToArena(): void {
    const p = this.player;
    const min = WORLD_MARGIN * 0.4;
    const max = this.world.size - WORLD_MARGIN * 0.4;
    if (p.x < min) {
      p.x = min;
      p.vx = Math.abs(p.vx) * 0.45;
    } else if (p.x > max) {
      p.x = max;
      p.vx = -Math.abs(p.vx) * 0.45;
    }
    if (p.y < min) {
      p.y = min;
      p.vy = Math.abs(p.vy) * 0.45;
    } else if (p.y > max) {
      p.y = max;
      p.vy = -Math.abs(p.vy) * 0.45;
    }
  }

  private checkCollisions(): void {
    const p = this.player;
    const pal = this.theme.palette;

    for (let i = 0; i < this.world.collectibles.length; i++) {
      const c = this.world.collectibles[i];
      const r = c.r + p.radius;
      if (dist2(p.x, p.y, c.x, c.y) > r * r) continue;
      this.collected += 1;
      this.combo = Math.min(MAX_COMBO, this.combo + 1);
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      this.comboTimer = COMBO_WINDOW;
      const points = BASE_POINTS * this.combo;
      this.addScore(points, c.x, c.y, `x${this.combo}`);
      this.particles.burst(c.x, c.y, 16, 180, pal.glow, 'spark');
      this.particles.spawn(c.x, c.y, 0, 0, 0.5, 12, pal.glow, 'ring', 0.5);
      this.world.collectibles[i] = this.world.makeCollectible(p.x, p.y);
    }

    for (const pad of this.world.boostPads) {
      const r = pad.r * 0.7 + p.radius;
      if (dist2(p.x, p.y, pad.x, pad.y) > r * r) continue;
      if (p.boostTime > 0.6) continue;
      p.boostTime = 1.3;
      p.boostPower = 1.7;
      this.particles.spawn(pad.x, pad.y, 0, 0, 0.5, 14, pal.glow, 'ring', 0.5);
    }

    if (p.invulnerable) return;

    for (const o of this.world.obstacles) {
      const r = o.r + p.radius;
      if (dist2(p.x, p.y, o.x, o.y) > r * r) continue;
      if (p.z > o.height) continue;
      const dx = p.x - o.x;
      const dy = p.y - o.y;
      const d = len(dx, dy) || 1;
      p.x = o.x + (dx / d) * r;
      p.y = o.y + (dy / d) * r;
      p.crash(dx / d, dy / d);
      this.crashes += 1;
      this.combo = 1;
      this.comboTimer = 0;
      this.shake = 8;
      this.flashAction('Çarptın!');
      this.particles.burst(p.x, p.y, 20, 220, pal.faceLit, 'spark');
      break;
    }
  }

  private addScore(points: number, x: number, y: number, label: string): void {
    this.score += points;
    this.floats.push({
      x,
      y,
      text: `+${points}  ${label}`,
      life: 0.9,
      color: this.theme.palette.glow,
    });
  }

  private flashAction(label: string): void {
    this.lastAction = label;
    this.lastActionTimer = 0.9;
  }

  private updateCamera(dt: number): void {
    const p = this.player;
    const targetX = p.x + p.vx * 0.28;
    const targetY = p.y + p.vy * 0.28;
    this.cam.x = damp(this.cam.x, targetX, 4.2, dt);
    this.cam.y = damp(this.cam.y, targetY, 4.2, dt);
    this.cam.shakeX = (Math.random() - 0.5) * this.shake;
    this.cam.shakeY = (Math.random() - 0.5) * this.shake;
  }

  private finish(): void {
    if (this.phase === 'finished') return;
    this.phase = 'finished';
    this.input.setEnabled(false);
    const isNewBest = this.score > this.best;
    if (isNewBest) {
      this.best = this.score;
      writeBest(this.theme.id, this.score);
    }
    this.emitHud();
    this.cb.onFinish({
      themeId: this.theme.id,
      score: this.score,
      collected: this.collected,
      bestCombo: this.bestCombo,
      crashes: this.crashes,
      isNewBest,
    });
  }

  private emitHud(): void {
    this.cb.onHud({
      score: this.score,
      best: this.best,
      combo: this.combo,
      timeLeft: this.timeLeft,
      collected: this.collected,
      running: this.phase === 'running',
      paused: this.phase === 'paused',
      finished: this.phase === 'finished',
      lastAction: this.lastAction,
      cooldowns: { ...this.cooldowns },
    });
  }

  private render(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const w = this.width;
    const h = this.height;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const camX = this.cam.x + this.cam.shakeX;
    const camY = this.cam.y + this.cam.shakeY;
    const zoom = cameraZoom(w, h);
    const cam = { x: camX, y: camY, shakeX: 0, shakeY: 0 };

    drawGround(ctx, this.theme, cam, w, h, zoom, this.time);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-camX, -camY);
    const viewW = w / zoom;
    const viewH = h / zoom;
    drawWorldEdge(ctx, this.theme, this.world);
    drawBoostPads(ctx, this.theme, this.world.boostPads, this.time);
    drawMonolithShadows(ctx, this.theme, this.world.obstacles, cam, viewW, viewH);
    this.particles.draw(ctx);
    drawCollectibles(ctx, this.theme, this.world.collectibles, this.time);
    const py = this.player.y;
    drawMonolithBodies(ctx, this.theme, this.world.obstacles, cam, viewW, viewH, -Infinity, py);
    drawPlayer(ctx, this.theme, this.player, this.time);
    drawMonolithBodies(
      ctx,
      this.theme,
      this.world.obstacles,
      cam,
      viewW,
      viewH,
      py,
      Infinity,
      this.player,
    );
    this.drawFloats(ctx, zoom);
    ctx.restore();

    drawAtmosphere(ctx, this.theme, cam, w, h, this.time);
    drawMinimap(ctx, this.theme, this.world, this.player, w - 104, 90, 88);
    drawJoystick(ctx, this.input.joystickView(), this.theme);

    if (this.phase === 'countdown') this.drawCountdown(ctx, w, h);
  }

  private drawFloats(ctx: CanvasRenderingContext2D, zoom: number): void {
    ctx.save();
    ctx.textAlign = 'center';
    // Divided by zoom so the label keeps a constant on-screen size.
    ctx.font = `300 ${17 / zoom}px 'Avenir Next', 'Segoe UI', ui-sans-serif, system-ui, sans-serif`;
    ctx.shadowColor = 'rgba(20, 12, 30, 0.65)';
    ctx.shadowBlur = 10 / zoom;
    for (const f of this.floats) {
      ctx.globalAlpha = clamp(f.life / 0.9, 0, 1);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private drawCountdown(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const n = Math.ceil(this.countdown);
    const text = n > 0 ? String(n) : 'BAŞLA!';
    const frac = this.countdown - Math.floor(this.countdown);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = clamp(0.35 + frac, 0, 1);
    ctx.font = 'bold 96px ui-sans-serif, system-ui, sans-serif';
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.strokeText(text, w / 2, h / 2);
    ctx.fillStyle = this.theme.palette.uiSoft;
    ctx.fillText(text, w / 2, h / 2);
    ctx.restore();
  }
}

function bestKey(themeId: string): string {
  return `glide-arena:best:${themeId}`;
}

export function readBest(themeId: string): number {
  try {
    const raw = localStorage.getItem(bestKey(themeId));
    const n = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function writeBest(themeId: string, score: number): void {
  try {
    localStorage.setItem(bestKey(themeId), String(score));
  } catch {
    /* storage unavailable (private mode) — scores just do not persist */
  }
}
