import { clamp, TAU } from './math';
import { hash2 } from './rng';
import type { Player } from './player';
import type { ThemeConfig } from './types';
import type { BoostPad, Collectible, Obstacle, World } from './world';
import type { JoystickView } from './input';

const TILE = 260;

export interface Camera {
  x: number;
  y: number;
  shakeX: number;
  shakeY: number;
}

/**
 * How much the world is magnified. Keeps roughly the same slice of the arena
 * visible on a phone and on a desktop window.
 */
export function cameraZoom(w: number, h: number): number {
  return clamp(Math.min(w, h) / 420, 1, 2.2);
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  theme: ThemeConfig,
  cam: Camera,
  w: number,
  h: number,
  zoom: number,
  time: number,
): void {
  const pal = theme.palette;
  ctx.fillStyle = pal.floor;
  ctx.fillRect(0, 0, w, h);

  if (theme.id === 'space') {
    drawStarfield(ctx, theme, cam, w, h, zoom, time);
    return;
  }

  const viewW = w / zoom;
  const viewH = h / zoom;
  const left = cam.x - viewW / 2;
  const top = cam.y - viewH / 2;
  const x0 = Math.floor(left / TILE);
  const y0 = Math.floor(top / TILE);
  const x1 = Math.ceil((left + viewW) / TILE);
  const y1 = Math.ceil((top + viewH) / TILE);

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-cam.x, -cam.y);

  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (((tx + ty) & 1) === 0) {
        ctx.fillStyle = pal.floorAlt;
        ctx.fillRect(tx * TILE, ty * TILE, TILE, TILE);
      }
      drawTileDecal(ctx, theme, tx, ty);
    }
  }

  ctx.strokeStyle = pal.grid;
  ctx.lineWidth = 1 / zoom;
  ctx.beginPath();
  for (let tx = x0; tx <= x1; tx++) {
    ctx.moveTo(tx * TILE, y0 * TILE);
    ctx.lineTo(tx * TILE, (y1 + 1) * TILE);
  }
  for (let ty = y0; ty <= y1; ty++) {
    ctx.moveTo(x0 * TILE, ty * TILE);
    ctx.lineTo((x1 + 1) * TILE, ty * TILE);
  }
  ctx.stroke();
  ctx.restore();
}

function drawTileDecal(ctx: CanvasRenderingContext2D, theme: ThemeConfig, tx: number, ty: number): void {
  const pal = theme.palette;
  const n = hash2(tx, ty, theme.id.length);
  if (n > 0.62) return;
  const px = tx * TILE + hash2(tx, ty, 11) * TILE;
  const py = ty * TILE + hash2(tx, ty, 23) * TILE;
  const rot = hash2(tx, ty, 31) * TAU;

  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(rot);
  ctx.strokeStyle = pal.decal;
  ctx.fillStyle = pal.decal;

  if (theme.id === 'ice') {
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(-40, 0);
    ctx.quadraticCurveTo(0, -14 + n * 26, 46, 4);
    ctx.stroke();
  } else if (theme.id === 'skate') {
    ctx.globalAlpha = 0.35;
    ctx.fillRect(-52, -3, 104, 6);
  } else {
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-60, -8);
    ctx.quadraticCurveTo(0, 10 - n * 30, 62, -6);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawStarfield(
  ctx: CanvasRenderingContext2D,
  theme: ThemeConfig,
  cam: Camera,
  w: number,
  h: number,
  zoom: number,
  time: number,
): void {
  const pal = theme.palette;
  const grad = ctx.createRadialGradient(w * 0.3, h * 0.25, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.8);
  grad.addColorStop(0, 'rgba(70, 40, 150, 0.35)');
  grad.addColorStop(1, 'rgba(6, 8, 20, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const layers = [
    { p: 0.25, size: 1.1, alpha: 0.5, step: 190 },
    { p: 0.5, size: 1.7, alpha: 0.75, step: 240 },
    { p: 0.85, size: 2.4, alpha: 1, step: 320 },
  ];
  ctx.fillStyle = pal.decal;
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
        const rx = hash2(tx, ty, 7 + i);
        const ry = hash2(tx, ty, 19 + i);
        const tw = hash2(tx, ty, 41 + i);
        const sx = ox + (tx + rx) * step;
        const sy = oy + (ty + ry) * step;
        if (sx < -8 || sy < -8 || sx > w + 8 || sy > h + 8) continue;
        ctx.globalAlpha = layer.alpha * (0.55 + 0.45 * Math.sin(time * 1.6 + tw * TAU));
        ctx.beginPath();
        ctx.arc(sx, sy, layer.size, 0, TAU);
        ctx.fill();
      }
    }
  }
  ctx.globalAlpha = 1;
}

