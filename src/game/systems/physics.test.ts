import { describe, expect, it } from 'vitest';
import { DESK, PHYSICS } from '../config.ts';
import { createItem } from '../entities/item.ts';
import { applySwipe, hasTippedOver, isTeetering, riskLevel, stepItem } from './physics.ts';

const STEP = 1 / 60;

function simulate(item: ReturnType<typeof createItem>, seconds: number): Array<'tipped' | 'smashed'> {
  const events: Array<'tipped' | 'smashed'> = [];
  for (let t = 0; t < seconds; t += STEP) {
    const event = stepItem(item, STEP);
    if (event) events.push(event);
  }
  return events;
}

describe('stepItem', () => {
  it('brings a sliding item to rest on the desk via friction', () => {
    const item = createItem(1, 'mug', 600);
    item.vx = -200;
    simulate(item, 3);

    expect(item.phase).toBe('resting');
    expect(item.vx).toBe(0);
    expect(item.x).toBeLessThan(600);
    expect(item.x).toBeGreaterThan(DESK.edgeX);
  });

  it('tips then smashes an item pushed past the edge', () => {
    const item = createItem(1, 'mug', DESK.edgeX + 20);
    item.vx = -400;
    const events = simulate(item, 4);

    expect(events).toEqual(['tipped', 'smashed']);
    expect(item.phase).toBe('destroyed');
  });

  it('tips then smashes an item pushed off the right edge', () => {
    const item = createItem(1, 'mug', DESK.rightEdgeX - 20);
    item.vx = 400;
    const events = simulate(item, 4);

    expect(events).toEqual(['tipped', 'smashed']);
    expect(item.phase).toBe('destroyed');
  });

  it('accelerates downward once airborne', () => {
    const item = createItem(1, 'glass', DESK.edgeX - 1);
    // The frame that tips the item only hands it to gravity; it does not fall yet.
    stepItem(item, STEP);
    expect(item.phase).toBe('tipping');
    expect(item.vy).toBe(0);

    const yBefore = item.y;
    stepItem(item, STEP);
    expect(item.y).toBeGreaterThan(yBefore);
    expect(item.vy).toBeCloseTo(PHYSICS.gravity * STEP, 1);
  });

  it('ignores destroyed items', () => {
    const item = createItem(1, 'mug', 400);
    item.phase = 'destroyed';
    expect(stepItem(item, STEP)).toBeNull();
  });
});

describe('applySwipe', () => {
  it('moves light items further than heavy ones for the same swipe', () => {
    const glass = createItem(1, 'glass', 600);
    const monitor = createItem(2, 'monitor', 600);
    applySwipe(glass, -1);
    applySwipe(monitor, -1);

    simulate(glass, 2);
    simulate(monitor, 2);

    const glassTravel = 600 - glass.x;
    const monitorTravel = 600 - monitor.x;
    expect(glassTravel).toBeGreaterThan(monitorTravel);
  });

  it('takes several swipes to walk a monitor off the desk', () => {
    const monitor = createItem(1, 'monitor', DESK.edgeX + 160);
    let swipes = 0;
    while (monitor.phase === 'resting' && swipes < 40) {
      applySwipe(monitor, -1);
      swipes++;
      simulate(monitor, 0.6);
    }
    expect(swipes).toBeGreaterThan(1);
    expect(monitor.phase).not.toBe('resting');
  });
});

describe('edge predicates', () => {
  it('only reports tipped once the center clears the edge', () => {
    const item = createItem(1, 'mug', DESK.edgeX + 1);
    expect(hasTippedOver(item)).toBe(false);
    item.x = DESK.edgeX - 1;
    expect(hasTippedOver(item)).toBe(true);
  });

  it('reports teetering while the item merely overhangs', () => {
    const item = createItem(1, 'mug', DESK.edgeX + item0Width() / 2 + 5);
    expect(isTeetering(item)).toBe(false);
    item.x = DESK.edgeX + 4;
    expect(isTeetering(item)).toBe(true);
    expect(riskLevel(item)).toBeGreaterThan(0);
    expect(riskLevel(item)).toBeLessThanOrEqual(1);
  });

  it('reports zero risk for a safe item', () => {
    expect(riskLevel(createItem(1, 'mug', 500))).toBe(0);
  });

  it('treats the right edge as a doom edge too', () => {
    const item = createItem(1, 'mug', DESK.rightEdgeX - 2);
    expect(hasTippedOver(item)).toBe(false);
    expect(riskLevel(item)).toBeGreaterThan(0);
    item.x = DESK.rightEdgeX + 1;
    expect(hasTippedOver(item)).toBe(true);
  });
});

function item0Width(): number {
  return createItem(0, 'mug', 0).width;
}
