// 캐릭터 정의. 새 캐릭터는 여기에 추가.
// look: 치비 렌더러(src/chibi.js)용 외형 — 팔레트 + 머리 장식 조합
// sprite: 스프라이트 시트 설정을 넣으면 look 대신 그 그림을 사용 (src/sprite.js 참고)
import { MOVES } from './moves.js';

export const CHARACTERS = {
  momo: {
    name: 'MOMO',
    look: {
      outline: '#4a2546',
      colors: {
        H: '#ff9cc6', h: '#e0679f', // 딸기우유 핑크 머리
        I: '#d0457f',               // 눈 색
        O: '#9ee3c2', o: '#62bf9c', // 민트 옷
        A: '#ff5f7e', a: '#c93a5a', // 딸기 레드 포인트
        K: '#ff5f7e',               // 신발
      },
      accessories: [
        { part: 'bun', x: 1, y: -2 },
        { part: 'bun', x: 8, y: -3 },
        { part: 'clip', x: 10, y: 4 },
      ],
    },
    stats: { maxHp: 100, walkSpeed: 1.05, backSpeed: 0.85, jumpVel: -5.2, jumpVx: 1.35 },
    moves: MOVES,
    sprite: null,
  },
  yuki: {
    name: 'YUKI',
    look: {
      outline: '#2c2a55',
      colors: {
        H: '#f2f5ff', h: '#a8b8e8', // 눈처럼 하얀 머리
        I: '#4a7fe0',
        O: '#c2b0f5', o: '#9480d8', // 라벤더 옷
        A: '#7fcfff', a: '#4a96d6', // 하늘색 리본
        K: '#7a6ad0',
      },
      back: [{ part: 'longHair', x: 0, y: 10 }],
      accessories: [{ part: 'ribbon', x: 0, y: -1 }],
    },
    stats: { maxHp: 110, walkSpeed: 0.95, backSpeed: 0.75, jumpVel: -5, jumpVx: 1.25 },
    moves: MOVES,
    sprite: null,
  },

  // ── 퍼블릭 도메인 크로스오버 테스트 캐릭터 ──
  // 이상한 나라의 앨리스 (루이스 캐럴, 1865)
  alice: {
    name: 'ALICE',
    look: {
      outline: '#2a3050',
      colors: {
        H: '#ffe08a', h: '#d9a845', // 금발
        I: '#4a8ad8',
        O: '#8ec8ff', o: '#5c96d8', // 하늘색 원피스
        A: '#2a2a3a', a: '#000000', // 검은 리본
        T: '#ffffff',               // 흰 앞치마 단
        K: '#2a2a3a',
        L: '#ffffff',               // 흰 스타킹
      },
      back: [{ part: 'longHair', x: 0, y: 10 }],
      accessories: [{ part: 'ribbon', x: 3, y: -1 }],
    },
    stats: { maxHp: 95, walkSpeed: 1.1, backSpeed: 0.9, jumpVel: -5.4, jumpVx: 1.4 },
    moves: MOVES,
    sprite: null,
  },
  // 빨간 망토 (유럽 민담 / 페로 1697, 그림 형제 1812)
  hood: {
    name: 'HOOD',
    look: {
      outline: '#3a1a24',
      colors: {
        H: '#e0444e', h: '#a42836', // 빨간 두건
        I: '#7a4a2a',
        O: '#f4ead8', o: '#d4c4a8', // 크림색 블라우스
        A: '#e0444e', a: '#a42836',
        T: '#6a4a3a',
        K: '#6a3a2a',
      },
      back: [{ part: 'longHair', x: 0, y: 10 }], // 망토 자락
    },
    stats: { maxHp: 100, walkSpeed: 1.0, backSpeed: 0.85, jumpVel: -5.1, jumpVx: 1.3 },
    moves: MOVES,
    sprite: null,
  },
  // 손오공 (서유기, 16세기)
  wukong: {
    name: 'WUKONG',
    look: {
      outline: '#3a2418',
      colors: {
        H: '#a8703f', h: '#6e4426', // 갈색 털
        I: '#c89020',
        O: '#f2b43c', o: '#c8862a', // 황금색 옷
        A: '#f7d24a', a: '#d8403c', // 금고아 + 빨간 보석
        T: '#d8403c',
        K: '#4a2a1a',
      },
      back: [{ part: 'tail', x: -5, y: 12 }],
      accessories: [{ part: 'circlet', x: 1, y: 4 }],
    },
    stats: { maxHp: 95, walkSpeed: 1.2, backSpeed: 1.0, jumpVel: -5.6, jumpVx: 1.6 },
    moves: MOVES,
    sprite: null,
  },
};
