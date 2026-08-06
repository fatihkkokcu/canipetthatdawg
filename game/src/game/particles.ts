import { TAU } from './math';

type ParticleKind = 'dot' | 'spark' | 'ring';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  kind: ParticleKind;
  drag: number;
}

const MAX_PARTICLES = 420;

/** Fixed-capacity particle pool — oldest entries are recycled under pressure. */
export class Particles {
  private items: Particle[] = [];
  private cursor = 0;

  clear(): void {
    this.items.length = 0;
    this.cursor = 0;
  }

  spawn(
    x: number,
    y: number,
    vx: number,
    vy: number,
    life: number,
    size: number,
    color: string,
    kind: ParticleKind = 'dot',
    drag = 2.5,
  ): void {
    const p: Particle = { x, y, vx, vy, life, maxLife: life, size, color, kind, drag };
    if (this.items.length < MAX_PARTICLES) {
      this.items.push(p);
    } else {
      this.items[this.cursor] = p;
      this.cursor = (this.cursor + 1) % MAX_PARTICLES;
    }
  }

  burst(x: number, y: number, count: number, speed: number, color: string, kind: ParticleKind = 'dot'): void {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU;
      const s = speed * (0.35 + Math.random() * 0.65);
      this.spawn(
        x,
        y,
        Math.cos(a) * s,
        Math.sin(a) * s,
        0.35 + Math.random() * 0.45,
        2 + Math.random() * 3,
        color,
        kind,
      );
    }
  }

  update(dt: number): void {
    const items = this.items;
    for (let i = items.length - 1; i >= 0; i--) {
      const p = items[i];
      p.life -= dt;
      if (p.life <= 0) {
        items[i] = items[items.length - 1];
        items.pop();
        if (this.cursor >= items.length) this.cursor = 0;
        continue;
      }
      const k = Math.exp(-p.drag * dt);
      p.vx *= k;
      p.vy *= k;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.items) {
      const t = p.life / p.maxLife;
      ctx.globalAlpha = Math.max(0, Math.min(1, t));
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;
      if (p.kind === 'ring') {
        ctx.lineWidth = 2 + p.size * 0.4 * t;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (2.4 - t * 1.4), 0, TAU);
        ctx.stroke();
      } else if (p.kind === 'spark') {
        const l = p.size * 2.2;
        const m = Math.hypot(p.vx, p.vy) || 1;
        ctx.lineWidth = Math.max(1, p.size * 0.6);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - (p.vx / m) * l, p.y - (p.vy / m) * l);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.4 + t * 0.6), 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
}
