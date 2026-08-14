import { clamp, TAU } from './math';
import { hash2 } from './rng';
import type { Player } from './player';
import type { Palette, ThemeConfig, ThemeId } from './types';
import type { BoostPad, Collectible, Obstacle, World } from './world';
import type { JoystickView } from './input';

/**
 * Unit vector pointing from a surface towards the light. Everything in the
 * scene is shaded and casts its shadow from this one direction, which is what
 * gives the flat geometry its sense of volume.
 */
const LIGHT_X = -0.5;
const LIGHT_Y = -0.866;
const SHADOW_X = -LIGHT_X;
const SHADOW_Y = -LIGHT_Y;
/** Screen-space rise per unit of world height. Keeps monuments readable top-down. */
const RISE = 0.85;
/**
 * The player rises more gently than the monuments do — at the monuments' rate a
 * hop throws the figure so far up the screen it detaches from its own shadow.
 */
const PLAYER_RISE = 0.45;

export interface Camera {
  x: number;
  y: number;
  shakeX: number;
  shakeY: number;
}

interface Vec {
  x: number;
  y: number;
}

// ---------------------------------------------------------------- colour ---

function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Same colour at a different alpha. Canvas gradients interpolate towards
 * `transparent` through transparent *black*, which smears a grey halo around
 * every glow — always fade towards the colour's own zero-alpha form instead.
 */
export function fade(color: string, alpha: number): string {
  if (color.startsWith('#')) {
    const [r, g, b] = hexToRgb(color);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  const nums = color.match(/[\d.]+/g);
  if (!nums || nums.length < 3) return `rgba(0, 0, 0, ${alpha})`;
  return `rgba(${nums[0]}, ${nums[1]}, ${nums[2]}, ${alpha})`;
}

/** Blends two `#rrggbb` colours. Used to shade each facet by its normal. */
export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const k = clamp(t, 0, 1);
  const r = Math.round(ar + (br - ar) * k);
  const g = Math.round(ag + (bg - ag) * k);
  const bl = Math.round(ab + (bb - ab) * k);
  return `rgb(${r}, ${g}, ${bl})`;
}

// ---------------------------------------------------------------- camera ---

/** Keeps roughly the same slice of the world visible on a phone and a laptop. */
export function cameraZoom(w: number, h: number): number {
  return clamp(Math.min(w, h) / 420, 1, 2.2);
}

// ---------------------------------------------------------------- ground ---

const DUNE_CELL = 620;
const RIPPLE_STEP = 132;

export function drawGround(
  ctx: CanvasRenderingContext2D,
  theme: ThemeConfig,
  cam: Camera,
  w: number,
  h: number,
  zoom: number,
  time: number,
): void {
  const pal = theme.palette;
  const wash = ctx.createLinearGradient(0, 0, w * 0.25, h);
  wash.addColorStop(0, pal.washTop);
  wash.addColorStop(1, pal.washBottom);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);

  const viewW = w / zoom;
  const viewH = h / zoom;
  const left = cam.x - viewW / 2;
  const top = cam.y - viewH / 2;

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-cam.x, -cam.y);

  drawDunes(ctx, pal, left, top, viewW, viewH);
  if (theme.id === 'space') drawNebulaVeils(ctx, pal, left, top, viewW, viewH, time);
  else drawRipples(ctx, pal, left, top, viewW, viewH, zoom);

  ctx.restore();

  if (theme.id === 'space') drawStarfield(ctx, pal, cam, w, h, zoom, time);
}

/** Big soft tonal masses — the dunes and stone plates the world sits on. */
function drawDunes(
  ctx: CanvasRenderingContext2D,
  pal: Palette,
  left: number,
  top: number,
  viewW: number,
  viewH: number,
): void {
  const x0 = Math.floor((left - DUNE_CELL) / DUNE_CELL);
  const y0 = Math.floor((top - DUNE_CELL) / DUNE_CELL);
  const x1 = Math.ceil((left + viewW + DUNE_CELL) / DUNE_CELL);
  const y1 = Math.ceil((top + viewH + DUNE_CELL) / DUNE_CELL);

  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const cx = tx * DUNE_CELL + hash2(tx, ty, 3) * DUNE_CELL;
      const cy = ty * DUNE_CELL + hash2(tx, ty, 5) * DUNE_CELL;
      const rad = 230 + hash2(tx, ty, 7) * 330;
      const lit = hash2(tx, ty, 11) > 0.5;
      const grad = ctx.createRadialGradient(cx, cy, rad * 0.12, cx, cy, rad);
      const tone = lit ? pal.groundLight : pal.groundShade;
      grad.addColorStop(0, tone);
      grad.addColorStop(1, fade(tone, 0));
      ctx.globalAlpha = lit ? 0.6 : 0.5;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, TAU);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

