// 체력바, 이름, 승리 표시, 박자 하트
import { SCREEN_W, ROUNDS_TO_WIN, MAX_HP } from './config.js';

export const FONT = '"Press Start 2P", monospace';
const INK = '#4a2546';

export function drawText(ctx, str, x, y, { size = 8, align = 'left', color = '#fff', shadow = INK } = {}) {
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

const HEART = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
const HEART_BIG = ['.XXX.XXX.', 'XXXXXXXXX', 'XXXXXXXXX', 'XXXXXXXXX', '.XXXXXXX.', '..XXXXX..', '...XXX...', '....X....'];

export function stamp(ctx, shape, cx, cy, color) {
  ctx.fillStyle = color;
  const ox = Math.floor(shape[0].length / 2), oy = Math.floor(shape.length / 2);
  shape.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) if (row[i] === 'X') ctx.fillRect(cx + i - ox, cy + j - oy, 1, 1);
  });
}

export class HUD {
  constructor() { this.lag = [MAX_HP, MAX_HP]; }
  reset() { this.lag = [MAX_HP, MAX_HP]; }

  update(p1, p2) {
    [p1, p2].forEach((p, i) => {
      this.lag[i] = this.lag[i] > p.hp ? Math.max(p.hp, this.lag[i] - 0.6) : p.hp;
    });
  }

  draw(ctx, p1, p2, beatFrac) {
    const W = 110, H = 7, Y = 8;
    this.bar(ctx, 10, Y, W, H, p1, this.lag[0], false);
    this.bar(ctx, SCREEN_W - 10 - W, Y, W, H, p2, this.lag[1], true);

    // 가운데: 박자에 맞춰 뛰는 하트
    ctx.fillStyle = INK;
    ctx.fillRect(SCREEN_W / 2 - 13, 3, 26, 20);
    const big = beatFrac < 0.15;
    stamp(ctx, big ? HEART_BIG : HEART, SCREEN_W / 2, 13, big ? '#ff7fa8' : '#d65a86');

    drawText(ctx, p1.name, 10, Y + H + 4, { color: p1.color });
    drawText(ctx, p2.name, SCREEN_W - 10, Y + H + 4, { align: 'right', color: p2.color });
    for (let i = 0; i < ROUNDS_TO_WIN; i++) {
      this.winMark(ctx, 10 + p1.name.length * 8 + 4 + i * 8, Y + H + 4, i < p1.wins);
      this.winMark(ctx, SCREEN_W - 10 - p2.name.length * 8 - 10 - i * 8, Y + H + 4, i < p2.wins);
    }
  }

  bar(ctx, x, y, w, h, p, lag, mirror) {
    ctx.fillStyle = INK;
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = '#7a5a86';
    ctx.fillRect(x, y, w, h);
    const fill = (fw, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(mirror ? x : x + w - fw, y, fw, h);
    };
    fill(Math.round((w * lag) / MAX_HP), '#ff5f7e');
    const hpW = Math.round((w * p.hp) / MAX_HP);
    fill(hpW, p.hp / MAX_HP > 0.3 ? '#8ee8b8' : '#ffb36b');
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(mirror ? x : x + w - hpW, y, hpW, 1);
  }

  winMark(ctx, x, y, on) {
    ctx.fillStyle = INK;
    ctx.fillRect(x, y, 6, 6);
    ctx.fillStyle = on ? '#ff9cc6' : '#7a5a86';
    ctx.fillRect(x + 1, y + 1, 4, 4);
  }
}
