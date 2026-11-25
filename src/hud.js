// 체력바, 타이머, 라운드 표시, 중앙 메시지
import { SCREEN_W, SCREEN_H, ROUNDS_TO_WIN, FPS } from './config.js';

export const FONT = '"Press Start 2P", monospace';

export function drawText(ctx, str, x, y, { size = 8, align = 'left', color = '#fff', shadow = '#1a1020' } = {}) {
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  if (shadow) {
    ctx.fillStyle = shadow;
    ctx.fillText(str, x + 1, y + 1);
  }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

export class HUD {
  constructor() { this.lag = [0, 0]; }
  reset(p1, p2) { this.lag = [p1.hp, p2.hp]; }

  /** 빨간 "깎인 체력" 부분이 천천히 따라 줄어들게 */
  update(p1, p2) {
    [p1, p2].forEach((p, i) => {
      this.lag[i] = this.lag[i] > p.hp ? Math.max(p.hp, this.lag[i] - 0.4) : p.hp;
    });
  }

  draw(ctx, game) {
    const { p1, p2 } = game;
    const W = 150, H = 8, Y = 10;
    this.bar(ctx, 12, Y, W, H, p1, this.lag[0], false);
    this.bar(ctx, SCREEN_W - 12 - W, Y, W, H, p2, this.lag[1], true);

    // 타이머
    ctx.fillStyle = '#1a1020';
    ctx.fillRect(SCREEN_W / 2 - 14, 5, 28, 18);
    drawText(ctx, String(Math.ceil(game.timer / FPS)).padStart(2, '0'), SCREEN_W / 2, 7, { size: 16, align: 'center', color: '#f5d061' });

    // 이름 + 승리 표시
    drawText(ctx, p1.name, 12, Y + H + 4);
    drawText(ctx, p2.name, SCREEN_W - 12, Y + H + 4, { align: 'right' });
    for (let i = 0; i < ROUNDS_TO_WIN; i++) {
      this.winMark(ctx, 12 + 50 + i * 8, Y + H + 4, i < p1.wins);
      this.winMark(ctx, SCREEN_W - 12 - 56 - i * 8, Y + H + 4, i < p2.wins);
    }

    // 중앙 메시지
    if (game.message) {
      drawText(ctx, game.message, SCREEN_W / 2, SCREEN_H / 2 - 30, { size: 16, align: 'center', color: '#fff4c8' });
    }
    if (game.subMessage && Math.floor(game.phaseFrame / 30) % 2 === 0) {
      drawText(ctx, game.subMessage, SCREEN_W / 2, SCREEN_H / 2 - 6, { size: 8, align: 'center' });
    }
  }

  bar(ctx, x, y, w, h, p, lag, mirror) {
    ctx.fillStyle = '#1a1020';
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = '#3a2a48';
    ctx.fillRect(x, y, w, h);
    const lagW = Math.round((w * lag) / p.stats.maxHp);
    const hpW = Math.round((w * p.hp) / p.stats.maxHp);
    // P1은 화면 중앙 쪽에 붙어서 바깥쪽부터 줄어든다 (P2는 반대)
    const fill = (fw, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(mirror ? x : x + w - fw, y, fw, h);
    };
    fill(lagW, '#d8403c');
    fill(hpW, p.hp / p.stats.maxHp > 0.3 ? '#f5d061' : '#f08a3c');
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(mirror ? x : x + w - hpW, y, hpW, 2); // 하이라이트
  }

  winMark(ctx, x, y, on) {
    ctx.fillStyle = '#1a1020';
    ctx.fillRect(x, y, 6, 6);
    ctx.fillStyle = on ? '#f5d061' : '#3a2a48';
    ctx.fillRect(x + 1, y + 1, 4, 4);
  }
}
