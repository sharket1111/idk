// 스프라이트 시트 재생기. 직접 그린 픽셀아트를 넣을 때 사용.
//
// characters.js 에서 예:
//   sprite: {
//     src: 'assets/blaze.png', frameW: 64, frameH: 64,
//     anchorX: 32, anchorY: 63,            // 프레임 안에서 "발 중앙" 위치
//     anims: {                              // 이름 = Fighter.animName (상태 이름 또는 기술 이름)
//       idle:       { row: 0, frames: 4, speed: 10 },
//       walk:       { row: 1, frames: 6, speed: 6 },
//       standLight: { row: 2, frames: 3, speed: 4, loop: false },
//       ...
//     },
//   }
// 그림은 오른쪽을 보는 방향으로 그리면, 왼쪽을 볼 때 자동으로 뒤집힌다.

export class SpriteSheet {
  constructor(cfg) {
    Object.assign(this, { anchorX: cfg.frameW / 2, anchorY: cfg.frameH, ...cfg });
    this.loaded = false;
    this.image = new Image();
    this.image.onload = () => { this.loaded = true; };
    this.image.onerror = () => console.warn('스프라이트 로드 실패:', cfg.src);
    this.image.src = cfg.src;
  }

  draw(ctx, name, tick, x, y, flip) {
    const a = this.anims[name] || this.anims.idle;
    if (!a) return;
    let i = Math.floor(tick / (a.speed || 6));
    i = a.loop === false ? Math.min(i, a.frames - 1) : i % a.frames;
    const sx = ((a.col || 0) + i) * this.frameW;
    const sy = a.row * this.frameH;
    ctx.save();
    ctx.translate(x, y);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(this.image, sx, sy, this.frameW, this.frameH, -this.anchorX, -this.anchorY, this.frameW, this.frameH);
    ctx.restore();
  }
}
