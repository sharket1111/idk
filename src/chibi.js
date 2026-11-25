// 치비(2등신) 픽셀 캐릭터를 코드로 그리는 렌더러.
// - 큰 머리 + 큰 눈(얼굴 아래쪽) + 짧은 몸 + 파스텔 팔레트 + 자동 외곽선
// - 포즈마다 64x64 캔버스에 한 번 그려서 캐시 → 실제 스프라이트처럼 빠르게 그림
// - 모든 좌표는 "오른쪽을 볼 때", 발 중앙이 (0,0), 위쪽이 음수

const SIZE = 64;
const OX = 32; // 캔버스 안의 발 위치
const OY = 58;

// 머리 (20x20). 글자 = 팔레트 키, '.' = 투명
// H/h 머리카락(밝음/그림자) S/s 피부 E 눈동자 W 하이라이트 I 홍채 B 볼터치 M 입
const HEAD = [
  '......hhhhhhh.......',
  '....hhHHHHHHHhh.....',
  '...hHHHHHHHHHHHh....',
  '..hHHHHHHHHHHHHHh...',
  '.hHHHHHHHHHHHHHHHh..',
  '.HHHHHHHHHHHHHHHHHh.',
  'hHHHHHHHHHHHHHHHHHHh',
  'hHHHHHHHHHHHHHHHHHHh',
  'hHHHHHHHHSHHHHSHHHHh',
  'hHHHHHHHSSSHHSSSHHSh',
  'hHHHHHHSSSSSSSSSSSSh',
  'hHHHHHSSSSSSSSSSSSSh',
  'hHHHHHSSSSEESSSSEESh',
  'hHHHHsSSSSEWSSSSEWSh',
  'hHHHHsSSSSIISSSSIISh',
  '.HHHHsSSSSIISSSSIIS.',
  '.hHHHsSSSBBSSMSSBBS.',
  '..hHHsSSSSSSSSSSSSs.',
  '...hHssSSSSSSSSSSs..',
  '.....ssssssssssss...',
];

