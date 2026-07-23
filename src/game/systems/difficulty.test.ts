import { describe, expect, it } from 'vitest';
import { ITEM_SPECS, THREAT, type ItemKind } from '../config.ts';
import { difficultyAt, rampProgress } from './difficulty.ts';

const KINDS = Object.keys(ITEM_SPECS) as ItemKind[];

describe('rampProgress', () => {
  it('starts at zero and clamps to one', () => {
    expect(rampProgress(0, 0)).toBe(0);
    expect(rampProgress(1e6, 1e6)).toBe(1);
  });

  it('is monotonic in both elapsed time and score', () => {
    expect(rampProgress(60, 0)).toBeGreaterThan(rampProgress(30, 0));
    expect(rampProgress(30, 5000)).toBeGreaterThan(rampProgress(30, 0));
  });
});

describe('difficultyAt', () => {
  it('shortens the gap between threats as the run goes on', () => {
    const early = difficultyAt(0, 0);
    const late = difficultyAt(300, 20000);
    expect(early.threatInterval).toBeCloseTo(THREAT.intervalAtCalm);
    expect(late.threatInterval).toBeCloseTo(THREAT.intervalAtFurious);
    expect(late.threatInterval).toBeLessThan(early.threatInterval);
  });

  it('shortens telegraphs but never removes them', () => {
    const late = difficultyAt(300, 20000);
    expect(late.telegraphScale).toBeLessThan(1);
    expect(late.telegraphScale).toBeGreaterThan(0);
  });

  it('allows more simultaneous threats later', () => {
    expect(difficultyAt(0, 0).maxThreats).toBeLessThan(difficultyAt(300, 0).maxThreats);
  });

  it('keeps every item kind spawnable with a positive weight', () => {
    for (const t of [0, 75, 150, 400]) {
      const weights = difficultyAt(t, 0).itemWeights;
      for (const kind of KINDS) {
        expect(weights[kind]).toBeGreaterThan(0);
      }
    }
  });

  it('shifts the mix toward heavy, valuable items', () => {
    const early = difficultyAt(0, 0).itemWeights;
    const late = difficultyAt(300, 20000).itemWeights;
    expect(late.monitor).toBeGreaterThan(early.monitor);
    expect(late.laptop).toBeGreaterThan(early.laptop);
    expect(late.glass).toBeLessThan(early.glass);
  });
});
