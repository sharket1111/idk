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
};
