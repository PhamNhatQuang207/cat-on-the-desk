/** Pure combo/multiplier math, plus the localStorage high score. */

import { SCORING } from '../config.ts';

/** Combo multiplier for a given streak length: 1 knock = x1, 2 = x1.5, ... */
export function comboMultiplier(combo: number): number {
  if (combo <= 1) return 1;
  return 1 + Math.min(combo - 1, SCORING.maxCombo - 1) * 0.5;
}

/** Final points for one destroyed item. Always at least 1 point. */
export function scoreForItem(basePoints: number, combo: number): number {
  return Math.max(1, Math.round(basePoints * comboMultiplier(combo)));
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
