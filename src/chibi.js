// 치비 픽셀 캐릭터를 코드로 그리는 렌더러.
// - 큰 머리(24x22) + 또렷한 3x4 눈 + 짧은 다리 + 파스텔 팔레트 + 자동 외곽선
// - 포즈마다 64x64 캔버스에 한 번 그려서 캐시 → 스프라이트처럼 빠르게 그림
// - 좌표는 "오른쪽을 볼 때", 발 중앙이 (0,0), 위쪽이 음수

const SIZE = 64;
const OX = 32;
const OY = 58;

// 머리 (24x22). H/h 머리(밝음/그림자) S/s 피부 E 눈 W 하이라이트 I/J 홍채(진/연) B 볼터치
// 눈: 왼쪽 10~12열, 오른쪽 16~18열 / 13~16행.  입은 코드로 그림 (14열, 18~19행)
const HEAD = [
  '........hhhhhhh.........',
  '.....hhhHHHHHHHhhh......',
  '...hhHHHHHHHHHHHHHHhh...',
  '..hHHHHHHHHHHHHHHHHHHh..',
  '.hHHHHHHHHHHHHHHHHHHHHh.',
  '.hHHHHHHHHHHHHHHHHHHHHh.',
  'hHHHHHHHHHHHHHHHHHHHHHHh',
  'hHHHHHHHHHHHHHHHHHHHHHHh',
  'hHHHHHHHHHhHHHHHhHHHHHHh',
  'hHHHHHHHHhShHHHhSShHHHHh',
  'hHHHHHHHhSSShHhSSSSShHHh',
  'hHHHHHHhSSSSSSSSSSSSShHh',
  'hHHHHHsSSSSSSSSSSSSSShHh',
  'hHHHHHsSSSEEESSSEEESShHh',
  'hHHHHHsSSSWEESSSWEESShHh',
  'hHHHHHsSSSEIISSSEIISShHh',
  'hHHHHHsSSSIJISSSIJISShHh',
  '.hHHHHsSSBBSSSSSSSBBShH.',
  '.hHHHHHsSSSSSSSSSSSSShh.',
  '..hHHHHhsSSSSSSSSSSSs...',
  '...hhhh.ssSSSSSSSSss....',
  '..........ssssss........',
];

// 머리 장식 / 뒷머리 (캐릭터별로 조합)
export const PARTS = {
  bun: [
    '.hhhh.',
    'hHHHHh',
    'hHHHHh',
    'hHHHHh',
    'hHHHhh',
    '.hhhh.',
  ],
  clip: ['AA', 'Aa'],
  ribbon: [
    '.AA.....AA.',
    'AAAA...AAAA',
    'AAaAAaAAaAA',
    'AAAA...AAAA',
    '.AA.....AA.',
  ],
  longHair: [
    'hHHHh.',
    'hHHHh.',
    'hHHHHh',
    'hHHHHh',
    'hHHHHh',
    'hHHHHh',
    '.hHHHh',
    '.hHHh.',
    '..hh..',
  ],
  circlet: ['AAAAAAAAAAAAAaAAAAAA'],
  tail: [
    '.hhhh...',
    'hh..hh..',
    'hh......',
    'hh......',
    '.hh.....',
    '..hhh...',
    '....hhhh',
  ],
};

const COMMON = {
  E: '#2a1a3a', W: '#ffffff', B: '#ffa3b5', M: '#b8405a', P: '#ff8fa8',
  T: '#ffffff', S: '#ffe6d5', s: '#f2bba6', L: '#ffe6d5', J: '#ffffff',
};

