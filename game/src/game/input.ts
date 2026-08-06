import { clamp, len } from './math';

export type GestureName = 'tap' | 'doubleTap' | 'swipe' | 'holdStart' | 'holdEnd';

export interface GestureEvent {
  name: GestureName;
  /** Screen position where the gesture happened (CSS pixels). */
  x: number;
  y: number;
  /** Normalised direction — only meaningful for `swipe`. */
  dx: number;
  dy: number;
}

export interface JoystickView {
  active: boolean;
  originX: number;
  originY: number;
  knobX: number;
  knobY: number;
  radius: number;
}

interface PointerTrack {
  id: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  startTime: number;
  /** Moved far enough that it can no longer count as a tap. */
  moved: boolean;
  isJoystick: boolean;
  swipeFired: boolean;
  holding: boolean;
}

const JOYSTICK_RADIUS = 62;
const JOYSTICK_DEADZONE = 7;
/** Fraction of the screen width reserved for the movement stick. */
const JOYSTICK_ZONE = 0.5;
const TAP_MOVE_LIMIT = 18;
const TAP_TIME_LIMIT = 260;
const DOUBLE_TAP_WINDOW = 330;
const DOUBLE_TAP_DISTANCE = 90;
const SWIPE_DISTANCE = 55;
const SWIPE_TIME_LIMIT = 520;
const HOLD_TIME = 300;

/**
 * Translates touch, mouse and keyboard input into a movement axis plus a stream
 * of gesture events.
 *
 * Layout: a floating virtual stick lives wherever the player first touches the
 * left half of the screen. Every other touch feeds the gesture recogniser, so
 * the right half is the "command" side — double tap, swipe, press and hold.
 * Quick taps on the stick side still count as taps, which keeps one-handed
 * play workable.
 */
export class InputManager {
  private el: HTMLElement | null = null;
  private pointers = new Map<number, PointerTrack>();
  private joystickId: number | null = null;
  private queue: GestureEvent[] = [];
  private lastTapTime = 0;
  private lastTapX = 0;
  private lastTapY = 0;
  private holdCount = 0;
  private keys = new Set<string>();
  private keyHold = false;
  private enabled = true;

  private ax = 0;
  private ay = 0;

