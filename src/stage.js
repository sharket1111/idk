// 배경. 패럴랙스(멀리 있는 레이어일수록 느리게 스크롤) 픽셀 스테이지
import { SCREEN_W, SCREEN_H, STAGE_W, GROUND_Y } from './config.js';

function seeded(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export class Stage {
  constructor() {
    const rand = seeded(7);
    this.buildings = [];
    for (let x = -10; x < STAGE_W; ) {
      const w = 16 + Math.floor(rand() * 24);
      const h = 20 + Math.floor(rand() * 50);
      const lights = [];
      for (let wy = 6; wy < h - 6; wy += 6)
        for (let wx = 3; wx < w - 3; wx += 5) if (rand() < 0.3) lights.push([wx, wy]);
      this.buildings.push({ x, w, h, lights });
      x += w + Math.floor(rand() * 6);
    }
    this.poles = [];
    for (let x = 20; x < STAGE_W * 1.2; x += 90 + Math.floor(rand() * 40)) this.poles.push(x);
  }

  draw(ctx, camX) {
    // 하늘 (단계별 색 띠)
    const sky = ['#9d8fe0', '#ad98e3', '#bea2e4', '#cfabe2', '#e0b4df', '#f0bedb', '#fcc8d6', '#ffd6cf'];
    const bandH = Math.ceil(GROUND_Y / sky.length);
    sky.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, i * bandH, SCREEN_W, bandH); });

    // 해
    const sunX = Math.round(250 - camX * 0.05), sunY = GROUND_Y - 62, rad = 20;
    ctx.fillStyle = '#fff1b8';
    for (let dy = -rad; dy <= 0; dy++) {
      const w = Math.round(Math.sqrt(rad * rad - dy * dy));
      ctx.fillRect(sunX - w, sunY + dy, w * 2, 1);
    }

    // 먼 건물 (패럴랙스 0.3)
    const fx = camX * 0.3;
    for (const b of this.buildings) {
      const bx = Math.round(b.x - fx);
      if (bx + b.w < 0 || bx > SCREEN_W) continue;
      const top = GROUND_Y - 12 - b.h;
      ctx.fillStyle = '#a593d8';
      ctx.fillRect(bx, top, b.w, b.h + 12);
      ctx.fillStyle = '#fff6d0';
      for (const [wx, wy] of b.lights) ctx.fillRect(bx + wx, top + wy, 2, 2);
    }

    // 중간 레이어: 전봇대 + 전선 (패럴랙스 0.6)
    const mx = camX * 0.6;
    ctx.fillStyle = '#8c7cc8';
    ctx.fillRect(0, GROUND_Y - 14, SCREEN_W, 14);
    for (const p of this.poles) {
      const px = Math.round(p - mx);
      if (px < -4 || px > SCREEN_W + 4) continue;
      ctx.fillRect(px, GROUND_Y - 90, 3, 80);
      ctx.fillRect(px - 8, GROUND_Y - 84, 19, 2);
    }

    // 바닥
    ctx.fillStyle = '#d7b4e3';
    ctx.fillRect(0, GROUND_Y, SCREEN_W, SCREEN_H - GROUND_Y);
    ctx.fillStyle = '#f3dcf5';
    ctx.fillRect(0, GROUND_Y, SCREEN_W, 1);
    ctx.fillStyle = '#c29fd2';
    const off = Math.round(camX) % 32;
    for (let x = -off; x < SCREEN_W; x += 32) ctx.fillRect(x, GROUND_Y + 1, 1, SCREEN_H - GROUND_Y);
    ctx.fillRect(0, GROUND_Y + 12, SCREEN_W, 1);
  }
}
