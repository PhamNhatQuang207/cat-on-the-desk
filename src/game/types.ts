import type { CatBreed, ItemKind } from './config.ts';

export type Phase = 'title' | 'playing' | 'paused' | 'gameover';

/** Where an item is in its life: on the desk, tipping, falling, gone. */
export type ItemPhase = 'resting' | 'tipping' | 'falling' | 'destroyed';

export interface Item {
  id: number;
  kind: ItemKind;
  /** Center x, in virtual view units. */
  x: number;
  /** y of the item's *bottom* while on the desk; free-falling once airborne. */
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  mass: number;
  points: number;
  fragile: boolean;
  phase: ItemPhase;
  /** Radians; nonzero once tipping or falling. */
  rotation: number;
  spin: number;
  /** Set while the owner's hand is dragging it back to safety. */
  rescuedBy: number | null;
  /** Wobble animation after being swiped, purely cosmetic. */
  wobble: number;
}

export interface Cat {
  breed: CatBreed;
  x: number;
  facing: -1 | 1;
  /** Counts down while a swipe animation plays. */
  swipeTimer: number;
  swipeCooldown: number;
  /** True once this swipe's contact frame has been resolved. */
  swipeConnected: boolean;
  staring: boolean;
  stareTime: number;
  stunTimer: number;
  /** Walk-cycle phase, cosmetic. */
  bob: number;
}

export type ThreatKind = 'spray' | 'hand';
export type ThreatPhase = 'telegraph' | 'active' | 'recover';

export interface Threat {
  id: number;
  kind: ThreatKind;
  phase: ThreatPhase;
  /** Time remaining in the current phase. */
  timer: number;
  /** Duration of the current phase, for progress bars/telegraph rendering. */
  phaseDuration: number;
  /** Target x on the desk. */
  x: number;
  /** Spray only: still following the cat before lock-on. */
  tracking: boolean;
  /** Hand only: id of the item it is rescuing, if any. */
  targetItemId: number | null;
  /** Set once this threat has already resolved its hit, so it hits only once. */
  resolved: boolean;
}

export interface Floater {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  scale: number;
}

export interface Shard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
  size: number;
  color: string;
  life: number;
}

export interface Owner {
  /** 0..1 — how furious. Drives threat frequency and telegraph length. */
  aggro: number;
  /** Seconds until the next threat is scheduled. */
  nextThreatIn: number;
  /** Cosmetic: eased toward aggro so the face doesn't snap between moods. */
  displayAnger: number;
  /** True while the cat is holding eye contact — owner stares back. */
  lockedEyes: boolean;
}

export interface GameState {
  phase: Phase;
  elapsed: number;
  score: number;
  highScore: number;
  strikes: number;
  /** Persisted across runs — the breed chosen on the title screen. */
  selectedBreed: CatBreed;

  cat: Cat;
  owner: Owner;
  items: Item[];
  threats: Threat[];
  floaters: Floater[];
  shards: Shard[];

  combo: number;
  comboTimer: number;

  spawnTimer: number;
  shake: number;
  /** Counts item destructions, shown on the game-over card. */
  destroyed: number;
  nextId: number;
  /** Rises briefly after a smash so the HUD can flash. */
  flash: number;
}
