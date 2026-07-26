import { describe, expect, it } from 'vitest';
import { SCORING } from '../config.ts';
import { comboMultiplier, decayCombo, extendCombo, scoreForItem } from './scoring.ts';

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

describe('scoreForItem', () => {
  it('multiplies base points by the combo multiplier', () => {
    expect(scoreForItem(100, 1)).toBe(100);
    expect(scoreForItem(100, 3)).toBe(Math.round(100 * comboMultiplier(3)));
  });

  it('never awards zero points', () => {
    expect(scoreForItem(0, 1)).toBe(1);
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
