import { angleDamp, clamp, len } from './math';
import type { AbilityConfig, ThemeConfig } from './types';

export class Player {
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  heading = -Math.PI / 2;
  /** Altitude above the floor. Anything above 0 means airborne. */
  z = 0;
  vz = 0;
  boostTime = 0;
  boostPower = 1;
  shieldTime = 0;
  invulnTime = 0;
  /** Spins the sprite for a moment after a trick. */
  spinTime = 0;
  spinSpeed = 0;
  braking = false;
  radius = 17;

  constructor(private theme: ThemeConfig) {}

  setTheme(theme: ThemeConfig): void {
    this.theme = theme;
  }

  reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.heading = -Math.PI / 2;
    this.z = 0;
    this.vz = 0;
    this.boostTime = 0;
    this.boostPower = 1;
    this.shieldTime = 0;
    this.invulnTime = 0;
    this.spinTime = 0;
    this.spinSpeed = 0;
    this.braking = false;
  }

  get speed(): number {
    return len(this.vx, this.vy);
  }

  get airborne(): boolean {
    return this.z > 0.5;
  }

  get invulnerable(): boolean {
    return this.invulnTime > 0 || this.shieldTime > 0;
  }

  get boosting(): boolean {
    return this.boostTime > 0;
  }

  update(dt: number, ax: number, ay: number, braking: boolean): void {
    const p = this.theme.physics;
    this.braking = braking && !this.airborne;

    const boostMul = this.boostTime > 0 ? this.boostPower : 1;
    const airControl = this.airborne ? 0.45 : 1;
    const mag = clamp(len(ax, ay), 0, 1);

    if (this.theme.control === 'steer') {
      this.updateSteer(dt, ax, ay, boostMul, airControl);
    } else {
      this.updateThrust(dt, ax, ay, mag, boostMul, airControl);
    }

    // Split velocity into "along the body" and "sideways", then damp each.
    const cos = Math.cos(this.heading);
    const sin = Math.sin(this.heading);
    let fwd = this.vx * cos + this.vy * sin;
    let lat = -this.vx * sin + this.vy * cos;

    const friction = p.friction + (this.braking ? p.brakeFriction : 0);
    const grip = this.braking ? p.brakeGrip : p.grip;
    fwd *= Math.exp(-friction * dt);
    lat *= Math.exp(-(this.airborne ? grip * 0.25 : grip) * dt);

    this.vx = fwd * cos - lat * sin;
    this.vy = fwd * sin + lat * cos;

    const max = p.maxSpeed * boostMul;
    const sp = this.speed;
    if (sp > max) {
      const k = max / sp;
      this.vx *= k;
      this.vy *= k;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.z > 0 || this.vz > 0) {
      this.vz -= p.gravity * dt;
      this.z += this.vz * dt;
      if (this.z <= 0) {
        this.z = 0;
        this.vz = 0;
      }
    }

    if (this.spinTime > 0) this.spinTime = Math.max(0, this.spinTime - dt);
    if (this.boostTime > 0) this.boostTime = Math.max(0, this.boostTime - dt);
    if (this.shieldTime > 0) this.shieldTime = Math.max(0, this.shieldTime - dt);
    if (this.invulnTime > 0) this.invulnTime = Math.max(0, this.invulnTime - dt);
  }

  private updateThrust(
    dt: number,
    ax: number,
    ay: number,
    mag: number,
    boostMul: number,
    airControl: number,
  ): void {
    const p = this.theme.physics;
    if (mag > 0.05) {
      const a = p.accel * mag * airControl * (boostMul > 1 ? 1.25 : 1);
      this.vx += (ax / mag) * a * dt;
      this.vy += (ay / mag) * a * dt;
      this.heading = angleDamp(this.heading, Math.atan2(ay, ax), p.turnRate * airControl, dt);
    } else if (this.speed > 30) {
      this.heading = angleDamp(this.heading, Math.atan2(this.vy, this.vx), p.turnRate * 0.5, dt);
    }
  }

  private updateSteer(
    dt: number,
    ax: number,
    ay: number,
    boostMul: number,
    airControl: number,
  ): void {
    const p = this.theme.physics;
    const throttle = clamp(-ay, -1, 1);
    const steer = clamp(ax, -1, 1);

    const cos = Math.cos(this.heading);
    const sin = Math.sin(this.heading);
    const forwardSpeed = this.vx * cos + this.vy * sin;
    // No steering authority when standing still; full authority once rolling.
    const authority = clamp(Math.abs(forwardSpeed) / 130, 0, 1);
    const dir = forwardSpeed < -10 ? -1 : 1;
    this.heading += steer * p.turnRate * authority * dir * airControl * dt;

    if (Math.abs(throttle) > 0.05) {
      const reversing = throttle < 0 && forwardSpeed < 20;
      const a = p.accel * (reversing ? 0.5 : 1) * airControl * (boostMul > 1 ? 1.3 : 1);
      this.vx += cos * a * throttle * dt;
      this.vy += sin * a * throttle * dt;
    }
  }

  /** Applies an ability's effect. Cooldown bookkeeping lives in the engine. */
  useAbility(ability: AbilityConfig, dirX: number, dirY: number): void {
    switch (ability.kind) {
      case 'hop': {
        if (this.airborne) return;
        this.vz = ability.power;
        this.z = 0.01;
        this.spinTime = 0.55;
        this.spinSpeed = (Math.random() < 0.5 ? -1 : 1) * 11;
        break;
      }
      case 'boost': {
        this.boostTime = ability.duration;
        this.boostPower = ability.power;
        break;
      }
      case 'dash': {
        let dx = dirX;
        let dy = dirY;
        if (len(dx, dy) < 0.1) {
          dx = Math.cos(this.heading);
          dy = Math.sin(this.heading);
        }
        this.vx += dx * ability.power;
        this.vy += dy * ability.power;
        this.spinTime = 0.35;
        this.spinSpeed = (dirX >= 0 ? 1 : -1) * 14;
        this.invulnTime = Math.max(this.invulnTime, 0.25);
        break;
      }
      case 'shield': {
        this.shieldTime = ability.duration;
        break;
      }
      case 'brake':
        break;
    }
  }

  crash(nx: number, ny: number): void {
    this.vx = nx * 190 + this.vx * -0.25;
    this.vy = ny * 190 + this.vy * -0.25;
    this.invulnTime = 1.1;
    this.spinTime = 0.5;
    this.spinSpeed = 9;
    this.z = 0;
    this.vz = 0;
  }
}
