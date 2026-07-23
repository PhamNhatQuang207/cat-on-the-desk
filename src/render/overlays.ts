import { COLORS, VIEW } from '../game/config.ts';
import type { GameState } from '../game/types.ts';
import { text, type Ctx } from './draw.ts';
import { keyCap } from './sprites.ts';

function scrim(ctx: Ctx, alpha: number): void {
  ctx.fillStyle = `rgba(10, 7, 15, ${alpha})`;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

export function drawTitle(ctx: Ctx): void {
  scrim(ctx, 0.72);
  const cx = VIEW.width / 2;

  text(ctx, 'CAT ON A DESK', cx, 150, { size: 62, color: COLORS.text, align: 'center', weight: '900' });
  text(ctx, "(Don't Touch Anything!)", cx, 188, { size: 22, color: COLORS.warn, align: 'center' });
  text(ctx, 'Push everything off. Make eye contact. Regret nothing.', cx, 232, {
    size: 17,
    color: COLORS.dim,
    align: 'center',
  });

  drawControls(ctx, 290);

  text(ctx, 'Press SPACE to start', cx, 470, { size: 24, color: COLORS.good, align: 'center', weight: '800' });
}

function drawControls(ctx: Ctx, y: number): void {
  const cx = VIEW.width / 2;
  const rows: Array<[string, string]> = [
    ['← →', 'Prowl along the desk'],
    ['SPACE', 'Paw swipe — heavy things need several'],
    ['SHIFT', 'Hold eye contact for up to x3 points (you cannot move)'],
    ['P', 'Pause'],
  ];
  rows.forEach(([key, desc], i) => {
    const rowY = y + i * 40;
    keyCap(ctx, key, cx - 250, rowY - 22, 76, 30);
    text(ctx, desc, cx - 156, rowY - 2, { size: 17, color: COLORS.text });
  });
}

export function drawPaused(ctx: Ctx): void {
  scrim(ctx, 0.6);
  const cx = VIEW.width / 2;
  text(ctx, 'PAUSED', cx, VIEW.height / 2 - 10, { size: 52, color: COLORS.text, align: 'center', weight: '900' });
  text(ctx, 'Press P to resume', cx, VIEW.height / 2 + 30, { size: 20, color: COLORS.dim, align: 'center' });
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

  text(ctx, 'Press SPACE to get back on the desk', cx, 464, {
    size: 22,
    color: COLORS.good,
    align: 'center',
    weight: '800',
  });
}
