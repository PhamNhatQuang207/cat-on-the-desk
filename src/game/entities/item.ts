import { DESK, ITEM_SPECS, type ItemKind } from '../config.ts';
import type { Item } from '../types.ts';

export function createItem(id: number, kind: ItemKind, x: number): Item {
  const spec = ITEM_SPECS[kind];
  return {
    id,
    kind,
    x,
    y: DESK.surfaceY,
    vx: 0,
    vy: 0,
    width: spec.width,
    height: spec.height,
    mass: spec.mass,
    points: spec.points,
    fragile: spec.fragile,
    phase: 'resting',
    rotation: 0,
    spin: 0,
    rescuedBy: null,
    wobble: 0,
  };
}

/** Items still sitting on the desk, in left-to-right order of danger. */
export function restingItems(items: readonly Item[]): Item[] {
  return items.filter((i) => i.phase === 'resting');
}

export function findItemById(items: readonly Item[], id: number | null): Item | undefined {
  if (id === null) return undefined;
  return items.find((i) => i.id === id);
}
