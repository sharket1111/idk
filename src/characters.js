// 캐릭터 정의. 새 캐릭터는 여기에 추가.
// look: 치비 렌더러(src/chibi.js)용 외형 — 팔레트 + 머리 장식 조합
//   H/h 머리, I/J 눈(진/연), O/o 옷, A/a 포인트 색, K 신발, T 칼라/프릴, L 다리
//   accessories: 머리 위에 그릴 장식, back: 몸 뒤에 그릴 것 (x, y는 머리 왼쪽 위 기준)

export const CHARACTERS = {
  momo: {
    name: 'MOMO',
    look: {
      outline: '#4a2546',
      colors: {
        H: '#ff9cc6', h: '#d9649a', I: '#d0457f', J: '#ffb3d1',
        O: '#9ee3c2', o: '#62bf9c', A: '#ff5f7e', a: '#c93a5a', K: '#ff5f7e',
      },
      accessories: [
        { part: 'bun', x: 1, y: -4 },
        { part: 'bun', x: 14, y: -5 },
        { part: 'clip', x: 17, y: 7 },
      ],
    },
  },
  yuki: {
    name: 'YUKI',
    look: {
      outline: '#2c2a55',
      colors: {
        H: '#f2f5ff', h: '#a8b8e8', I: '#4a7fe0', J: '#a8d0ff',
        O: '#c2b0f5', o: '#9480d8', A: '#7fcfff', a: '#4a96d6', K: '#7a6ad0',
      },
      back: [{ part: 'longHair', x: 0, y: 15 }],
      accessories: [{ part: 'ribbon', x: 0, y: -2 }],
    },
  },
  // ── 퍼블릭 도메인 캐릭터 ──
  // 이상한 나라의 앨리스 (루이스 캐럴, 1865)
  alice: {
    name: 'ALICE',
    look: {
      outline: '#2a3050',
      colors: {
        H: '#ffe08a', h: '#d9a845', I: '#4a8ad8', J: '#a8d8ff',
        O: '#8ec8ff', o: '#5c96d8', A: '#2a2a3a', a: '#000000', K: '#2a2a3a', L: '#ffffff',
      },
      back: [{ part: 'longHair', x: 0, y: 15 }],
      accessories: [{ part: 'ribbon', x: 6, y: -2 }],
    },
  },
  // 빨간 망토 (유럽 민담)
  hood: {
    name: 'HOOD',
    look: {
      outline: '#3a1a24',
      colors: {
        H: '#e0444e', h: '#a42836', I: '#7a4a2a', J: '#d8a070',
        O: '#f4ead8', o: '#d4c4a8', A: '#e0444e', a: '#a42836', T: '#e0444e', K: '#6a3a2a',
      },
      back: [{ part: 'longHair', x: 0, y: 15 }],
    },
  },
  // 손오공 (서유기, 16세기)
  wukong: {
    name: 'WUKONG',
    look: {
      outline: '#3a2418',
      colors: {
        H: '#a8703f', h: '#6e4426', I: '#c89020', J: '#ffe08a',
        O: '#f2b43c', o: '#c8862a', A: '#f7d24a', a: '#d8403c', T: '#d8403c', K: '#4a2a1a',
      },
      back: [{ part: 'tail', x: -3, y: 22 }],
      accessories: [{ part: 'circlet', x: 2, y: 7 }],
    },
  },
};
