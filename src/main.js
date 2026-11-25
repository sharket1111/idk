// 진입점: 캔버스 준비 + 게임 루프
// 리듬게임은 프레임이 아니라 "오디오 시계"를 기준으로 움직이므로, 매 프레임 update → render 만 하면 된다.
import { SCREEN_W, SCREEN_H } from './config.js';
import { Game } from './game.js';
import { bindClick } from './input.js';

const canvas = document.getElementById('game');
canvas.width = SCREEN_W;
canvas.height = SCREEN_H;
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
bindClick(canvas);

function resize() {
  const scale = Math.max(1, Math.floor(Math.min(innerWidth / SCREEN_W, (innerHeight - 70) / SCREEN_H)));
  canvas.style.width = `${SCREEN_W * scale}px`;
  canvas.style.height = `${SCREEN_H * scale}px`;
}
addEventListener('resize', resize);
resize();

async function start() {
  try {
    await Promise.race([document.fonts.load('8px "Press Start 2P"'), new Promise((r) => setTimeout(r, 1500))]);
  } catch {}
  const game = new Game(ctx);
  window.game = game; // 개발자 도구 디버깅용
  function frame() {
    game.update();
    game.render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
start();
