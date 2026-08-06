export type ThemeId = 'ice' | 'skate' | 'space' | 'rally';

/** What an ability actually does. Themes only change the name, the numbers and the look. */
export type AbilityKind = 'hop' | 'boost' | 'dash' | 'brake' | 'shield';

/** How the joystick is interpreted. */
export type ControlMode = 'thrust' | 'steer';

export type GestureName = 'doubleTap' | 'swipe' | 'hold';

export interface AbilityConfig {
  kind: AbilityKind;
  /** Shown in the HUD, e.g. "Zıpla". */
  label: string;
  /** How the player triggers it, e.g. "Çift dokun". */
  hint: string;
  /** Seconds before it can be used again. */
  cooldown: number;
  /** Seconds the effect lasts (unused for `brake`, which lasts while held). */
  duration: number;
  /** Effect strength — jump velocity, speed multiplier or dash impulse. */
  power: number;
  /** Bonus points awarded for pulling it off. */
  style: number;
}

export interface PhysicsConfig {
  maxSpeed: number;
  accel: number;
  /** Linear damping rate (1/s). Low = keeps gliding. */
  friction: number;
  /** Sideways damping rate (1/s). Low = slides and drifts. */
  grip: number;
  /** thrust: how fast the body turns to face travel. steer: turn rate in rad/s. */
  turnRate: number;
  /** Extra damping while braking. */
  brakeFriction: number;
  /** Grip while braking — below `grip` means the brake makes you slide. */
  brakeGrip: number;
  /** Downward acceleration used by hops (px/s²). */
  gravity: number;
}

export interface Palette {
  floor: string;
  floorAlt: string;
  grid: string;
  decal: string;
  fog: string;
  accent: string;
  accent2: string;
  body: string;
  bodyAlt: string;
  trail: string;
  collectible: string;
  obstacle: string;
  obstacleAlt: string;
  boostPad: string;
}

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  tagline: string;
  emoji: string;
  control: ControlMode;
  physics: PhysicsConfig;
  palette: Palette;
  /** Names used in the HUD and result screen. */
  collectibleName: string;
  obstacleName: string;
  abilities: Record<GestureName, AbilityConfig>;
}

export interface HudState {
  score: number;
  best: number;
  combo: number;
  timeLeft: number;
  collected: number;
  running: boolean;
  paused: boolean;
  finished: boolean;
  lastAction: string | null;
  cooldowns: Record<GestureName, number>;
}

export interface RunResult {
  themeId: ThemeId;
  score: number;
  collected: number;
  bestCombo: number;
  crashes: number;
  isNewBest: boolean;
}
