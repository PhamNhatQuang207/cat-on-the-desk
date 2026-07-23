/** Pure combo/multiplier math, plus the localStorage high score. */

import { SCORING, STARE } from '../config.ts';

/** Combo multiplier for a given streak length: 1 knock = x1, 2 = x1.5, ... */
export function comboMultiplier(combo: number): number {
  if (combo <= 1) return 1;
  return 1 + Math.min(combo - 1, SCORING.maxCombo - 1) * 0.5;
}

/** Eye-contact multiplier from how long the stare has been held. */
export function stareMultiplier(stareTime: number, staring: boolean): number {
  if (!staring) return 1;
  const t = Math.min(1, stareTime / STARE.rampTime);
  return STARE.minMultiplier + (STARE.maxMultiplier - STARE.minMultiplier) * t;
}

/** Final points for one destroyed item. Always at least 1 point. */
export function scoreForItem(basePoints: number, combo: number, stareMult: number): number {
  return Math.max(1, Math.round(basePoints * comboMultiplier(combo) * stareMult));
}

/** Advances the combo timer; returns the streak after decay. */
export function decayCombo(combo: number, comboTimer: number, dt: number): { combo: number; comboTimer: number } {
  const next = comboTimer - dt;
  if (next <= 0) return { combo: 0, comboTimer: 0 };
  return { combo, comboTimer: next };
}

export function extendCombo(combo: number): { combo: number; comboTimer: number } {
  return { combo: combo + 1, comboTimer: SCORING.comboWindow };
}

export function loadHighScore(): number {
  try {
    const raw = localStorage.getItem(SCORING.highScoreKey);
    const value = raw === null ? 0 : Number.parseInt(raw, 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    // Private browsing / disabled storage — a session-only high score is fine.
    return 0;
  }
}

export function saveHighScore(score: number): void {
  try {
    localStorage.setItem(SCORING.highScoreKey, String(Math.floor(score)));
  } catch {
    /* ignore */
  }
}
