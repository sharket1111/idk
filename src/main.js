// 진입점: 캔버스 준비 + 고정 프레임 게임 루프
import { SCREEN_W, SCREEN_H, FPS } from './config.js';
import { Game } from './game.js';

const canvas = document.getElementById('game');
canvas.width = SCREEN_W;
canvas.height = SCREEN_H;
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// 창 크기에 맞춰 "정수 배율"로만 확대 → 픽셀이 고르게 보임
function resize() {
  const scale = Math.max(1, Math.floor(Math.min(innerWidth / SCREEN_W, (innerHeight - 70) / SCREEN_H)));
  canvas.style.width = `${SCREEN_W * scale}px`;
  canvas.style.height = `${SCREEN_H * scale}px`;
}
addEventListener('resize', resize);
resize();

async function start() {
  // 픽셀 폰트 로드 대기 (실패해도 진행)
  try {
    await Promise.race([document.fonts.load('8px "Press Start 2P"'), new Promise((r) => setTimeout(r, 1500))]);
  } catch {}

  const game = new Game(ctx);
  window.game = game; // 개발자 도구에서 디버깅용

  // 고정 타임스텝: 모니터 주사율과 관계없이 게임 로직은 정확히 초당 60번 실행
  const STEP = 1000 / FPS;
  let last = performance.now();
  let acc = 0;
  function frame(now) {
    acc += Math.min(now - last, 250);
    last = now;
    while (acc >= STEP) {
      game.update();
      acc -= STEP;
    }
    game.render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
start();
