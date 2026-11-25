// 입력. 리듬게임은 "언제 눌렀는지"가 중요해서, 키 이벤트가 발생한 정확한 시각을
// 오디오 시계 기준으로 바꿔서 큐에 쌓아둔다 (프레임 단위로 읽으면 최대 16ms 오차).

export const KEYS = {
  p1: { KeyD: 'light', KeyF: 'heavy' },
  p2: { KeyJ: 'light', KeyK: 'heavy' },
};
const BLOCK = new Set(['F1', 'F2', 'F4', 'Enter', 'Space', 'BracketLeft', 'BracketRight', 'KeyD', 'KeyF', 'KeyJ', 'KeyK']);

let clock = null;      // (performanceTime) => 오디오 시간
let gesture = null;    // 사용자 제스처 콜백 (오디오는 제스처 안에서만 켤 수 있음)
const events = [];
const pressed = new Set();

export function setClock(fn) { clock = fn; }
export function onGesture(fn) { gesture = fn; }

window.addEventListener('keydown', (e) => {
  if (BLOCK.has(e.code)) e.preventDefault();
  if (e.repeat) return;
  if (e.code === 'Enter' && gesture) gesture();
  pressed.add(e.code);
  const t = clock ? clock(e.timeStamp) : null;
  if (t !== null) events.push({ code: e.code, time: t });
});

export function bindClick(el) {
  el.addEventListener('pointerdown', () => {
    if (gesture) gesture();
    pressed.add('Enter');
  });
}

/** 이번 프레임까지 쌓인 키 입력 (오디오 시간 포함) */
export function takeEvents() { return events.splice(0); }
/** 시스템 키가 이번 프레임에 눌렸는지 */
export function wasPressed(code) { return pressed.has(code); }
export function endFrame() { pressed.clear(); }
