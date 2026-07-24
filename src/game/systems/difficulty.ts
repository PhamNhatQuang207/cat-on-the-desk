/**
 * The endless ramp. One pure function maps "how far into the run are we" onto
 * every knob that gets harder, so difficulty is tunable in one place.
 */

import { DIFFICULTY, THREAT, type ItemKind } from '../config.ts';

export interface Difficulty {
  /** 0 (start of run) .. 1 (fully ramped). */
  t: number;
  /** Seconds between owner threats at the current aggro-independent baseline. */
  threatInterval: number;
  /** Multiplier applied to every telegraph duration — shrinks as it ramps. */
  telegraphScale: number;
  /** Max simultaneous active threats. */
  maxThreats: number;
  /** Spawn weights per item kind — heavy items become more common. */
  itemWeights: Record<ItemKind, number>;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Progress is driven by time *and* score, so a player who racks up points fast
 * gets pushed as hard as one who survives a long time.
 */
export function rampProgress(elapsed: number, score: number): number {
  const byTime = elapsed / DIFFICULTY.rampTime;
  const byScore = score / DIFFICULTY.rampScore;
  return Math.max(0, Math.min(1, byTime + byScore));
}

export function difficultyAt(elapsed: number, score: number): Difficulty {
  const t = rampProgress(elapsed, score);
  return {
    t,
    threatInterval: lerp(THREAT.intervalAtCalm, THREAT.intervalAtFurious, t),
    telegraphScale: lerp(1, THREAT.telegraphSqueeze, t),
    // Peaks at two simultaneous threats — three at once made max difficulty
    // read as overwhelming rather than hard.
    maxThreats: t < 0.45 ? 1 : 2,
    itemWeights: {
      // Light, cheap items thin out; heavy, valuable ones take over.
      glass: lerp(10, 4, t),
      mug: lerp(10, 6, t),
      phone: lerp(6, 5, t),
      vase: lerp(4, 7, t),
      plant: lerp(3, 7, t),
      laptop: lerp(1.5, 6, t),
      monitor: lerp(0.5, 4, t),
    },
  };
}
