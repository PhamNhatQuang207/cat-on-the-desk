/**
 * Every tuning constant in the game. Nothing else should contain a magic
 * number — if a value feels wrong while playing, it is changed here.
 *
 * The whole game is simulated in a fixed 960x540 virtual space; the renderer
 * scales that to the real canvas, so these numbers never depend on window size.
 */

export const VIEW = {
  width: 960,
  height: 540,
} as const;

export const DESK = {
  /** The left doom edge. Items past this point tip and fall. */
  edgeX: 150,
  /** The right doom edge — items past this fall too. The owner stands beyond
      it, off the desk, reaching in across the drop. */
  rightEdgeX: 810,
  /** y of the desk surface — everything on the desk rests on this line. */
  surfaceY: 372,
  thickness: 26,
} as const;

export const CAT = {
  width: 84,
  height: 58,
  speed: 250,
  /** Where the cat can stand — up to each doom edge, but not off it. */
  minX: DESK.edgeX + 26,
  maxX: DESK.rightEdgeX - 26,
  startX: 470,

  swipeDuration: 0.26,
  /** Fraction into the swipe at which the paw actually connects. */
  swipeContactAt: 0.35,
  swipeCooldown: 0.12,
  /** Paw hitbox, offset ahead of the cat in its facing direction. */
  pawReach: 62,
  pawRadius: 30,

  stunDuration: 1.1,
} as const;

export const PHYSICS = {
  /** Sliding friction on the desk surface, in px/s per second. */
  friction: 460,
  /** Velocity below which a sliding item is considered at rest. */
  restSpeed: 6,
  gravity: 1500,
  /** Base impulse of one swipe, divided by the item's mass. */
  swipeImpulse: 520,
  /** The floor line. Items smash here, so it must stay inside the viewport —
      the impact is the payoff and the player has to see it. */
  floorY: DESK.surfaceY + 150,
} as const;

export type ItemKind = 'mug' | 'glass' | 'plant' | 'phone' | 'vase' | 'laptop' | 'monitor';

export interface ItemSpec {
  kind: ItemKind;
  label: string;
  /** Higher mass = smaller push per swipe. */
  mass: number;
  points: number;
  width: number;
  height: number;
  /** Fragile things shatter loudly; heavy things thud. */
  fragile: boolean;
}

export const ITEM_SPECS: Record<ItemKind, ItemSpec> = {
  glass: { kind: 'glass', label: 'Water Glass', mass: 0.7, points: 60, width: 26, height: 40, fragile: true },
  mug: { kind: 'mug', label: 'Coffee Mug', mass: 1.0, points: 100, width: 34, height: 34, fragile: true },
  phone: { kind: 'phone', label: 'Phone', mass: 1.1, points: 160, width: 20, height: 38, fragile: true },
  vase: { kind: 'vase', label: 'Heirloom Vase', mass: 1.5, points: 260, width: 34, height: 60, fragile: true },
  plant: { kind: 'plant', label: 'Houseplant', mass: 1.8, points: 200, width: 44, height: 62, fragile: false },
  laptop: { kind: 'laptop', label: 'Laptop', mass: 2.6, points: 400, width: 70, height: 44, fragile: false },
  monitor: { kind: 'monitor', label: 'Monitor', mass: 3.4, points: 650, width: 82, height: 68, fragile: false },
};

export const SPAWN = {
  /** The spawner tops the desk up toward this many items. */
  targetItems: 5,
  maxItems: 7,
  interval: 1.6,
  /** New items appear in the middle band, clear of both doom edges, so the
      cat has to nudge them toward whichever edge it fancies. */
  minX: DESK.edgeX + 150,
  maxX: DESK.rightEdgeX - 150,
  /** Minimum gap between item centers when placing. */
  minGap: 62,
} as const;

export const SCORING = {
  /** Consecutive knock-offs inside this window keep the combo alive. */
  comboWindow: 4.0,
  maxCombo: 8,
  highScoreKey: 'cat-on-the-desk.highscore',
} as const;

export const STARE = {
  /** Seconds of held eye contact to reach the maximum multiplier. */
  rampTime: 2.0,
  minMultiplier: 1.0,
  maxMultiplier: 3.0,
  /** Extra aggro per second while staring — the cost of the bonus. */
  aggroPerSecond: 0.22,
} as const;

export const OWNER = {
  /** Aggro is 0..1 and drives threat frequency and telegraph length. */
  aggroDecayPerSecond: 0.045,
  aggroPerSecondIdle: 0.018,
  aggroPerSmash: 0.12,
  /** Aggro spent when the owner launches a threat. */
  aggroPerThreat: 0.1,
  maxStrikes: 3,
} as const;

export const THREAT = {
  spray: {
    /** Reticle tracks the cat for this long, then locks. */
    trackTime: 0.55,
    /** Locked-on delay before firing — the dodge window. Kept generous so the
        spray always reads as telegraphed rather than a snap shot. */
    lockTime: 0.7,
    activeTime: 0.35,
    recoverTime: 0.45,
    /** Half-width of the spray cone at the desk surface. */
    radius: 52,
  },
  hand: {
    telegraphTime: 0.85,
    /** How long the hand takes to sweep in and back out. */
    activeTime: 0.7,
    recoverTime: 0.6,
    radius: 48,
    /** Chance the hand rescues an endangered item instead of grabbing the cat. */
    rescueChance: 0.45,
    /** Speed at which a rescued item is dragged back toward desk center. */
    rescueSpeed: 300,
  },
  /** Seconds between threats at aggro 0 and aggro 1. */
  intervalAtCalm: 4.2,
  intervalAtFurious: 1.85,
  /** Telegraph durations are scaled by this factor at maximum aggro. Kept from
      squeezing too far so late-game threats stay readable and dodgeable. */
  telegraphSqueeze: 0.72,
} as const;

export const DIFFICULTY = {
  /** Seconds to reach full ramp. */
  rampTime: 150,
  /** Score contributing to the ramp as much as `rampTime` seconds does. */
  rampScore: 12000,
} as const;

export const FX = {
  shakeDecay: 6.5,
  maxShake: 18,
  floaterLife: 1.1,
  floaterRise: 60,
} as const;

export const COLORS = {
  wallTop: '#2a2136',
  wallBottom: '#181322',
  deskTop: '#8a5a3b',
  deskFace: '#6b4530',
  deskEdgeGlow: '#ffca6b',
  floor: '#120e19',
  /* A ginger cat: the only thing on screen that reads instantly against the
     dark room, which matters because it is what the player is tracking. */
  cat: '#e5924a',
  catDark: '#bd6b2e',
  catStripe: '#c9762f',
  catEye: '#8ef2a6',
  owner: '#d9a273',
  ownerShirt: '#3d6b8f',
  danger: '#ff5a6e',
  warn: '#ffb454',
  good: '#8ef2a6',
  text: '#f4eefb',
  dim: '#9d92b0',
} as const;
