import { CAT_BREEDS, COLORS, OWNER, SCORING, STARE, VIEW } from '../game/config.ts';
import { comboMultiplier, stareMultiplier } from '../game/systems/scoring.ts';
import type { GameState } from '../game/types.ts';
import { ellipse, meter, text, type Ctx } from './draw.ts';

export function drawHud(ctx: Ctx, state: GameState): void {
  // Score.
  text(ctx, String(state.score), 26, 46, { size: 40, color: COLORS.text, weight: '800' });
  text(ctx, `BEST ${state.highScore}`, 26, 68, { size: 14, color: COLORS.dim });

  // Combo.
  if (state.combo > 1) {
    const mult = comboMultiplier(state.combo);
    const pulse = 1 + Math.max(0, state.comboTimer / SCORING.comboWindow - 0.8) * 0.6;
    text(ctx, `x${mult} COMBO`, 26, 100, { size: 20 * pulse, color: COLORS.warn, weight: '800' });
    meter(ctx, 26, 108, 130, 6, state.comboTimer / SCORING.comboWindow, COLORS.warn);
  }

  // Stare multiplier, front and center while it's building.
  if (state.cat.staring) {
    const mult = stareMultiplier(state.cat.stareTime, true);
    const t = Math.min(1, state.cat.stareTime / STARE.rampTime);
    text(ctx, `👁 EYE CONTACT  x${mult.toFixed(1)}`, VIEW.width / 2, 60, {
      size: 26 + t * 8,
      color: t >= 1 ? COLORS.good : COLORS.warn,
      align: 'center',
      weight: '800',
    });
    meter(ctx, VIEW.width / 2 - 90, 72, 180, 8, t, t >= 1 ? COLORS.good : COLORS.warn);
  }

  drawAggro(ctx, state);
  drawStrikes(ctx, state);
}

function drawAggro(ctx: Ctx, state: GameState): void {
  const w = 190;
  const x = VIEW.width - w - 26;
  text(ctx, 'OWNER PATIENCE', x, 34, { size: 12, color: COLORS.dim });
  // Shown inverted: a full bar is a calm owner, an empty one means trouble.
  const patience = 1 - state.owner.aggro;
  const color = patience > 0.6 ? COLORS.good : patience > 0.3 ? COLORS.warn : COLORS.danger;
  meter(ctx, x, 42, w, 10, patience, color);
}

function drawStrikes(ctx: Ctx, state: GameState): void {
  const remaining = OWNER.maxStrikes - state.strikes;
  const x = VIEW.width - 26;
  const spec = CAT_BREEDS[state.cat.breed];
  for (let i = 0; i < OWNER.maxStrikes; i++) {
    const cx = x - i * 26;
    const alive = i < remaining;
    ctx.save();
    ctx.globalAlpha = alive ? 1 : 0.3;
    // Lives are little cat heads; spent ones go grey.
    const fur = alive ? spec.fur : '#5b5468';
    ellipse(ctx, cx, 78, 9, 8, fur);
    ctx.fillStyle = fur;
    ctx.beginPath();
    ctx.moveTo(cx - 9, 74);
    ctx.lineTo(cx - 6, 64);
    ctx.lineTo(cx - 1, 73);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 9, 74);
    ctx.lineTo(cx + 6, 64);
    ctx.lineTo(cx + 1, 73);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = alive ? spec.eye : '#3a3546';
    ctx.fillRect(cx - 5, 76, 3, 3);
    ctx.fillRect(cx + 2, 76, 3, 3);
    ctx.restore();
  }
}
