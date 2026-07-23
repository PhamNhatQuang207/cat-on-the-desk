import { describe, expect, it } from 'vitest';
import { SCORING, STARE } from '../config.ts';
import { comboMultiplier, decayCombo, extendCombo, scoreForItem, stareMultiplier } from './scoring.ts';

describe('comboMultiplier', () => {
  it('is x1 for the first knock-off', () => {
    expect(comboMultiplier(0)).toBe(1);
    expect(comboMultiplier(1)).toBe(1);
  });

  it('grows with the streak', () => {
    expect(comboMultiplier(2)).toBeGreaterThan(comboMultiplier(1));
    expect(comboMultiplier(3)).toBeGreaterThan(comboMultiplier(2));
  });

  it('caps out so runs cannot snowball forever', () => {
    const capped = comboMultiplier(SCORING.maxCombo);
    expect(comboMultiplier(SCORING.maxCombo + 50)).toBe(capped);
  });
});

describe('stareMultiplier', () => {
  it('is x1 when not staring', () => {
    expect(stareMultiplier(5, false)).toBe(1);
  });

  it('ramps from the minimum to the maximum over the ramp time', () => {
    expect(stareMultiplier(0, true)).toBeCloseTo(STARE.minMultiplier);
    expect(stareMultiplier(STARE.rampTime, true)).toBeCloseTo(STARE.maxMultiplier);
    expect(stareMultiplier(STARE.rampTime * 10, true)).toBeCloseTo(STARE.maxMultiplier);
  });

  it('is monotonic while the stare is held', () => {
    let previous = 0;
    for (let t = 0; t <= STARE.rampTime; t += 0.1) {
      const value = stareMultiplier(t, true);
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });
});

describe('scoreForItem', () => {
  it('multiplies base points by both multipliers', () => {
    expect(scoreForItem(100, 1, 1)).toBe(100);
    expect(scoreForItem(100, 1, 3)).toBe(300);
    expect(scoreForItem(100, 3, 1)).toBe(Math.round(100 * comboMultiplier(3)));
  });

  it('never awards zero points', () => {
    expect(scoreForItem(0, 1, 1)).toBe(1);
  });
});

describe('combo timer', () => {
  it('resets the streak once the window lapses', () => {
    const extended = extendCombo(2);
    expect(extended.combo).toBe(3);
    expect(extended.comboTimer).toBe(SCORING.comboWindow);

    const stillAlive = decayCombo(extended.combo, extended.comboTimer, SCORING.comboWindow - 0.1);
    expect(stillAlive.combo).toBe(3);

    const lapsed = decayCombo(extended.combo, extended.comboTimer, SCORING.comboWindow + 0.1);
    expect(lapsed.combo).toBe(0);
    expect(lapsed.comboTimer).toBe(0);
  });
});
