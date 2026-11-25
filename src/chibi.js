// 치비(2등신) 픽셀 캐릭터를 코드로 그리는 렌더러.
// - 큰 머리 + 큰 눈(얼굴 아래쪽) + 짧은 몸 + 파스텔 팔레트 + 자동 외곽선
// - 포즈마다 64x64 캔버스에 한 번 그려서 캐시 → 실제 스프라이트처럼 빠르게 그림
// - 모든 좌표는 "오른쪽을 볼 때", 발 중앙이 (0,0), 위쪽이 음수

const SIZE = 64;
const OX = 32; // 캔버스 안의 발 위치
const OY = 58;

// 머리 (14x14). 글자 = 팔레트 키, '.' = 투명
// H/h 머리카락(밝음/그림자) S/s 피부 E 눈동자 W 하이라이트 I 홍채 B 볼터치 M 입
const HEAD = [
  '....hhhhh.....',
  '..hhHHHHHhh...',
  '.hHHHHHHHHHh..',
  '.HHHHHHHHHHHh.',
  'hHHHHHHHHHHHHh',
  'hHHHHHHSHHHSHh',
  'hHHHHHSSSHSSSh',
  'hHHHHSSSSSSSSh',
  'hHHHsSEWSSEWSh',
  'hHHHsSIISSIISh',
  '.HHHsBSSSSSSB.',
  '..HhsSSSSSSSs.',
  '...hssSSSSSs..',
  '.....sssss....',
];

// 머리 장식 / 뒷머리 (캐릭터별로 골라 씀)
export const PARTS = {
  bun: [
    '.hh.',
    'hHHh',
    'hHHh',
    '.hh.',
  ],
  clip: ['Aa'],
  ribbon: [
    'AA...AA',
    'AAaAaAA',
    'AA...AA',
  ],
  longHair: [
    'hHh.',
    'hHHh',
    'hHHh',
    'hHHh',
    '.hHh',
    '..h.',
  ],
  catEars: [
    'h........h',
    'hA......Ah',
  ],
};

const COMMON = { E: '#2a1a3a', W: '#ffffff', B: '#ff9aa8', M: '#c0505e', T: '#ffffff', S: '#ffe3cf', s: '#f3b9a3', L: '#ffe3cf' };

