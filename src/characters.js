// 캐릭터 정의. 새 캐릭터는 여기에 추가.
// sprite 에 스프라이트 시트 설정을 넣으면 임시 그래픽 대신 그 그림을 사용한다 (src/sprite.js 참고).
import { MOVES } from './moves.js';

export const CHARACTERS = {
  blaze: {
    name: 'BLAZE',
    palette: { skin: '#f2c79b', main: '#c8443c', dark: '#5a2a3a', hair: '#3a2418', accent: '#f5d061', outline: '#1a1020' },
    stats: { maxHp: 100, walkSpeed: 1.6, backSpeed: 1.2, jumpVel: -8, jumpVx: 2.2 },
    moves: MOVES,
    sprite: null,
  },
  frost: {
    name: 'FROST',
    palette: { skin: '#e8b98f', main: '#3c6fc8', dark: '#232c5a', hair: '#e8e8f0', accent: '#8ee6f0', outline: '#0e1424' },
    stats: { maxHp: 110, walkSpeed: 1.4, backSpeed: 1.1, jumpVel: -7.6, jumpVx: 2 },
    moves: MOVES,
    sprite: null,
  },
};
