// 화면 아래 리듬 트랙: 노트가 오른쪽에서 왼쪽 판정선으로 흘러온다.
// 위 레인 = 펀치(하트), 아래 레인 = 킥(별). 방어 노트는 하늘색 테두리(방패).
import { SCREEN_W, SCREEN_H, SCROLL_SPEED, BEAT } from './config.js';
import { drawText } from './hud.js';

const HEART = ['.XX...XX.', 'XXXX.XXXX', 'XXXXXXXXX', 'XXXXXXXXX', '.XXXXXXX.', '..XXXXX..', '...XXX...', '....X....'];
const STAR = ['....X....', '...XXX...', 'XXXXXXXXX', '.XXXXXXX.', '..XXXXX..', '.XXX.XXX.', '.XX...XX.'];

export const TRACK = { top: 126, judgeX: 44, laneY: { light: 145, heavy: 164 } };
const NOTE_COLOR = { light: '#ff7fa8', heavy: '#ffd24a' };

function shapeAt(ctx, shape, cx, cy, fill, outline) {
  const ox = Math.floor(shape[0].length / 2), oy = Math.floor(shape.length / 2);
  const each = (fn) => shape.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === 'X') fn(cx + i - ox, cy + j - oy); });
  if (outline) {
    ctx.fillStyle = outline;
    each((x, y) => ctx.fillRect(x - 1, y - 1, 3, 3));
  }
  if (fill) {
    ctx.fillStyle = fill;
    each((x, y) => ctx.fillRect(x, y, 1, 1));
  }
}

export function drawNote(ctx, type, x, y, defend, alpha = 1) {
  ctx.globalAlpha = alpha;
  shapeAt(ctx, type === 'light' ? HEART : STAR, Math.round(x), y, NOTE_COLOR[type], defend ? '#8ee6ff' : '#4a2546');
  ctx.globalAlpha = 1;
}

/**
 * @param game  phrases, songStart, turnBar 등을 가진 Game
 * @param now   현재 오디오 시간
 */
export function drawTrack(ctx, game, now) {
  const { top, judgeX, laneY } = TRACK;
  const xOf = (t) => judgeX + (t - now) * SCROLL_SPEED;

  // 패널
  ctx.fillStyle = 'rgba(74,37,70,0.88)';
  ctx.fillRect(0, top, SCREEN_W, SCREEN_H - top);
  ctx.fillStyle = '#6b4a78';
  for (const y of Object.values(laneY)) ctx.fillRect(0, y - 7, SCREEN_W, 15);

  // 박자선 / 마디선
  const first = Math.ceil((now - 0.4 - game.songStart) / BEAT);
  for (let i = first; ; i++) {
    const t = game.songStart + i * BEAT;
    const x = Math.round(xOf(t));
    if (x > SCREEN_W) break;
    const barLine = i % 4 === 0;
    ctx.fillStyle = barLine ? '#d8b4e8' : '#8a6a98';
    ctx.fillRect(x, laneY.light - 8, 1, laneY.heavy - laneY.light + 17);
    if (barLine) {
      const info = game.barInfo(i / 4);
      if (info) drawText(ctx, info.label, x + 2, top + 2, { color: info.color, shadow: null });
    }
  }

  // 판정선 (빈 모양)
  ctx.fillStyle = '#4a2546';
  ctx.fillRect(0, laneY.light - 8, judgeX + 8, laneY.heavy - laneY.light + 17);
  shapeAt(ctx, HEART, judgeX, laneY.light, null, '#ffffff');
  shapeAt(ctx, HEART, judgeX, laneY.light, '#6b4a78', null);
  shapeAt(ctx, STAR, judgeX, laneY.heavy, null, '#ffffff');
  shapeAt(ctx, STAR, judgeX, laneY.heavy, '#6b4a78', null);

  // 노트
  for (const ph of game.visiblePhrases()) {
    for (const n of ph.notes) {
      if (n.call === null) {
        const x = xOf(n.callTime);
        if (x > -10 && x < SCREEN_W + 10) drawNote(ctx, n.type, x, laneY[n.type], false);
      }
      if (n.armed && n.resp === null) {
        const x = xOf(n.respTime);
        if (x > -10 && x < SCREEN_W + 10) drawNote(ctx, n.type, x, laneY[n.type], true);
      }
    }
  }

  // 지금 누를 사람의 키 안내
  const act = game.activeActor(now);
  if (act) {
    const [kl, kh] = game.keyLabels(act);
    drawText(ctx, kl, 6, laneY.light - 3, { color: act.color });
    drawText(ctx, kh, 6, laneY.heavy - 3, { color: act.color });
  }
}