function makeCanvas() {
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
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

/** 캐릭터 상태 → 그릴 포즈 */
function poseOf(f) {
  const p = { body: 0, lean: 0, legs: 'stand', step: 0, arm: 'guard', back: 'down', reach: 0, ky: 0, face: 'normal', lying: false };
  const s = f.state, m = f.move;
  switch (s) {
    case 'idle':
      p.body = Math.floor(f.stateFrame / 24) % 2; // 숨쉬기
      if (f.stateFrame % 150 > 143) p.face = 'blink'; // 깜빡
      break;
    case 'walk':
      p.legs = 'walk';
      p.step = Math.floor(f.stateFrame / 7) % 4;
      p.body = p.step % 2;
      break;
    case 'crouch':
      p.legs = 'crouch';
      p.body = 4;
      break;
    case 'jump':
      p.legs = 'tuck';
      p.arm = 'up';
      p.back = 'up';
      break;
    case 'attack': {
      if (m.crouch) { p.legs = 'crouch'; p.body = 4; }
      if (m.air) p.legs = 'tuck';
      const hb = m.hitbox;
      if (f.attackPhase === 'active') {
        p.face = 'angry';
        p.reach = hb.x + hb.w;
        if (m.pose === 'punch') { p.arm = 'punch'; p.back = 'back'; p.lean = 1; }
        else if (m.pose === 'airKick') { p.legs = 'airkick'; p.ky = hb.y + Math.floor(hb.h / 2) - 1; }
        else { p.legs = 'kick'; p.ky = hb.y + 1; }
      } else {
        p.arm = 'pull';
      }
      break;
    }
    case 'blockstun':
      p.arm = 'block';
      p.face = 'blink';
      p.lean = -1;
      if (f.blockCrouch) { p.legs = 'crouch'; p.body = 4; }
      break;
    case 'hitstun':
      p.arm = 'up';
      p.back = 'up';
      p.lean = -2;
      p.face = 'hurt';
      break;
    case 'knockdown':
      p.lying = true;
      p.face = 'hurt';
      break;
    case 'ko':
      p.lying = true;
      p.face = 'ko';
      break;
  }
  return p;
}

export class ChibiRenderer {
  constructor(look) {
    this.look = look;
    this.colors = { ...COMMON, ...look.colors };
    this.cache = new Map();
  }

  draw(ctx, f) {
    const img = this.get(poseOf(f));
    ctx.save();
    ctx.translate(Math.round(f.x), Math.round(f.y));
    if (f.facing === -1) ctx.scale(-1, 1);
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
    const stand = this.get({ ...pose, lying: false, arm: 'up', back: 'up', legs: 'stand', lean: 0 });
    const c = makeCanvas();
    const g = c.getContext('2d');
    g.translate(OX + 12, OY - 7);
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

    const top = -12 + p.body; // 몸통 윗선
    const sh = top + 1;        // 어깨 높이
    const hx = -6 + p.lean;    // 머리 왼쪽
    const hy = top - 12;       // 머리 위쪽

    // 1) 뒷머리
    for (const a of L.back || []) grid(PARTS[a.part], hx + a.x, hy + a.y);

    // 2) 뒷팔
    if (p.back === 'back') { r(-6, sh, 2, 2, 'o'); r(-7, sh, 1, 2, 's'); }
    else if (p.back === 'up') { r(-5, sh - 2, 2, 2, 'o'); r(-5, sh - 3, 2, 1, 's'); }
    else { r(-5, sh, 2, 2, 'o'); r(-5, sh + 2, 2, 1, 's'); }

    // 3) 다리
    const shoe = (x, y, w = 3) => r(x, y, w, 1, 'K');
    switch (p.legs) {
      case 'stand':
        r(-3, -5, 2, 4, 'L'); r(1, -5, 2, 4, 'L'); shoe(-4, -1); shoe(1, -1);
        break;
      case 'walk': {
        const o = [0, 1, 0, -1][p.step];
        const lb = o > 0 ? 1 : 0, lf = o < 0 ? 1 : 0; // 들린 발
        r(-3 + o, -5, 2, 4 - lb, 'L'); r(1 - o, -5, 2, 4 - lf, 'L');
        shoe(-4 + o, -1 - lb); shoe(1 - o, -1 - lf);
        break;
      }
      case 'crouch':
        r(-4, -2, 2, 1, 'L'); r(2, -2, 2, 1, 'L'); shoe(-5, -1); shoe(2, -1);
        break;
      case 'tuck':
        r(-3, -5, 2, 2, 'L'); r(1, -4, 2, 1, 'L'); shoe(-4, -3); shoe(2, -3);
        break;
      case 'kick':
        r(-4, -2, 2, 1, 'L'); shoe(-5, -1);
        r(2, p.ky, p.reach - 4, 2, 'L'); r(p.reach - 2, p.ky - 1, 2, 3, 'K');
        break;
      case 'airkick':
        r(-3, -5, 2, 2, 'L'); shoe(-4, -3);
        r(1, p.ky, p.reach - 3, 2, 'L'); r(p.reach - 2, p.ky - 1, 2, 3, 'K');
        break;
    }

    // 4) 몸통 + 치마
    r(-3, top, 7, 5, 'O'); r(-3, top, 1, 5, 'o');
    r(-4, top + 4, 9, 2, 'O'); r(-4, top + 4, 2, 2, 'o'); r(-4, top + 5, 9, 1, 'T');
    r(1, top, 2, 1, 'A'); // 리본 타이

    // 5) 머리 + 표정 (눈: 왼쪽 6~7열, 오른쪽 10~11열, 8~9행)
    const plainEyes = p.face !== 'normal' && p.face !== 'angry';
    grid(HEAD, hx, hy, (ch) => (plainEyes && 'EWI'.includes(ch) ? 'S' : ch));
    const e = (x, y) => r(hx + x, hy + y, 1, 1, 'E');
    if (p.face === 'blink') { r(hx + 6, hy + 9, 2, 1, 'E'); r(hx + 10, hy + 9, 2, 1, 'E'); }
    if (p.face === 'hurt') { e(6, 7); e(7, 8); e(6, 9); e(11, 7); e(10, 8); e(11, 9); }
    if (p.face === 'ko') {
      for (const x0 of [5, 10]) { e(x0, 7); e(x0 + 2, 7); e(x0 + 1, 8); e(x0, 9); e(x0 + 2, 9); }
    }
    if (p.face === 'angry' || p.face === 'hurt') r(hx + 9, hy + 10, 1, 2, 'M'); // 벌린 입

    // 6) 머리 장식
    for (const a of L.accessories || []) grid(PARTS[a.part], hx + a.x, hy + a.y);

    // 7) 앞팔
    switch (p.arm) {
      case 'guard': r(2, sh, 2, 2, 'O'); r(4, sh + 1, 2, 2, 'S'); break;
      case 'pull': r(0, sh + 1, 2, 2, 'O'); r(-1, sh + 2, 2, 2, 'S'); break;
      case 'punch':
        r(2, sh, 3, 2, 'O'); r(5, sh, p.reach - 8, 1, 'S'); r(p.reach - 3, sh - 1, 3, 3, 'S');
        break;
      case 'block': r(2, sh, 3, 2, 'O'); r(4, sh - 2, 2, 2, 'S'); r(5, sh, 2, 2, 'S'); break; // 주먹 두 개로 턱 가드
      case 'up': r(1, sh - 2, 2, 2, 'O'); r(1, sh - 3, 2, 1, 'S'); break;
    }

    return withOutline(c, L.outline);
  }
}
