// 키보드 입력 처리. 컨트롤러는 "행동 이름(left, light...)" 단위로 입력을 제공해서
// 키보드든 CPU든 게임패드든 Fighter 입장에서는 똑같이 다룰 수 있게 한다.

export const KEYMAPS = {
  p1: { left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS', light: 'KeyJ', heavy: 'KeyK' },
  p2: { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', light: 'Comma', heavy: 'Period' },
};

const SYSTEM_KEYS = ['F1', 'F2', 'F3', 'F4', 'Enter', 'Space'];
const down = new Set();        // 현재 눌려 있는 키
const justDown = new Set();    // 이번 업데이트에서 새로 눌린 키 (시스템 키용)
const blocked = new Set([...SYSTEM_KEYS, ...Object.values(KEYMAPS.p1), ...Object.values(KEYMAPS.p2)]);

window.addEventListener('keydown', (e) => {
  if (blocked.has(e.code)) e.preventDefault(); // 방향키 스크롤, F1 도움말 등 막기
  if (!e.repeat) justDown.add(e.code);
  down.add(e.code);
});
window.addEventListener('keyup', (e) => down.delete(e.code));
window.addEventListener('blur', () => down.clear());

/** 시스템 키(F1, Enter 등)가 이번 프레임에 눌렸는지 */
export function wasPressed(code) {
  return justDown.has(code);
}
/** 매 업데이트 끝에 호출 */
export function endFrame() {
  justDown.clear();
}

/** 모든 컨트롤러의 공통 인터페이스 */
export class Controller {
  constructor() {
    this.cur = {};
    this.prev = {};
    this.history = []; // 최근 입력 기록 (나중에 커맨드 기술 ↓↘→+P 판정에 사용)
  }
  commit(state) {
    this.prev = this.cur;
    this.cur = state;
    this.history.push(state);
    if (this.history.length > 30) this.history.shift();
  }
  held(action) { return !!this.cur[action]; }
  pressed(action) { return !!this.cur[action] && !this.prev[action]; }
}

export class KeyboardController extends Controller {
  constructor(map) {
    super();
    this.map = map;
  }
  update() {
    const state = {};
    for (const action in this.map) state[action] = down.has(this.map[action]);
    this.commit(state);
  }
}

/** 아주 단순한 CPU. 테스트용 연습 상대 */
export class AIController extends Controller {
  constructor() {
    super();
    this.plan = {};
    this.think = 0;
  }
  update(self, opp) {
    if (--this.think <= 0) {
      this.decide(self, opp);
      this.think = 6 + Math.floor(Math.random() * 14);
    }
    this.commit({ ...this.plan });
    // 공격 버튼은 한 프레임만 누르고 떼기 (pressed 판정이 되도록)
    delete this.plan.light;
    delete this.plan.heavy;
  }
  decide(self, opp) {
    const dist = Math.abs(opp.x - self.x);
    const toward = opp.x > self.x ? 'right' : 'left';
    const away = toward === 'right' ? 'left' : 'right';
    const r = Math.random();
    this.plan = {};
    if (opp.state === 'attack' && dist < 70 && r < 0.6) {
      this.plan[away] = true; // 가드
      if (opp.move && opp.move.level === 'low') this.plan.down = true;
    } else if (dist > 48) {
      this.plan[toward] = true;
      if (r < 0.06) this.plan.up = true;
    } else if (r < 0.35) this.plan.light = true;
    else if (r < 0.55) this.plan.heavy = true;
    else if (r < 0.7) { this.plan.down = true; this.plan.light = true; }
    else if (r < 0.8) { this.plan.down = true; this.plan.heavy = true; }
    else this.plan[away] = true;
  }
}