  attach(el: HTMLElement): void {
    this.detach();
    this.el = el;
    el.addEventListener('pointerdown', this.onPointerDown);
    el.addEventListener('pointermove', this.onPointerMove);
    el.addEventListener('pointerup', this.onPointerUp);
    el.addEventListener('pointercancel', this.onPointerUp);
    el.addEventListener('contextmenu', this.onContextMenu);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.reset);
  }

  detach(): void {
    const el = this.el;
    if (el) {
      el.removeEventListener('pointerdown', this.onPointerDown);
      el.removeEventListener('pointermove', this.onPointerMove);
      el.removeEventListener('pointerup', this.onPointerUp);
      el.removeEventListener('pointercancel', this.onPointerUp);
      el.removeEventListener('contextmenu', this.onContextMenu);
    }
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.reset);
    this.el = null;
    this.reset();
  }

  /** While disabled (menus, pause) input is dropped instead of queued up. */
  setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    this.reset();
  }

  reset = (): void => {
    this.pointers.clear();
    this.joystickId = null;
    this.queue.length = 0;
    this.holdCount = 0;
    this.keys.clear();
    this.keyHold = false;
    this.ax = 0;
    this.ay = 0;
  };

  private onContextMenu = (e: Event): void => {
    e.preventDefault();
  };

  private localPoint(e: PointerEvent): { x: number; y: number } {
    const rect = this.el?.getBoundingClientRect();
    return { x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) };
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (!this.enabled || !this.el) return;
    e.preventDefault();
    try {
      this.el.setPointerCapture?.(e.pointerId);
    } catch {
      /* not all browsers allow capture for every pointer type */
    }
    const { x, y } = this.localPoint(e);
    const width = this.el.clientWidth || window.innerWidth;
    const isJoystick = this.joystickId === null && x < width * JOYSTICK_ZONE;
    if (isJoystick) this.joystickId = e.pointerId;
    this.pointers.set(e.pointerId, {
      id: e.pointerId,
      startX: x,
      startY: y,
      x,
      y,
      startTime: performance.now(),
      moved: false,
      isJoystick,
      swipeFired: false,
      holding: false,
    });
  };

  private onPointerMove = (e: PointerEvent): void => {
    const p = this.pointers.get(e.pointerId);
    if (!p) return;
    e.preventDefault();
    const { x, y } = this.localPoint(e);
    p.x = x;
    p.y = y;
    const dx = x - p.startX;
    const dy = y - p.startY;
    const d = len(dx, dy);
    if (d > TAP_MOVE_LIMIT) p.moved = true;

    if (p.isJoystick) return;

    if (
      !p.swipeFired &&
      !p.holding &&
      d > SWIPE_DISTANCE &&
      performance.now() - p.startTime < SWIPE_TIME_LIMIT
    ) {
      p.swipeFired = true;
      this.queue.push({ name: 'swipe', x, y, dx: dx / d, dy: dy / d });
    }
  };

  private onPointerUp = (e: PointerEvent): void => {
    const p = this.pointers.get(e.pointerId);
    if (!p) return;
    e.preventDefault();
    this.pointers.delete(e.pointerId);
    if (this.joystickId === e.pointerId) this.joystickId = null;
    if (p.holding) {
      p.holding = false;
      this.holdCount = Math.max(0, this.holdCount - 1);
      this.queue.push({ name: 'holdEnd', x: p.x, y: p.y, dx: 0, dy: 0 });
      return;
    }
    if (p.swipeFired) return;

    const now = performance.now();
    const isTap = !p.moved && now - p.startTime < TAP_TIME_LIMIT;
    if (!isTap) return;

    const near =
      len(p.x - this.lastTapX, p.y - this.lastTapY) < DOUBLE_TAP_DISTANCE &&
      now - this.lastTapTime < DOUBLE_TAP_WINDOW;
    if (near) {
      this.lastTapTime = 0;
      this.queue.push({ name: 'doubleTap', x: p.x, y: p.y, dx: 0, dy: 0 });
    } else {
      this.lastTapTime = now;
      this.lastTapX = p.x;
      this.lastTapY = p.y;
      this.queue.push({ name: 'tap', x: p.x, y: p.y, dx: 0, dy: 0 });
    }
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (!this.enabled) return;
    if (e.repeat) {
      if (e.code === 'Space') e.preventDefault();
      return;
    }
    this.keys.add(e.code);
    if (e.code === 'Space') {
      e.preventDefault();
      this.queue.push({ name: 'doubleTap', x: 0, y: 0, dx: 0, dy: 0 });
    } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      const m = len(this.ax, this.ay);
      const dx = m > 0.1 ? this.ax / m : 0;
      const dy = m > 0.1 ? this.ay / m : 0;
      this.queue.push({ name: 'swipe', x: 0, y: 0, dx, dy });
    } else if (e.code === 'KeyE') {
      this.keyHold = true;
      this.holdCount += 1;
      this.queue.push({ name: 'holdStart', x: 0, y: 0, dx: 0, dy: 0 });
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
    if (e.code === 'KeyE' && this.keyHold) {
      this.keyHold = false;
      this.holdCount = Math.max(0, this.holdCount - 1);
      this.queue.push({ name: 'holdEnd', x: 0, y: 0, dx: 0, dy: 0 });
    }
  };

  /** Promotes still-pressed pointers into holds. Call once per frame. */
  update(): void {
    const now = performance.now();
    for (const p of this.pointers.values()) {
      if (p.isJoystick || p.holding || p.swipeFired || p.moved) continue;
      if (now - p.startTime >= HOLD_TIME) {
        p.holding = true;
        this.holdCount += 1;
        this.queue.push({ name: 'holdStart', x: p.x, y: p.y, dx: 0, dy: 0 });
      }
    }
    this.updateAxis();
  }

  private updateAxis(): void {
    const stick = this.joystickId !== null ? this.pointers.get(this.joystickId) : undefined;
    if (stick) {
      const dx = stick.x - stick.startX;
      const dy = stick.y - stick.startY;
      const d = len(dx, dy);
      if (d <= JOYSTICK_DEADZONE) {
        this.ax = 0;
        this.ay = 0;
      } else {
        const clamped = Math.min(d, JOYSTICK_RADIUS);
        const t = (clamped - JOYSTICK_DEADZONE) / (JOYSTICK_RADIUS - JOYSTICK_DEADZONE);
        this.ax = (dx / d) * t;
        this.ay = (dy / d) * t;
      }
      return;
    }

    let kx = 0;
    let ky = 0;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) kx -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) kx += 1;
    if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) ky -= 1;
    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) ky += 1;
    const m = len(kx, ky);
    if (m > 0) {
      this.ax = kx / m;
      this.ay = ky / m;
    } else {
      this.ax = 0;
      this.ay = 0;
    }
  }

  get axisX(): number {
    return this.ax;
  }

  get axisY(): number {
    return this.ay;
  }

  get axisMagnitude(): number {
    return clamp(len(this.ax, this.ay), 0, 1);
  }

  isHolding(): boolean {
    return this.holdCount > 0;
  }

  consumeGestures(): GestureEvent[] {
    if (this.queue.length === 0) return [];
    const out = this.queue.slice();
    this.queue.length = 0;
    return out;
  }

  joystickView(): JoystickView {
    const stick = this.joystickId !== null ? this.pointers.get(this.joystickId) : undefined;
    if (!stick) {
      return { active: false, originX: 0, originY: 0, knobX: 0, knobY: 0, radius: JOYSTICK_RADIUS };
    }
    const dx = stick.x - stick.startX;
    const dy = stick.y - stick.startY;
    const d = len(dx, dy);
    const k = d > JOYSTICK_RADIUS ? JOYSTICK_RADIUS / d : 1;
    return {
      active: true,
      originX: stick.startX,
      originY: stick.startY,
      knobX: stick.startX + dx * k,
      knobY: stick.startY + dy * k,
      radius: JOYSTICK_RADIUS,
    };
  }
}