/** Wind ripples across the sand, drawn as slow contour lines. */
function drawRipples(
  ctx: CanvasRenderingContext2D,
  pal: Palette,
  left: number,
  top: number,
  viewW: number,
  viewH: number,
  zoom: number,
): void {
  ctx.strokeStyle = pal.contour;
  ctx.lineWidth = 1.5 / zoom;
  const first = Math.floor((top - RIPPLE_STEP) / RIPPLE_STEP) * RIPPLE_STEP;
  const last = top + viewH + RIPPLE_STEP;
  const x0 = left - 60;
  const x1 = left + viewW + 60;
  for (let by = first; by <= last; by += RIPPLE_STEP) {
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 56) {
      const y =
        by +
        Math.sin(x * 0.0055 + by * 0.017) * 22 +
        Math.sin(x * 0.0121 + by * 0.031) * 9;
      if (x === x0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function drawNebulaVeils(
  ctx: CanvasRenderingContext2D,
  pal: Palette,
  left: number,
  top: number,
  viewW: number,
  viewH: number,
  time: number,
): void {
  const drift = Math.sin(time * 0.08) * 40;
  for (let i = 0; i < 3; i++) {
    const cx = left + viewW * (0.25 + i * 0.28) + drift;
    const cy = top + viewH * (0.3 + ((i * 0.27) % 0.5));
    const rad = 420 + i * 90;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    grad.addColorStop(0, pal.groundLight);
    grad.addColorStop(1, fade(pal.groundLight, 0));
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawStarfield(
  ctx: CanvasRenderingContext2D,
  pal: Palette,
  cam: Camera,
  w: number,
  h: number,
  zoom: number,
  time: number,
): void {
  const layers = [
    { p: 0.25, size: 1, alpha: 0.4, step: 190 },
    { p: 0.5, size: 1.6, alpha: 0.6, step: 250 },
    { p: 0.85, size: 2.3, alpha: 0.85, step: 340 },
  ];
  ctx.fillStyle = pal.glow;
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const ox = w / 2 - cam.x * layer.p * zoom;
    const oy = h / 2 - cam.y * layer.p * zoom;
    const step = layer.step;
    const x0 = Math.floor((-ox - w) / step);
    const y0 = Math.floor((-oy - h) / step);
    const x1 = Math.ceil((-ox + w) / step);
    const y1 = Math.ceil((-oy + h) / step);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const sx = ox + (tx + hash2(tx, ty, 7 + i)) * step;
        const sy = oy + (ty + hash2(tx, ty, 19 + i)) * step;
        if (sx < -8 || sy < -8 || sx > w + 8 || sy > h + 8) continue;
        const tw = hash2(tx, ty, 41 + i);
        ctx.globalAlpha = layer.alpha * (0.5 + 0.5 * Math.sin(time * 1.3 + tw * TAU));
        ctx.beginPath();
        ctx.arc(sx, sy, layer.size, 0, TAU);
        ctx.fill();
      }
    }
  }
  ctx.globalAlpha = 1;
}

export function drawWorldEdge(ctx: CanvasRenderingContext2D, theme: ThemeConfig, world: World): void {
  const pal = theme.palette;
  ctx.save();
  ctx.strokeStyle = pal.contour;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.9;
  ctx.strokeRect(0, 0, world.size, world.size);
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 26;
  ctx.strokeStyle = pal.groundShade;
  ctx.strokeRect(-13, -13, world.size + 26, world.size + 26);
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ------------------------------------------------------------- monuments ---

/** Outline of a monument at ground level. */
function monolithVerts(o: Obstacle, scale = 1): Vec[] {
  const sides = o.shape === 0 || o.shape === 4 ? 4 : o.shape === 1 ? 6 : o.shape === 3 ? 10 : 20;
  const verts: Vec[] = [];
  const irregular = o.shape === 1;
  for (let i = 0; i < sides; i++) {
    const a = o.rot + (i / sides) * TAU;
    const r = o.r * scale * (irregular ? 0.82 + 0.32 * hash2(i, o.shape, o.seed) : 1);
    verts.push({ x: o.x + Math.cos(a) * r, y: o.y + Math.sin(a) * r });
  }
  return verts;
}

/** Sweeps a polygon along an offset and fills the swept area — used for shadows. */
function sweep(ctx: CanvasRenderingContext2D, verts: Vec[], ox: number, oy: number): void {
  const n = verts.length;
  for (let i = 0; i < n; i++) {
    const a = verts[i];
    const b = verts[(i + 1) % n];
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(b.x + ox, b.y + oy);
    ctx.lineTo(a.x + ox, a.y + oy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(verts[0].x + ox, verts[0].y + oy);
  for (let i = 1; i < n; i++) ctx.lineTo(verts[i].x + ox, verts[i].y + oy);
  ctx.closePath();
  ctx.fill();
}

/** How lit a wall is, from its outward normal. */
function facetShade(a: Vec, b: Vec, cx: number, cy: number): number {
  let nx = b.y - a.y;
  let ny = -(b.x - a.x);
  const l = Math.hypot(nx, ny) || 1;
  nx /= l;
  ny /= l;
  const mx = (a.x + b.x) / 2 - cx;
  const my = (a.y + b.y) / 2 - cy;
  if (nx * mx + ny * my < 0) {
    nx = -nx;
    ny = -ny;
  }
  return clamp(nx * LIGHT_X + ny * LIGHT_Y, 0, 1);
}

function drawPrism(
  ctx: CanvasRenderingContext2D,
  verts: Vec[],
  cx: number,
  cy: number,
  z0: number,
  z1: number,
  pal: Palette,
  drawTop: boolean,
): void {
  const o0 = -z0 * RISE;
  const o1 = -z1 * RISE;
  const n = verts.length;
  for (let i = 0; i < n; i++) {
    const a = verts[i];
    const b = verts[(i + 1) % n];
    const shade = facetShade(a, b, cx, cy);
    ctx.fillStyle = mix(pal.faceDark, pal.faceLit, 0.12 + shade * 0.78);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y + o0);
    ctx.lineTo(b.x, b.y + o0);
    ctx.lineTo(b.x, b.y + o1);
    ctx.lineTo(a.x, a.y + o1);
    ctx.closePath();
    ctx.fill();
  }
  if (!drawTop) return;
  ctx.fillStyle = mix(pal.faceLit, '#ffffff', 0.16);
  ctx.beginPath();
  ctx.moveTo(verts[0].x, verts[0].y + o1);
  for (let i = 1; i < n; i++) ctx.lineTo(verts[i].x, verts[i].y + o1);
  ctx.closePath();
  ctx.fill();
}

function drawCone(
  ctx: CanvasRenderingContext2D,
  verts: Vec[],
  cx: number,
  cy: number,
  height: number,
  pal: Palette,
): void {
  const apexY = cy - height * RISE;
  const n = verts.length;
  for (let i = 0; i < n; i++) {
    const a = verts[i];
    const b = verts[(i + 1) % n];
    const shade = facetShade(a, b, cx, cy);
    ctx.fillStyle = mix(pal.faceDark, pal.faceLit, 0.1 + shade * 0.8);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(cx, apexY);
    ctx.closePath();
    ctx.fill();
  }
}

function isVisible(o: Obstacle, cam: Camera, viewW: number, viewH: number): boolean {
  return (
    Math.abs(o.x - cam.x) <= viewW / 2 + 200 && Math.abs(o.y - cam.y) <= viewH / 2 + 240
  );
}

/** All shadows go down first so no monument is painted over by its neighbour's. */
export function drawMonolithShadows(
  ctx: CanvasRenderingContext2D,
  theme: ThemeConfig,
  obstacles: Obstacle[],
  cam: Camera,
  viewW: number,
  viewH: number,
): void {
  ctx.fillStyle = theme.palette.shadow;
  for (const o of obstacles) {
    if (!isVisible(o, cam, viewW, viewH)) continue;
    const reach = o.height * 0.95;
    sweep(ctx, monolithVerts(o), SHADOW_X * reach, SHADOW_Y * reach);
  }
}

/**
 * Painter's algorithm by depth: monuments north of the player are drawn before
 * it, monuments south of it after, so the player passes behind what is in front.
 */
export function drawMonolithBodies(
  ctx: CanvasRenderingContext2D,
  theme: ThemeConfig,
  obstacles: Obstacle[],
  cam: Camera,
  viewW: number,
  viewH: number,
  minY: number,
  maxY: number,
  player?: Player,
): void {
  const pal = theme.palette;
  const pass = obstacles.filter(
    (o) => o.y >= minY && o.y < maxY && isVisible(o, cam, viewW, viewH),
  );
  pass.sort((a, b) => a.y - b.y);

  for (const o of pass) {
    // A monument standing between the camera and the player turns translucent
    // rather than swallowing them.
    ctx.globalAlpha = player && coversPlayer(o, player) ? 0.5 : 1;
    if (o.shape === 3) {
      drawCone(ctx, monolithVerts(o), o.x, o.y, o.height, pal);
    } else if (o.shape === 4) {
      drawPrism(ctx, monolithVerts(o), o.x, o.y, 0, o.height * 0.58, pal, true);
      drawPrism(ctx, monolithVerts(o, 0.62), o.x, o.y, o.height * 0.58, o.height, pal, true);
    } else {
      drawPrism(ctx, monolithVerts(o), o.x, o.y, 0, o.height, pal, true);
    }
  }
  ctx.globalAlpha = 1;
}

function coversPlayer(o: Obstacle, player: Player): boolean {
  const dx = Math.abs(o.x - player.x);
  if (dx > o.r + player.radius) return false;
  const dy = o.y - player.y;
  return dy > 0 && dy < o.height * RISE + o.r;
}

// ----------------------------------------------------------- collectibles ---

export function drawCollectibles(
  ctx: CanvasRenderingContext2D,
  theme: ThemeConfig,
  items: Collectible[],
  time: number,
): void {
  const pal = theme.palette;
  const sides = theme.id === 'space' ? 3 : theme.id === 'skate' ? 4 : theme.id === 'ice' ? 6 : 8;

  for (const c of items) {
    const pulse = 1 + 0.1 * Math.sin(time * 2.4 + c.phase);
    const bob = 10 + Math.sin(time * 1.7 + c.phase) * 5;

    ctx.save();
    ctx.translate(c.x, c.y);

    ctx.globalAlpha = 0.2;
    ctx.fillStyle = pal.shadow;
    ctx.beginPath();
    ctx.ellipse(SHADOW_X * bob * 0.5, SHADOW_Y * bob * 0.5, c.r * 0.5, c.r * 0.34, 0, 0, TAU);
    ctx.fill();

    ctx.translate(0, -bob);
    const rad = c.r * 2.6 * pulse;
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, rad);
    glow.addColorStop(0, pal.glow);
    glow.addColorStop(0.45, fade(pal.glow, 0.75));
    glow.addColorStop(1, fade(pal.glow, 0));
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, TAU);
    ctx.fill();

    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = pal.glow;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, c.r * 1.5 + Math.sin(time * 1.9 + c.phase) * 2, 0, TAU);
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.rotate(time * 0.55 + c.phase);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = mix(pal.glow, '#ffffff', 0.55);
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * TAU - Math.PI / 2;
      const x = Math.cos(a) * c.r * 0.85;
      const y = Math.sin(a) * c.r * 0.85;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

/** Wind currents that carry the player — concentric rings breathing outwards. */
export function drawBoostPads(
  ctx: CanvasRenderingContext2D,
  theme: ThemeConfig,
  pads: BoostPad[],
  time: number,
): void {
  const pal = theme.palette;
  for (const pad of pads) {
    ctx.save();
    ctx.translate(pad.x, pad.y);
    ctx.rotate(pad.rot);

    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, pad.r);
    grad.addColorStop(0, pal.glow);
    grad.addColorStop(1, fade(pal.glow, 0));
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, pad.r, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = pal.glow;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const t = ((time * 0.55 + i / 3) % 1);
      ctx.globalAlpha = 0.55 * Math.sin(t * Math.PI);
      ctx.lineWidth = 3.5 * (1 - t * 0.5);
      ctx.beginPath();
      ctx.arc(0, 0, pad.r * (0.25 + t * 0.75), -0.9, 0.9);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

// ---------------------------------------------------------------- player ---

const RIBBON_WIDTH = 11;

/**
 * The scarf: one filled shape that swells at the player and tapers to nothing
 * at the tail. Drawn as a single polygon so it reads as cloth, not as beads.
 */
function drawRibbon(
  ctx: CanvasRenderingContext2D,
  pal: Palette,
  player: Player,
  lift: number,
): void {
  const trail = player.trail;
  const n = trail.length;
  if (n < 4) return;

  // Lifted so the scarf streams from the rider's shoulders, not their feet.
  const pts = trail.map((p) => ({ x: p.x, y: p.y - p.z * PLAYER_RISE - lift }));
  const left: Vec[] = [];
  const right: Vec[] = [];
  for (let i = 0; i < n; i++) {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(n - 1, i + 1)];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l;
    const ny = dx / l;
    const t = i / (n - 1);
    const hw = (RIBBON_WIDTH * t * t) / 2 + 0.3;
    left.push({ x: pts[i].x + nx * hw, y: pts[i].y + ny * hw });
    right.push({ x: pts[i].x - nx * hw, y: pts[i].y - ny * hw });
  }

  const head = pts[n - 1];
  const tail = pts[0];
  const grad = ctx.createLinearGradient(tail.x, tail.y, head.x, head.y);
  grad.addColorStop(0, fade(pal.ribbon, 0));
  grad.addColorStop(1, pal.ribbon);

  ctx.save();
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(left[0].x, left[0].y);
  for (let i = 1; i < n; i++) ctx.lineTo(left[i].x, left[i].y);
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  theme: ThemeConfig,
  player: Player,
  time: number,
): void {
  const pal = theme.palette;
  drawRibbon(ctx, pal, player, isFigureTheme(theme.id) ? 19 : 5);

  const figure = isFigureTheme(theme.id);
  const rise = player.z * PLAYER_RISE;
  // A standing figure's shadow sits at its feet; a vehicle's spreads under it.
  const reach = (figure ? 3 : 10) + player.z * 0.9;

  ctx.save();
  ctx.translate(player.x, player.y);

  ctx.globalAlpha = clamp(0.26 - player.z * 0.0006, 0.08, 0.26);
  ctx.fillStyle = pal.shadow;
  ctx.beginPath();
  ctx.ellipse(
    SHADOW_X * reach,
    SHADOW_Y * reach,
    (figure ? 12 : player.radius) * (1 + player.z * 0.0012),
    figure ? 5.5 : player.radius * 0.68,
    0,
    0,
    TAU,
  );
  ctx.fill();
  ctx.globalAlpha = 1;

  if (player.shieldTime > 0 || player.boosting) {
    const r = player.radius * 2.6;
    const aura = ctx.createRadialGradient(0, -rise, r * 0.2, 0, -rise, r);
    aura.addColorStop(0, fade(pal.glow, 0.85));
    aura.addColorStop(1, fade(pal.glow, 0));
    ctx.globalAlpha = 0.3 + 0.12 * Math.sin(time * 9);
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, -rise, r, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.translate(0, -rise);
  ctx.scale(1 + player.z * 0.0014, 1 + player.z * 0.0014);
  if (player.invulnTime > 0 && Math.floor(time * 12) % 2 === 0) ctx.globalAlpha = 0.45;

  if (figure) {
    // People stand up in the same three-quarter projection as the monuments:
    // upright on screen, mirrored by facing, leaning into the carve.
    const cos = Math.cos(player.heading);
    const sin = Math.sin(player.heading);
    const lateral = -player.vx * sin + player.vy * cos;
    ctx.rotate(clamp(lateral / 300, -1, 1) * 0.3);

    let flip = cos >= 0 ? 1 : -1;
    // A trick spins the figure about its own vertical axis.
    if (player.spinTime > 0) flip *= Math.cos(player.spinTime * player.spinSpeed);
    ctx.scale(Math.sign(flip) * Math.max(Math.abs(flip), 0.14), 1);

    if (theme.id === 'ice') drawSkaterFigure(ctx, pal);
    else drawSkateboarderFigure(ctx, pal);
  } else {
    // Vehicles read fine from directly above, so they keep turning with heading.
    ctx.rotate(player.heading + player.spinTime * player.spinSpeed);
    if (theme.id === 'space') drawShip(ctx, pal, player.boosting, time);
    else drawCar(ctx, pal);
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

function isFigureTheme(id: ThemeId): boolean {
  return id === 'ice' || id === 'skate';
}

/**
 * A tapering limb with a rounded end — the building block for the figures'
 * arms and legs. Local space, +x is the direction of travel.
 */
function limb(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  w0: number,
  w1: number,
  color: string,
): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l;
  const ny = dx / l;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x0 + nx * w0, y0 + ny * w0);
  ctx.lineTo(x1 + nx * w1, y1 + ny * w1);
  ctx.lineTo(x1 - nx * w1, y1 - ny * w1);
  ctx.lineTo(x0 - nx * w0, y0 - ny * w0);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x1, y1, w1, 0, TAU);
  ctx.fill();
}

/** The head reads as a pale dome against the darker clothing — never a skin tone. */
function hoodColor(pal: Palette): string {
  return mix(pal.body, '#ffffff', 0.72);
}

/**
 * Shoulder to elbow to hand. The bend stops two arms reading as one bar, and
 * arms stay thinner than the torso so the figure keeps a waist.
 */
function arm(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  ex: number,
  ey: number,
  hx: number,
  hy: number,
  color: string,
  w = 2.7,
): void {
  limb(ctx, sx, sy, ex, ey, w, w * 0.82, color);
  limb(ctx, ex, ey, hx, hy, w * 0.82, w * 0.62, color);
}

/**
 * From straight above you see the crown of the head, never a face. Hair sits
 * behind it as a dark disc — that three-tone break (hair / head / shoulders) is
 * what keeps the head from melting into the body at gameplay size.
 */
function head(ctx: CanvasRenderingContext2D, pal: Palette, x: number, y: number, r: number): void {
  ctx.fillStyle = pal.ink;
  ctx.beginPath();
  ctx.arc(x - r * 0.55, y, r * 1.02, 0, TAU);
  ctx.fill();
  ctx.fillStyle = hoodColor(pal);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

/** A rounded mass with its lit side turned towards the scene's light. */
function litBlob(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  rot: number,
  base: string,
  lift: number,
): void {
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, TAU);
  ctx.fill();
  ctx.fillStyle = mix(base, '#ffffff', lift);
  ctx.beginPath();
  ctx.ellipse(
    x + LIGHT_X * rx * 0.22,
    y + LIGHT_Y * ry * 0.22,
    rx * 0.82,
    ry * 0.82,
    rot,
    0,
    TAU,
  );
  ctx.fill();
}

/**
 * A robed skater seen from above, mid-spiral: one arm sweeping forward, the
 * other trailing, skirt fanned out and blades carving behind.
 */
/**
 * A figure skater standing on the ice: feet at y = 0, head at the top, facing
 * +x. Free leg swept back into an arabesque, arms open, skirt flared.
 */
function drawSkaterFigure(ctx: CanvasRenderingContext2D, pal: Palette): void {
  ctx.lineCap = 'round';

  // Free leg reaching back, and both blades.
  limb(ctx, -1, -15, -14, -6, 3, 2.2, pal.body);
  ctx.fillStyle = pal.ink;
  ctx.beginPath();
  ctx.roundRect(-19, -6, 9, 2.6, 1.3);
  ctx.roundRect(-2, -2.6, 11, 2.6, 1.3);
  ctx.fill();

  // Supporting leg.
  limb(ctx, 1, -15, 3, -3, 3.2, 2.4, pal.body);

  // Skirt, a bell flaring from the waist.
  ctx.fillStyle = pal.bodyAccent;
  ctx.beginPath();
  ctx.moveTo(-4, -20);
  ctx.lineTo(4, -20);
  ctx.quadraticCurveTo(10, -16, 9, -10);
  ctx.quadraticCurveTo(0, -6.5, -9, -10);
  ctx.quadraticCurveTo(-10, -16, -4, -20);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = mix(pal.bodyAccent, '#ffffff', 0.24);
  ctx.beginPath();
  ctx.ellipse(LIGHT_X * 2.2, -15 + LIGHT_Y * 1.6, 6, 4.4, 0, 0, TAU);
  ctx.fill();

  // Trailing arm, behind the body.
  arm(ctx, -1, -24, -8, -21, -14, -22, pal.body, 2.4);

  // Torso.
  litBlob(ctx, 0, -22, 5, 6.5, 0, pal.body, 0.18);

  // Leading arm, reaching up and forward.
  arm(ctx, 2, -24, 8, -26, 13, -29, pal.body, 2.4);

  head(ctx, pal, 1.5, -29.5, 4);
}

/**
 * A skateboarder standing side-on over the deck: board flat on the ground,
 * knees bent, arms out for balance.
 */
function drawSkateboarderFigure(ctx: CanvasRenderingContext2D, pal: Palette): void {
  // Deck seen almost edge-on, with the trucks under it.
  ctx.fillStyle = pal.bodyAccent;
  ctx.beginPath();
  ctx.ellipse(-9, -1, 2.6, 2, 0, 0, TAU);
  ctx.ellipse(9, -1, 2.6, 2, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = pal.ink;
  ctx.beginPath();
  ctx.roundRect(-14, -6, 28, 4.5, 2.2);
  ctx.fill();

  // Legs, planted wide over the trucks.
  limb(ctx, -2, -16, -8, -6, 3.2, 2.4, pal.body);
  limb(ctx, 2, -16, 8, -6, 3.2, 2.4, pal.body);

  // Trailing arm.
  arm(ctx, -2, -24, -9, -22, -14, -25, pal.body, 2.4);

  // Torso, a loose hoodie.
  litBlob(ctx, 0, -21, 5.6, 6.5, 0, pal.body, 0.18);

  // Leading arm, thrown forward for balance.
  arm(ctx, 2, -24, 9, -25, 14, -22, pal.body, 2.4);

  head(ctx, pal, 1.5, -29, 3.9);
  // Cap brim, pointing the way they are riding.
  ctx.fillStyle = pal.ink;
  ctx.beginPath();
  ctx.roundRect(3.6, -30.2, 5.4, 2.2, 1.1);
  ctx.fill();
}

function drawShip(ctx: CanvasRenderingContext2D, pal: Palette, boosting: boolean, time: number): void {
  const flame = boosting ? 24 + Math.sin(time * 32) * 5 : 11 + Math.sin(time * 22) * 2.5;
  ctx.fillStyle = pal.bodyAccent;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(-11, -4.5);
  ctx.lineTo(-11 - flame, 0);
  ctx.lineTo(-11, 4.5);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = pal.ink;
  ctx.beginPath();
  ctx.moveTo(-14, -14);
  ctx.lineTo(2, -5);
  ctx.lineTo(2, 5);
  ctx.lineTo(-14, 14);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = pal.body;
  ctx.beginPath();
  ctx.moveTo(19, 0);
  ctx.lineTo(-10, -8.5);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-10, 8.5);
  ctx.closePath();
  ctx.fill();

  // Canopy, with the pilot's helmet showing through it.
  ctx.fillStyle = pal.ink;
  ctx.beginPath();
  ctx.ellipse(4, 0, 5.4, 4, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = pal.bodyAccent;
  ctx.beginPath();
  ctx.arc(3.4, 0, 2.6, 0, TAU);
  ctx.fill();
}

function drawCar(ctx: CanvasRenderingContext2D, pal: Palette): void {
  ctx.fillStyle = pal.ink;
  ctx.beginPath();
  ctx.roundRect(-13, -13.5, 9, 6, 2);
  ctx.roundRect(-13, 7.5, 9, 6, 2);
  ctx.roundRect(7, -13.5, 9, 6, 2);
  ctx.roundRect(7, 7.5, 9, 6, 2);
  ctx.fill();

  ctx.fillStyle = pal.body;
  ctx.beginPath();
  ctx.roundRect(-17, -10, 36, 20, 6);
  ctx.fill();

  // Cabin, with the driver's helmet and visor inside it.
  ctx.fillStyle = pal.ink;
  ctx.beginPath();
  ctx.roundRect(-6, -7.5, 13, 15, 3);
  ctx.fill();
  ctx.fillStyle = pal.bodyAccent;
  ctx.beginPath();
  ctx.arc(-0.5, 0, 4.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = pal.ink;
  ctx.beginPath();
  ctx.roundRect(1.4, -3, 2.4, 6, 1.2);
  ctx.fill();

  ctx.fillStyle = pal.bodyAccent;
  ctx.beginPath();
  ctx.roundRect(14, -6, 5, 12, 2);
  ctx.fill();
}

// ------------------------------------------------------------ atmosphere ---

const MOTE_COUNT = 38;

/** Drifting light motes, warm glare and vignette — drawn in screen space. */
export function drawAtmosphere(
  ctx: CanvasRenderingContext2D,
  theme: ThemeConfig,
  cam: Camera,
  w: number,
  h: number,
  time: number,
): void {
  const pal = theme.palette;
  const spanX = w + 120;
  const spanY = h + 120;

  ctx.fillStyle = pal.glow;
  for (let i = 0; i < MOTE_COUNT; i++) {
    const seedX = hash2(i, 1, 13);
    const seedY = hash2(i, 2, 17);
    const speed = 8 + seedX * 22;
    const drift = (seedY - 0.5) * 14;
    let x = seedX * spanX + time * drift - cam.x * 0.05;
    let y = seedY * spanY - time * speed - cam.y * 0.05;
    x = ((x % spanX) + spanX) % spanX - 60;
    y = ((y % spanY) + spanY) % spanY - 60;
    ctx.globalAlpha = 0.05 + 0.18 * (0.5 + 0.5 * Math.sin(time * 1.1 + i));
    ctx.beginPath();
    ctx.arc(x, y, 0.7 + seedX * 1.4, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const glareX = w * (0.5 + LIGHT_X * 0.55);
  const glareY = h * (0.5 + LIGHT_Y * 0.55);
  const glare = ctx.createRadialGradient(glareX, glareY, 0, glareX, glareY, Math.max(w, h) * 0.95);
  glare.addColorStop(0, pal.haze);
  glare.addColorStop(1, fade(pal.haze, 0));
  ctx.fillStyle = glare;
  ctx.fillRect(0, 0, w, h);

  const vignette = ctx.createRadialGradient(
    w / 2,
    h / 2,
    Math.min(w, h) * 0.32,
    w / 2,
    h / 2,
    Math.max(w, h) * 0.78,
  );
  vignette.addColorStop(0, 'rgba(18, 12, 24, 0)');
  vignette.addColorStop(1, 'rgba(18, 12, 24, 0.28)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

// -------------------------------------------------------------------- UI ---

export function drawJoystick(
  ctx: CanvasRenderingContext2D,
  view: JoystickView,
  theme: ThemeConfig,
): void {
  if (!view.active) return;
  const pal = theme.palette;
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = pal.faceLit;
  ctx.beginPath();
  ctx.arc(view.originX, view.originY, view.radius, 0, TAU);
  ctx.fill();

  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = pal.uiSoft;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(view.originX, view.originY, view.radius, 0, TAU);
  ctx.stroke();

  const knobR = view.radius * 0.36;
  const knob = ctx.createRadialGradient(
    view.knobX,
    view.knobY,
    0,
    view.knobX,
    view.knobY,
    knobR * 1.8,
  );
  knob.addColorStop(0, pal.glow);
  knob.addColorStop(1, fade(pal.glow, 0));
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = knob;
  ctx.beginPath();
  ctx.arc(view.knobX, view.knobY, knobR * 1.8, 0, TAU);
  ctx.fill();

  ctx.globalAlpha = 0.92;
  ctx.fillStyle = pal.uiSoft;
  ctx.beginPath();
  ctx.arc(view.knobX, view.knobY, knobR, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawMinimap(
  ctx: CanvasRenderingContext2D,
  theme: ThemeConfig,
  world: World,
  player: Player,
  x: number,
  y: number,
  size: number,
): void {
  const pal = theme.palette;
  const k = size / world.size;
  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = pal.ink;
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, 12);
  ctx.fill();
  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = pal.uiSoft;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.globalAlpha = 0.95;
  ctx.fillStyle = mix(pal.glow, '#ffffff', 0.5);
  for (const c of world.collectibles) {
    ctx.beginPath();
    ctx.arc(x + c.x * k, y + c.y * k, 2, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = pal.bodyAccent;
  ctx.beginPath();
  ctx.arc(x + player.x * k, y + player.y * k, 3, 0, TAU);
  ctx.fill();
  ctx.restore();
}
