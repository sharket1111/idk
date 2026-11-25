// 캐릭터 그리기. 스프라이트 시트가 있으면 스프라이트, 없으면 치비 렌더러(코드로 그린 픽셀 캐릭터).
import { GROUND_Y } from './config.js';
import { ChibiRenderer } from './chibi.js';

export function drawFighter(ctx, f) {
  // 그림자 (둥근 타원 느낌)
  const X = Math.round(f.x);
  ctx.fillStyle = 'rgba(90,50,110,0.25)';
  ctx.fillRect(X - 7, GROUND_Y - 1, 14, 3);
  ctx.fillRect(X - 9, GROUND_Y, 18, 1);

  if (f.sprite && f.sprite.loaded) {
    f.sprite.draw(ctx, f.animName, f.stateFrame, X, Math.round(f.y), f.facing === -1);
    return;
  }
  if (!f.chibi) f.chibi = new ChibiRenderer(f.def.look);
  f.chibi.draw(ctx, f);
}

/** F3 디버그: 피격 판정(초록), 공격 판정(빨강) */
export function drawDebug(ctx, f) {
  const box = (b, color) => {
    if (!b) return;
    ctx.fillStyle = color + '55';
    ctx.fillRect(Math.round(b.x), Math.round(b.y), b.w, b.h);
    ctx.strokeStyle = color;
    ctx.strokeRect(Math.round(b.x) + 0.5, Math.round(b.y) + 0.5, b.w - 1, b.h - 1);
  };
  box(f.getHurtbox(), '#3cdc6e');
  box(f.getHitbox(), '#ff3c3c');
  ctx.fillStyle = '#fff';
  ctx.fillRect(Math.round(f.x), Math.round(f.y) - 1, 1, 3);
}