export function drawWorldBounds(ctx: CanvasRenderingContext2D, theme: ThemeConfig, world: World): void {
  const pal = theme.palette;
  ctx.save();
  ctx.lineWidth = 10;
  ctx.strokeStyle = pal.accent;
  ctx.globalAlpha = 0.55;
  ctx.setLineDash([34, 22]);
  ctx.strokeRect(0, 0, world.size, world.size);
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  ctx.restore();
}

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
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = pal.boostPad;
    ctx.beginPath();
    ctx.arc(0, 0, pad.r, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = pal.boostPad;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const shift = ((time * 90 + i * 22) % 66) - 33;
      ctx.globalAlpha = 0.35 + 0.5 * Math.cos((shift / 33) * (Math.PI / 2));
      ctx.beginPath();
      ctx.moveTo(-16, shift - 10);
      ctx.lineTo(0, shift + 4);
      ctx.lineTo(16, shift - 10);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

export function drawObstacles(
  ctx: CanvasRenderingContext2D,
  theme: ThemeConfig,
  obstacles: Obstacle[],
  cam: Camera,
  w: number,
  h: number,
): void {
  const pal = theme.palette;
  for (const o of obstacles) {
    if (Math.abs(o.x - cam.x) > w / 2 + 120 || Math.abs(o.y - cam.y) > h / 2 + 120) continue;
    const lift = o.height * 0.32;
    ctx.save();
    ctx.translate(o.x, o.y);

    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(4, 6, o.r * 1.05, o.r * 0.75, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.rotate(o.rot);
    ctx.fillStyle = pal.obstacleAlt;
    obstaclePath(ctx, o, 0);
    ctx.fill();
    ctx.fillStyle = pal.obstacle;
    obstaclePath(ctx, o, -lift);
    ctx.fill();
    ctx.restore();
  }
}

function obstaclePath(ctx: CanvasRenderingContext2D, o: Obstacle, dy: number): void {
  ctx.beginPath();
  if (o.shape === 0) {
    const r = o.r;
    ctx.roundRect(-r, -r + dy, r * 2, r * 2, r * 0.3);
  } else if (o.shape === 1) {
    const sides = 6;
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * TAU;
      const rr = o.r * (0.78 + 0.35 * hash2(i, o.shape, Math.round(o.x)));
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr + dy;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else {
    ctx.arc(0, dy, o.r, 0, TAU);
  }
}

export function drawCollectibles(
  ctx: CanvasRenderingContext2D,
  theme: ThemeConfig,
  items: Collectible[],
  time: number,
): void {
  const pal = theme.palette;
  for (const c of items) {
    const pulse = 1 + 0.12 * Math.sin(time * 3.2 + c.phase);
    const bob = Math.sin(time * 2.4 + c.phase) * 4;
    ctx.save();
    ctx.translate(c.x, c.y + bob);

    const glow = ctx.createRadialGradient(0, 0, c.r * 0.6, 0, 0, c.r * 1.9 * pulse);
    glow.addColorStop(0, pal.collectible);
    glow.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, c.r * 1.9 * pulse, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.rotate(time * 1.3 + c.phase);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = pal.collectible;
    ctx.strokeStyle = pal.collectible;
    drawCollectibleIcon(ctx, theme, c.r);
    ctx.restore();
  }
}

function drawCollectibleIcon(ctx: CanvasRenderingContext2D, theme: ThemeConfig, r: number): void {
  switch (theme.id) {
    case 'ice': {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU - Math.PI / 2;
        const rr = i % 2 === 0 ? r : r * 0.45;
        const x = Math.cos(a) * rr;
        const y = Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'skate': {
      ctx.beginPath();
      ctx.roundRect(-r, -r * 0.62, r * 2, r * 1.24, 4);
      ctx.fill();
      ctx.fillStyle = '#1b1e26';
      ctx.beginPath();
      ctx.arc(-r * 0.38, 0, r * 0.24, 0, TAU);
      ctx.arc(r * 0.38, 0, r * 0.24, 0, TAU);
      ctx.fill();
      break;
    }
    case 'space': {
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.62, 0);
      ctx.lineTo(0, r);
      ctx.lineTo(-r * 0.62, 0);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'rally': {
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-r * 0.5, r);
      ctx.lineTo(-r * 0.5, -r);
      ctx.stroke();
      const s = r * 0.5;
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          ctx.fillStyle = (i + j) % 2 === 0 ? '#111' : '#fff';
          ctx.fillRect(-r * 0.5 + i * s, -r + j * s, s, s);
        }
      }
      break;
    }
  }
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  theme: ThemeConfig,
  player: Player,
  time: number,
): void {
  const pal = theme.palette;
  const lift = player.z * 0.35;
  const scale = 1 + player.z * 0.0016;

  ctx.save();
  ctx.translate(player.x, player.y);

  ctx.globalAlpha = clamp(0.22 - player.z * 0.0007, 0.05, 0.22);
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(3, 5, player.radius * 1.05, player.radius * 0.72, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;

  if (player.shieldTime > 0) {
    ctx.globalAlpha = 0.35 + 0.25 * Math.sin(time * 12);
    ctx.strokeStyle = pal.accent2;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -lift, player.radius * 2.1, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.translate(0, -lift);
  ctx.scale(scale, scale);
  ctx.rotate(player.heading + player.spinTime * player.spinSpeed);

  if (player.invulnTime > 0 && Math.floor(time * 14) % 2 === 0) ctx.globalAlpha = 0.4;

  switch (theme.id) {
    case 'ice':
      drawSkater(ctx, pal.body, pal.bodyAlt, pal.accent);
      break;
    case 'skate':
      drawSkateboarder(ctx, pal.body, pal.bodyAlt, pal.accent);
      break;
    case 'space':
      drawShip(ctx, pal.body, pal.bodyAlt, pal.accent2, player.boosting, time);
      break;
    case 'rally':
      drawCar(ctx, pal.body, pal.bodyAlt, pal.accent);
      break;
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawSkater(ctx: CanvasRenderingContext2D, body: string, alt: string, accent: string): void {
  ctx.fillStyle = alt;
  ctx.beginPath();
  ctx.ellipse(0, 0, 18, 11, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(2, 0, 11, 8, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-4, -9);
  ctx.lineTo(-16, -14);
  ctx.moveTo(-4, 9);
  ctx.lineTo(-16, 14);
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(9, 0, 4, 0, TAU);
  ctx.fill();
}

function drawSkateboarder(ctx: CanvasRenderingContext2D, body: string, alt: string, accent: string): void {
  ctx.fillStyle = alt;
  ctx.beginPath();
  ctx.roundRect(-19, -8, 38, 16, 8);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.roundRect(-12, -6, 8, 12, 3);
  ctx.roundRect(4, -6, 8, 12, 3);
  ctx.fill();
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(1, 0, 8, 0, TAU);
  ctx.fill();
  ctx.fillStyle = alt;
  ctx.beginPath();
  ctx.arc(5, 0, 3, 0, TAU);
  ctx.fill();
}

function drawShip(
  ctx: CanvasRenderingContext2D,
  body: string,
  alt: string,
  accent: string,
  boosting: boolean,
  time: number,
): void {
  const flame = boosting ? 26 + Math.sin(time * 40) * 6 : 13 + Math.sin(time * 30) * 3;
  ctx.fillStyle = boosting ? '#ffd166' : accent;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(-12, -5);
  ctx.lineTo(-12 - flame, 0);
  ctx.lineTo(-12, 5);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = alt;
  ctx.beginPath();
  ctx.moveTo(-14, -14);
  ctx.lineTo(2, -6);
  ctx.lineTo(2, 6);
  ctx.lineTo(-14, 14);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(19, 0);
  ctx.lineTo(-10, -9);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-10, 9);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.ellipse(4, 0, 4.5, 3.2, 0, 0, TAU);
  ctx.fill();
}

function drawCar(ctx: CanvasRenderingContext2D, body: string, alt: string, accent: string): void {
  ctx.fillStyle = '#15110d';
  ctx.beginPath();
  ctx.roundRect(-13, -13, 9, 6, 2);
  ctx.roundRect(-13, 7, 9, 6, 2);
  ctx.roundRect(7, -13, 9, 6, 2);
  ctx.roundRect(7, 7, 9, 6, 2);
  ctx.fill();

  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.roundRect(-17, -10, 36, 20, 5);
  ctx.fill();

  ctx.fillStyle = alt;
  ctx.beginPath();
  ctx.roundRect(-4, -7, 11, 14, 3);
  ctx.fill();

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.roundRect(15, -7, 4, 14, 2);
  ctx.fill();
}

export function drawJoystick(ctx: CanvasRenderingContext2D, view: JoystickView, theme: ThemeConfig): void {
  if (!view.active) return;
  const pal = theme.palette;
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(view.originX, view.originY, view.radius, 0, TAU);
  ctx.fill();

  ctx.globalAlpha = 0.65;
  ctx.strokeStyle = pal.accent2;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(view.originX, view.originY, view.radius, 0, TAU);
  ctx.stroke();

  ctx.globalAlpha = 0.9;
  ctx.fillStyle = pal.accent;
  ctx.beginPath();
  ctx.arc(view.knobX, view.knobY, view.radius * 0.42, 0, TAU);
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
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, 10);
  ctx.fill();
  ctx.globalAlpha = 0.85;
  ctx.strokeStyle = pal.accent2;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = pal.collectible;
  for (const c of world.collectibles) {
    ctx.beginPath();
    ctx.arc(x + c.x * k, y + c.y * k, 2.2, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = pal.accent;
  ctx.beginPath();
  ctx.arc(x + player.x * k, y + player.y * k, 3.4, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}