/** 포즈 이름 → 그리기 설정 */
export function makePose(name, { bob = 0, blink = false } = {}) {
  switch (name) {
    case 'punch': return { body: 0, lean: 1, legs: 'stand', arm: 'punch', back: 'back', face: 'angry', reach: 24 };
    case 'kick': return { body: 0, lean: -1, legs: 'kick', arm: 'ready', back: 'back', face: 'angry', reach: 22 };
    case 'guardHigh': return { body: 0, lean: -1, legs: 'stand', arm: 'guardHigh', back: 'down', face: 'focus' };
    case 'guardLow': return { body: 3, lean: 0, legs: 'crouch', arm: 'guardLow', back: 'down', face: 'focus' };
    case 'hit': return { body: 1, lean: -2, legs: 'stand', arm: 'up', back: 'up', face: 'hurt' };
    case 'win': return { body: bob, lean: 0, legs: 'stand', arm: 'up', back: 'up', face: 'happy' };
    case 'ko': return { lying: true, face: 'ko' };
    default: return { body: bob, lean: 0, legs: 'stand', arm: 'ready', back: 'down', face: blink ? 'blink' : 'normal' };
  }
}

function makeCanvas() {
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  c.getContext('2d').imageSmoothingEnabled = false;
  return c;
}

/** 실루엣을 상하좌우로 1px 넓혀 외곽선을 만든다 */
function withOutline(src, color) {
  const c = makeCanvas();
  const g = c.getContext('2d');
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) g.drawImage(src, dx, dy);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = color;
  g.fillRect(0, 0, SIZE, SIZE);
  g.globalCompositeOperation = 'source-over';
  g.drawImage(src, 0, 0);
  return c;
}

export class ChibiRenderer {
  constructor(look) {
    this.look = look;
    this.colors = { ...COMMON, ...look.colors };
    this.cache = new Map();
  }

  draw(ctx, x, y, facing, pose) {
    const img = this.get(pose);
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (facing === -1) ctx.scale(-1, 1);
    ctx.drawImage(img, -OX, -OY);
    ctx.restore();
  }

  get(pose) {
    const key = JSON.stringify(pose);
    let img = this.cache.get(key);
    if (!img) {
      img = pose.lying ? this.buildLying(pose) : this.build(pose);
      this.cache.set(key, img);
    }
    return img;
  }

  /** 누운 자세 = 서 있는 그림을 90도 돌려서 재사용 (뒤로 넘어짐) */
  buildLying(pose) {
    const stand = this.get({ body: 0, lean: 0, legs: 'stand', arm: 'up', back: 'up', face: pose.face });
    const c = makeCanvas();
    const g = c.getContext('2d');
    g.translate(OX + 19, OY - 12);
    g.rotate(-Math.PI / 2);
    g.drawImage(stand, -OX, -OY);
    return c;
  }