// 머리 장식 / 뒷머리 (캐릭터별로 골라 씀)
export const PARTS = {
  bun: [
    '.hhh..',
    'hHHHh.',
    'hHHHHh',
    'hHHHHh',
    '.hHHh.',
  ],
  clip: ['AA', 'Aa'],
  ribbon: [
    'AAA...AAA',
    'AAaA.AaAA',
    'AAAAaAAAA',
    'AAaA.AaAA',
    'AAA...AAA',
  ],
  longHair: [
    'hHHh.',
    'hHHh.',
    'hHHHh',
    'hHHHh',
    'hHHHh',
    '.hHHh',
    '.hHh.',
    '..h..',
  ],
  catEars: [
    'h.........h',
    'hh.......hh',
    'hAh.....hAh',
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
      p.body = 6;
      break;
    case 'jump':
      p.legs = 'tuck';
      p.arm = 'up';
      p.back = 'up';
      break;
    case 'attack': {
      if (m.crouch) { p.legs = 'crouch'; p.body = 6; }
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
      if (f.blockCrouch) { p.legs = 'crouch'; p.body = 6; }
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
    g.translate(OX + 17, OY - 9);
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

    const top = -17 + p.body; // 몸통 윗선
    const sh = top + 2;        // 어깨 높이
    const hx = -9 + p.lean;    // 머리 왼쪽
    const hy = top - 18;       // 머리 위쪽

    // 1) 뒷머리
    for (const a of L.back || []) grid(PARTS[a.part], hx + a.x, hy + a.y);

    // 2) 뒷팔
    if (p.back === 'back') { r(-8, sh, 3, 3, 'o'); r(-9, sh + 1, 2, 2, 's'); }
    else if (p.back === 'up') { r(-8, sh - 2, 3, 3, 'o'); r(-8, sh - 4, 3, 2, 's'); }
    else { r(-7, sh, 3, 3, 'o'); r(-7, sh + 3, 3, 2, 's'); }

    // 3) 다리
    const shoe = (x, y, w = 4) => r(x, y, w, 2, 'K');
    switch (p.legs) {
      case 'stand':
        r(-4, -8, 3, 7, 'L'); r(1, -8, 3, 7, 'L'); shoe(-5, -2); shoe(1, -2, 5);
        break;
      case 'walk': {
        const o = [0, 1, 0, -1][p.step];
        r(-4 + o, -8, 3, 7 - Math.max(0, o), 'L'); r(1 - o, -8, 3, 7 - Math.max(0, -o), 'L');
        shoe(-5 + o, -2 - Math.max(0, o)); shoe(1 - o, -2 - Math.max(0, -o), 5);
        break;
      }
      case 'crouch':
        r(-6, -4, 4, 3, 'L'); r(2, -4, 4, 3, 'L'); shoe(-7, -2); shoe(3, -2, 5);
        break;
      case 'tuck':
        r(-4, -8, 3, 4, 'L'); r(1, -7, 3, 3, 'L'); shoe(-5, -5); shoe(2, -5);
        break;
      case 'kick':
        r(-6, -4, 4, 3, 'L'); shoe(-7, -2);
        r(2, p.ky, p.reach - 6, 3, 'L'); r(p.reach - 4, p.ky - 1, 4, 4, 'K');
        break;
      case 'airkick':
        r(-4, -8, 3, 4, 'L'); shoe(-5, -5);
        r(1, p.ky, p.reach - 5, 3, 'L'); r(p.reach - 4, p.ky - 1, 4, 4, 'K');
        break;
    }

    // 4) 몸통 + 치마
    r(-5, top, 10, 7, 'O'); r(-5, top, 2, 7, 'o');
    r(-6, top + 6, 12, 3, 'O'); r(-6, top + 6, 3, 3, 'o'); r(-6, top + 8, 12, 1, 'T');
    r(1, top, 3, 2, 'A'); r(2, top + 2, 1, 1, 'a'); // 리본 타이

    // 5) 머리 + 표정
    const plainEyes = p.face !== 'normal' && p.face !== 'angry';
    grid(HEAD, hx, hy, (ch) => (plainEyes && 'EWI'.includes(ch) ? 'S' : ch));
    const e = (x, y) => r(hx + x, hy + y, 1, 1, 'E');
    if (p.face === 'blink') { r(hx + 10, hy + 14, 2, 1, 'E'); r(hx + 16, hy + 14, 2, 1, 'E'); }
    if (p.face === 'hurt') { e(10, 12); e(11, 13); e(10, 14); e(17, 12); e(16, 13); e(17, 14); }
    if (p.face === 'ko') {
      for (const x0 of [10, 16]) { e(x0, 12); e(x0 + 2, 12); e(x0 + 1, 13); e(x0, 14); e(x0 + 2, 14); }
    }
    if (p.face === 'angry' || p.face === 'hurt') r(hx + 13, hy + 16, 2, 2, 'M'); // 벌린 입

    // 6) 머리 장식
    for (const a of L.accessories || []) grid(PARTS[a.part], hx + a.x, hy + a.y);

    // 7) 앞팔
    switch (p.arm) {
      case 'guard': r(3, sh, 3, 3, 'O'); r(5, sh + 2, 3, 3, 'S'); break;
      case 'pull': r(0, sh + 1, 3, 3, 'O'); r(-1, sh + 3, 3, 3, 'S'); break;
      case 'punch':
        r(3, sh, 4, 3, 'O'); r(7, sh + 1, p.reach - 11, 2, 'S'); r(p.reach - 4, sh - 1, 4, 4, 'S');
        break;
      case 'block': r(3, sh, 4, 3, 'O'); r(5, sh - 2, 3, 3, 'S'); r(7, sh, 3, 3, 'S'); break; // 주먹 두 개로 턱 가드
      case 'up': r(1, sh - 2, 3, 3, 'O'); r(1, sh - 4, 3, 2, 'S'); break;
    }

    return withOutline(c, L.outline);
  }
}
