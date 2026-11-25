// 타격 이펙트 (히트 스파크, 가드 이펙트, 파편)
export class Effects {
  constructor() { this.list = []; }
  clear() { this.list = []; }

  spawn(x, y, type) {
    this.list.push({ type, x, y, t: 0, life: type === 'block' ? 10 : 12 });
    const n = type === 'block' ? 3 : 7;
    for (let i = 0; i < n; i++) {
      this.list.push({
        type: 'particle', x, y, t: 0, life: 10 + Math.random() * 10,
        vx: (Math.random() * 2 - 1) * 2.5, vy: -Math.random() * 2.5,
        color: type === 'block' ? '#8ee6f0' : '#f5d061',
      });
    }
  }

  update() {
    for (const e of this.list) {
      e.t++;
      if (e.type === 'particle') { e.x += e.vx; e.y += e.vy; e.vy += 0.15; }
    }
    this.list = this.list.filter((e) => e.t < e.life);
  }

  draw(ctx) {
    for (const e of this.list) {
      const x = Math.round(e.x), y = Math.round(e.y);
      if (e.type === 'hit') {
        const s = 3 + Math.round(e.t * 1.2);
        ctx.fillStyle = e.t % 4 < 2 ? '#ffffff' : '#f5d061';
        ctx.fillRect(x - s, y - 1, s * 2, 3);
        ctx.fillRect(x - 1, y - s, 3, s * 2);
        const d = Math.round(s * 0.6);
        for (const [dx, dy] of [[-d, -d], [d, -d], [-d, d], [d, d]]) ctx.fillRect(x + dx - 1, y + dy - 1, 2, 2);
      } else if (e.type === 'block') {
        const s = 4 + e.t;
        ctx.strokeStyle = '#8ee6f0';
        ctx.strokeRect(x - s + 0.5, y - s + 0.5, s * 2, s * 2);
      } else {
        ctx.fillStyle = e.color;
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }
}