  build(p) {
    const L = this.look;
    const C = this.colors;
    const c = makeCanvas();
    const g = c.getContext('2d');
    const r = (x, y, w, h, k) => {
      if (w <= 0 || h <= 0) return;
      g.fillStyle = C[k];
      g.fillRect(OX + x, OY + y, w, h);
    };
    const grid = (rows, x, y, map = (ch) => ch) => {
      rows.forEach((row, j) => {
        for (let i = 0; i < row.length; i++) {
          const ch = map(row[i]);
          if (ch !== '.') r(x + i, y + j, 1, 1, ch);
        }
      });
    };

    const top = -17 + p.body;   // 몸통 윗선
    const sh = top + 2;         // 어깨
    const hx = -11 + p.lean;    // 머리 왼쪽
    const hy = top - 20;        // 머리 위쪽

    // 1) 뒷머리 / 꼬리
    for (const a of L.back || []) grid(PARTS[a.part], hx + a.x, hy + a.y);

    // 2) 뒷팔
    if (p.back === 'back') { r(-9, sh, 3, 3, 'o'); r(-11, sh + 1, 2, 2, 's'); }
    else if (p.back === 'up') { r(-8, sh - 3, 3, 4, 'o'); r(-8, sh - 5, 3, 2, 's'); }
    else { r(-8, sh, 3, 5, 'o'); r(-8, sh + 5, 3, 2, 's'); }

    // 3) 다리 (짧게)
    switch (p.legs) {
      case 'stand':
        r(-4, -6, 3, 4, 'L'); r(1, -6, 3, 4, 'L');
        r(-5, -2, 4, 2, 'K'); r(1, -2, 5, 2, 'K');
        break;
      case 'crouch':
        r(-6, -4, 4, 2, 'L'); r(2, -4, 4, 2, 'L');
        r(-7, -2, 4, 2, 'K'); r(2, -2, 5, 2, 'K');
        break;
      case 'kick':
        r(-4, -6, 3, 4, 'L'); r(-5, -2, 4, 2, 'K');
        r(2, -8, p.reach - 6, 3, 'L'); r(p.reach - 4, -9, 4, 5, 'K');
        break;
    }

    // 4) 몸통 (세일러 칼라 + 리본) + 프릴 치마
    r(-5, top, 10, 9, 'O'); r(-5, top, 2, 9, 'o');
    r(-3, top, 7, 2, 'T');
    r(1, top + 1, 3, 2, 'A'); r(2, top + 3, 1, 1, 'a');
    r(-7, top + 8, 14, 3, 'O'); r(-7, top + 8, 3, 3, 'o'); r(-7, top + 10, 14, 1, 'T');
    for (let x = -7; x < 7; x += 2) r(x, top + 11, 1, 1, 'T');

    // 5) 머리 + 표정
    const plainEyes = !['normal', 'angry', 'focus'].includes(p.face);
    grid(HEAD, hx, hy, (ch) => (plainEyes && 'EWIJ'.includes(ch) ? 'S' : ch));
    const e = (x, y, k = 'E') => r(hx + x, hy + y, 1, 1, k);
    switch (p.face) {
      case 'blink':
        r(hx + 10, hy + 15, 3, 1, 'E'); r(hx + 16, hy + 15, 3, 1, 'E');
        break;
      case 'happy': // ^ ^
        for (const x0 of [10, 16]) { e(x0, 15); e(x0 + 1, 14); e(x0 + 2, 15); }
        break;
      case 'hurt': // > <
        e(10, 13); e(11, 14); e(12, 15); e(11, 16); e(10, 17);
        e(18, 13); e(17, 14); e(16, 15); e(17, 16); e(18, 17);
        break;
      case 'ko': // x x
        for (const x0 of [10, 16]) { e(x0, 13); e(x0 + 2, 13); e(x0 + 1, 14); e(x0, 15); e(x0 + 2, 15); }
        break;
    }
    // 입
    const m = (x, y, k = 'M') => r(hx + x, hy + y, 1, 1, k);
    if (p.face === 'angry' || p.face === 'ko') { r(hx + 13, hy + 18, 3, 2, 'M'); m(14, 19, 'P'); }
    else if (p.face === 'happy') { r(hx + 13, hy + 18, 3, 1, 'M'); m(14, 19); }
    else if (p.face === 'hurt') { m(12, 19); m(13, 18); m(14, 19); m(15, 18); m(16, 19); }
    else if (p.face === 'focus') { r(hx + 14, hy + 18, 2, 1, 'M'); }
    else { m(13, 18); m(14, 19); m(15, 18); } // 미소

    // 6) 머리 장식
    for (const a of L.accessories || []) grid(PARTS[a.part], hx + a.x, hy + a.y);

    // 7) 앞팔
    switch (p.arm) {
      case 'ready': r(4, sh, 3, 3, 'O'); r(6, sh + 1, 3, 3, 'S'); break;
      case 'punch': r(4, sh, 4, 3, 'O'); r(8, sh + 1, p.reach - 12, 2, 'S'); r(p.reach - 4, sh - 1, 4, 4, 'S'); break;
      case 'guardHigh': r(3, sh - 1, 3, 3, 'O'); r(4, sh - 5, 3, 4, 'S'); r(7, sh - 3, 3, 3, 'S'); break;
      case 'guardLow': r(4, sh + 1, 3, 3, 'O'); r(6, sh + 3, 3, 3, 'S'); break;
      case 'up': r(5, sh - 1, 3, 3, 'O'); r(9, sh - 3, 3, 3, 'S'); r(8, sh - 1, 1, 1, 'S'); break;
    }

    return withOutline(c, L.outline);
  }
}
