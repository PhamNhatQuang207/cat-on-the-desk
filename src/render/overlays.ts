import { CAT, CAT_BREED_ORDER, CAT_BREEDS, COLORS, DESK, VIEW } from '../game/config.ts';
import type { Cat, GameState } from '../game/types.ts';
import { text, type Ctx } from './draw.ts';
import { drawCat, keyCap } from './sprites.ts';

function scrim(ctx: Ctx, alpha: number): void {
  ctx.fillStyle = `rgba(10, 7, 15, ${alpha})`;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

export function drawTitle(ctx: Ctx, state: GameState): void {
  scrim(ctx, 0.72);
  const cx = VIEW.width / 2;

  text(ctx, 'CAT ON A DESK', cx, 88, { size: 46, color: COLORS.text, align: 'center', weight: '900' });
  text(ctx, "(Don't Touch Anything!)", cx, 118, { size: 18, color: COLORS.warn, align: 'center' });

  drawBreedPicker(ctx, state, 146);

  drawControls(ctx, 346);

  text(ctx, 'Press SPACE to start', cx, 492, { size: 22, color: COLORS.good, align: 'center', weight: '800' });
}

function drawBreedPicker(ctx: Ctx, state: GameState, y: number): void {
  const cx = VIEW.width / 2;
  const spec = CAT_BREEDS[state.selectedBreed];
  const index = CAT_BREED_ORDER.indexOf(state.selectedBreed);

  text(ctx, 'CHOOSE YOUR CAT', cx, y, { size: 13, color: COLORS.dim, align: 'center', weight: '700' });

  keyCap(ctx, '◄', cx - 168, y + 14, 42, 42);
  keyCap(ctx, '►', cx + 126, y + 14, 42, 42);

  // Preview with the real sprite, so it never drifts from what plays in-game.
  const previewCat: Cat = {
    breed: state.selectedBreed,
    x: cx,
    facing: 1,
    swipeTimer: 0,
    swipeCooldown: 0,
    swipeConnected: true,
    stunTimer: 0,
    bob: performance.now() / 500,
  };
  const previewAnchorY = y + 80;
  ctx.save();
  ctx.translate(0, previewAnchorY - DESK.surfaceY);
  drawCat(ctx, previewCat, previewCat.x + CAT.pawReach * 0.35, 0.1);
  ctx.restore();

  text(ctx, spec.name, cx, y + 106, { size: 21, color: COLORS.text, align: 'center', weight: '800' });
  text(ctx, spec.tagline, cx, y + 128, { size: 13, color: COLORS.dim, align: 'center' });
  text(ctx, `${index + 1} / ${CAT_BREED_ORDER.length}`, cx, y + 146, { size: 12, color: COLORS.dim, align: 'center' });
}

function drawControls(ctx: Ctx, y: number): void {
  const cx = VIEW.width / 2;
  const rows: Array<[string, string]> = [
    ['← →', 'Prowl the desk (title: browse cats)'],
    ['SPACE', 'Paw swipe — heavy things need several'],
    ['P', 'Pause'],
  ];
  rows.forEach(([key, desc], i) => {
    const rowY = y + i * 33;
    keyCap(ctx, key, cx - 250, rowY - 19, 76, 26);
    text(ctx, desc, cx - 156, rowY, { size: 15, color: COLORS.text });
  });
}

export function drawPaused(ctx: Ctx): void {
  scrim(ctx, 0.6);
  const cx = VIEW.width / 2;
  text(ctx, 'PAUSED', cx, VIEW.height / 2 - 10, { size: 52, color: COLORS.text, align: 'center', weight: '900' });
  text(ctx, 'Press P or tap to resume', cx, VIEW.height / 2 + 30, { size: 20, color: COLORS.dim, align: 'center' });
}

export function drawGameOver(ctx: Ctx, state: GameState): void {
  scrim(ctx, 0.78);
  const cx = VIEW.width / 2;
  const isBest = state.score >= state.highScore && state.score > 0;

  text(ctx, 'BAD CAT', cx, 150, { size: 64, color: COLORS.danger, align: 'center', weight: '900' });
  text(ctx, 'You have been removed from the desk.', cx, 190, { size: 19, color: COLORS.dim, align: 'center' });

  text(ctx, String(state.score), cx, 285, { size: 74, color: COLORS.text, align: 'center', weight: '900' });
  text(ctx, 'POINTS OF CHAOS', cx, 312, { size: 14, color: COLORS.dim, align: 'center' });

  const mins = Math.floor(state.elapsed / 60);
  const secs = Math.floor(state.elapsed % 60);
  text(
    ctx,
    `${state.destroyed} items destroyed  ·  survived ${mins}:${String(secs).padStart(2, '0')}`,
    cx,
    348,
    { size: 18, color: COLORS.text, align: 'center' },
  );

  text(ctx, isBest ? '🏆 NEW BEST!' : `Best: ${state.highScore}`, cx, 392, {
    size: 22,
    color: isBest ? COLORS.warn : COLORS.dim,
    align: 'center',
    weight: '800',
  });

  const spec = CAT_BREEDS[state.selectedBreed];
  text(ctx, `🐾 ← → to pick your next cat — ${spec.name}`, cx, 426, {
    size: 15,
    color: COLORS.dim,
    align: 'center',
    weight: '700',
  });

  text(ctx, 'Press SPACE to get back on the desk', cx, 464, {
    size: 22,
    color: COLORS.good,
    align: 'center',
    weight: '800',
  });
}
