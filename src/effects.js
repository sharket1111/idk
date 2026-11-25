// 타격 이펙트: 별 모양 히트 스파크 + 하트/별 파티클, 가드는 비눗방울 링
const STAR = ['..X..', '.XXX.', 'XXXXX', '.XXX.', '.X.X.'];
const HEART = ['XX.XX', 'XXXXX', '.XXX.', '..X..'];
const SPARK = ['.X.', 'XXX', '.X.'];

function stamp(ctx, shape, x, y, color) {
  ctx.fillStyle = color;
  const ox = Math.floor(shape[0].length / 2), oy = Math.floor(shape.length / 2);
  shape.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) if (row[i] === 'X') ctx.fillRect(x + i - ox, y + j - oy, 1, 1);
  });
}

export class Effects {
  constructor() { this.list = []; }
  clear() { this.list = []; }

  spawn(x, y, type) {
    this.list.push({ type, x, y, t: 0, life: type === 'block' ? 10 : 12 });
    const n = type === 'block' ? 3 : 6;
    for (let i = 0; i < n; i++) {
      const pick = type === 'block' ? 'spark' : ['heart', 'star', 'spark'][i % 3];
      this.list.push({
        type: 'particle', shape: pick, x, y, t: 0, life: 14 + Math.random() * 10,
        vx: (Math.random() * 2 - 1) * 1.8, vy: -0.8 - Math.random() * 1.8,
        color: type === 'block' ? '#b8ecff' : { heart: '#ff7fa8', star: '#ffe27a', spark: '#ffffff' }[pick],
      });
    }
  }

  update() {
    for (const e of this.list) {
      e.t++;
      if (e.type === 'particle') { e.x += e.vx; e.y += e.vy; e.vy += 0.1; e.vx *= 0.96; }
    }
    this.list = this.list.filter((e) => e.t < e.life);
  }

  draw(ctx) {
    for (const e of this.list) {
      const x = Math.round(e.x), y = Math.round(e.y);
      if (e.type === 'hit') {
        // 반짝이는 십자 + 가운데 별
        const s = 2 + Math.round(e.t * 0.9);
        ctx.fillStyle = e.t % 4 < 2 ? '#ffffff' : '#ffe27a';
        ctx.fillRect(x - s, y, s * 2 + 1, 1);
        ctx.fillRect(x, y - s, 1, s * 2 + 1);
        if (e.t < 8) stamp(ctx, STAR, x, y, e.t % 4 < 2 ? '#ffe27a' : '#ffffff');
      } else if (e.type === 'block') {
        const rad = 3 + e.t;
        ctx.fillStyle = '#b8ecff';
        for (let a = 0; a < 16; a++) {
          const ang = (a / 16) * Math.PI * 2;
          ctx.fillRect(Math.round(x + Math.cos(ang) * rad), Math.round(y + Math.sin(ang) * rad), 1, 1);
        }
      } else if (e.life - e.t > 3 || e.t % 2 === 0) { // 사라지기 직전 깜빡
        stamp(ctx, { heart: HEART, star: STAR, spark: SPARK }[e.shape], x, y, e.color);
      }
    }
  }
}
