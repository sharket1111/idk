// 공격 패턴(채보) 생성. 한 마디 = 8분음표 8칸. '1' = 노트, '.' = 쉼
const SHAPES = [
  ['1.1.1.1.', '1...1.1.', '1.1.1...', '1.1...1.', '1...1...'],          // 0: 정박
  ['1.1.111.', '1.11.1..', '11..1.1.', '1.1.1.11', '1..11...'],          // 1: 8분 섞기
  ['1.11.11.', '11.1.11.', '1..11.11', '.11.1.11', '11.11...'],          // 2: 엇박
  ['11.11.11', '1.111.11', '111.1.11', '11111.1.', '1.1.1111'],          // 3: 빽빽
];

/** @returns [{ step: 0~7, type: 'light' | 'heavy' }] */
export function makePattern(level) {
  const lv = Math.max(0, Math.min(level, SHAPES.length - 1));
  const shape = SHAPES[lv][Math.floor(Math.random() * SHAPES[lv].length)];
  const heavyChance = 0.25 + lv * 0.08;
  const notes = [];
  for (let i = 0; i < 8; i++) {
    if (shape[i] === '1') notes.push({ step: i, type: Math.random() < heavyChance ? 'heavy' : 'light' });
  }
  return notes;
}

/** CPU의 판정을 미리 굴려둔다 */
export function rollGrade(skill = 0.5) {
  const r = Math.random();
  if (r < 0.2 + skill * 0.3) return 'perfect';
  if (r < 0.5 + skill * 0.25) return 'great';
  if (r < 0.8 + skill * 0.1) return 'good';
  return 'miss';
}
