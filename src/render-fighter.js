// 캐릭터 그리기. 스프라이트가 있으면 스프라이트, 없으면 사각형으로 만든 임시 픽셀 캐릭터.
import { GROUND_Y } from './config.js';

export function drawFighter(ctx, f) {
  // 그림자
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(Math.round(f.x) - 11, GROUND_Y - 1, 22, 3);

  if (f.sprite && f.sprite.loaded) {
    f.sprite.draw(ctx, f.animName, f.stateFrame, Math.round(f.x), Math.round(f.y), f.facing === -1);
  } else {
    drawPlaceholder(ctx, f);
  }
}

function drawPlaceholder(ctx, f) {
  const P = f.palette;
  const X = Math.round(f.x);
  const Y = Math.round(f.y);
  const dir = f.facing;
  // (x, y)는 "오른쪽을 볼 때" 기준 좌표. 왼쪽을 보면 자동으로 좌우 반전
  const r = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(dir === 1 ? X + x : X - x - w, Y + y, w, h);
  };

  const s = f.state;
  if (s === 'knockdown' || s === 'ko') {
    r(10, -7, 14, 6, P.dark);   // 다리
    r(-8, -8, 18, 8, P.main);   // 몸
    r(-19, -10, 11, 10, P.skin); // 머리
    r(-21, -10, 3, 10, P.hair);
    return;
  }

  const m = f.move;
  const phase = f.attackPhase;
  const crouch = f.isCrouching;
  const airborne = s === 'jump' || (m && m.air);
  const legH = crouch ? 6 : airborne ? 14 : 22;
  const bob = s === 'idle' ? Math.floor(f.stateFrame / 20) % 2 : 0;
  const lean = s === 'hitstun' ? -3 : 0;

  // 다리
  if (crouch) {
    r(-9, -6, 8, 6, P.dark);
    r(2, -6, 8, 6, P.dark);
  } else {
    let step = 0;
    if (s === 'walk') step = [0, 2, 0, -2][Math.floor(f.stateFrame / 8) % 4];
    r(-7 + step, -legH, 6, legH, P.dark);
    r(1 - step, -legH, 6, legH, P.dark);
    r(-8 + step, -2, 7, 2, P.outline);
    r(1 - step, -2, 8, 2, P.outline);
  }

  // 몸통, 머리
  const torsoY = -legH - 20 + bob;
  r(-8 + lean, torsoY, 16, 20, P.main);
  r(-8 + lean, -legH - 4, 16, 3, P.accent); // 띠
  const headY = torsoY - 12;
  r(-5 + lean, headY, 11, 12, P.skin);
  r(-6 + lean, headY - 2, 13, 5, P.hair);
  r(3 + lean, headY + 5, 2, 2, P.outline); // 눈

  // 팔 / 공격 자세
  const sy = torsoY + 2;
  r(-11 + lean, sy, 4, 12, P.skin); // 뒷팔
  if (phase === 'active') {
    const hb = m.hitbox;
    const reach = hb.x + hb.w;
    if (m.pose === 'punch') {
      r(6, sy + 1, reach - 11, 4, P.skin);
      r(reach - 5, sy - 1, 5, 6, P.accent); // 주먹
    } else if (m.pose === 'lowKick' || m.pose === 'sweep') {
      r(6, hb.y + 1, reach - 6, 4, P.dark);
      r(reach - 4, hb.y, 4, 5, P.outline);
      r(6, sy + 2, 5, 5, P.skin);
    } else if (m.pose === 'airKick') {
      r(4, hb.y + hb.h / 2 - 2, reach - 4, 5, P.dark);
      r(reach - 4, hb.y + hb.h / 2 - 3, 4, 6, P.outline);
      r(6, sy + 2, 5, 5, P.skin);
    }
  } else if (phase) {
    r(2, sy + 3, 5, 5, P.accent); // 준비/후딜: 주먹을 당긴 자세
  } else if (s === 'blockstun') {
    r(5, sy - 3, 4, 14, P.skin);  // 팔 교차 가드
    r(8, sy - 1, 4, 12, P.accent);
  } else if (s === 'hitstun') {
    r(4 + lean, sy - 6, 4, 9, P.skin);
  } else {
    r(6, sy, 4, 8, P.skin);       // 기본 가드 자세
    r(8, sy + 2, 5, 5, P.accent);
  }
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
  ctx.fillRect(Math.round(f.x), Math.round(f.y) - 1, 1, 3); // 원점
}
