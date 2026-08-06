import { dist2, TAU } from './math';
import { makeRng } from './rng';

export interface Collectible {
  x: number;
  y: number;
  r: number;
  /** Animation offset so they do not all pulse in sync. */
  phase: number;
}

export interface Obstacle {
  x: number;
  y: number;
  r: number;
  /** Hops clear obstacles lower than the player's altitude. */
  height: number;
  rot: number;
  shape: number;
}

export interface BoostPad {
  x: number;
  y: number;
  r: number;
  rot: number;
}

export const WORLD_SIZE = 2600;
export const WORLD_MARGIN = 120;

const OBSTACLE_COUNT = 30;
const COLLECTIBLE_COUNT = 14;
const BOOST_PAD_COUNT = 6;
/** Nothing spawns inside this radius around the starting point. */
const SPAWN_SAFE_RADIUS = 260;

export class World {
  readonly size = WORLD_SIZE;
  readonly center = WORLD_SIZE / 2;
  obstacles: Obstacle[] = [];
  collectibles: Collectible[] = [];
  boostPads: BoostPad[] = [];
  private rng: () => number;

  constructor(seed: number) {
    this.rng = makeRng(seed);
    this.generate();
  }

  private generate(): void {
    const rng = this.rng;
    for (let i = 0; i < OBSTACLE_COUNT; i++) {
      const p = this.findSpot(70);
      this.obstacles.push({
        x: p.x,
        y: p.y,
        r: 26 + rng() * 30,
        height: 26 + rng() * 34,
        rot: rng() * TAU,
        shape: Math.floor(rng() * 3),
      });
    }
    for (let i = 0; i < BOOST_PAD_COUNT; i++) {
      const p = this.findSpot(90);
      this.boostPads.push({ x: p.x, y: p.y, r: 46, rot: rng() * TAU });
    }
    for (let i = 0; i < COLLECTIBLE_COUNT; i++) {
      this.collectibles.push(this.makeCollectible());
    }
  }

  private findSpot(clearance: number): { x: number; y: number } {
    const rng = this.rng;
    const min = WORLD_MARGIN;
    const max = this.size - WORLD_MARGIN;
    for (let attempt = 0; attempt < 40; attempt++) {
      const x = min + rng() * (max - min);
      const y = min + rng() * (max - min);
      if (dist2(x, y, this.center, this.center) < SPAWN_SAFE_RADIUS * SPAWN_SAFE_RADIUS) continue;
      if (this.isClear(x, y, clearance)) return { x, y };
    }
    return { x: min + rng() * (max - min), y: min + rng() * (max - min) };
  }

  private isClear(x: number, y: number, clearance: number): boolean {
    for (const o of this.obstacles) {
      const min = o.r + clearance;
      if (dist2(x, y, o.x, o.y) < min * min) return false;
    }
    for (const b of this.boostPads) {
      const min = b.r + clearance;
      if (dist2(x, y, b.x, b.y) < min * min) return false;
    }
    return true;
  }

  makeCollectible(awayFromX?: number, awayFromY?: number): Collectible {
    const rng = this.rng;
    const min = WORLD_MARGIN;
    const max = this.size - WORLD_MARGIN;
    let best = { x: this.center, y: this.center };
    let bestScore = -1;
    for (let attempt = 0; attempt < 24; attempt++) {
      const x = min + rng() * (max - min);
      const y = min + rng() * (max - min);
      if (!this.isClear(x, y, 60)) continue;
      if (awayFromX === undefined || awayFromY === undefined) {
        best = { x, y };
        break;
      }
      // Prefer somewhere reachable but not right on top of the player.
      const d = Math.sqrt(dist2(x, y, awayFromX, awayFromY));
      const score = d < 320 ? d * 0.2 : 2000 - d;
      if (score > bestScore) {
        bestScore = score;
        best = { x, y };
      }
    }
    return { x: best.x, y: best.y, r: 20, phase: rng() * TAU };
  }
}
