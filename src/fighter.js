// 리듬 대전용 캐릭터: 체력, 승수, 현재 애니메이션만 관리 (이동/물리 없음)
import { ChibiRenderer, makePose } from './chibi.js';
import { MAX_HP, GROUND_Y } from './config.js';

export const LUNGE_LEAD = 0.08; // 돌진 시작 → 타격까지 걸리는 시간 (초)
const LUNGE_DIST = 30;

export class Fighter {
  constructor(def, side) {
    this.def = def;
    this.name = def.name;
    this.color = def.look.colors.H;
    this.side = side;
    this.facing = side === 0 ? 1 : -1;
    this.baseX = side === 0 ? 128 : 192;
    this.chibi = new ChibiRenderer(def.look);
    this.wins = 0;
    this.cpu = false;
    this.reset();
  }

  reset() {
    this.hp = MAX_HP;
    this.anim = { pose: 'idle', start: 0, dur: 0, lunge: false };
  }

  /** dur < 0 이면 계속 유지 (KO, 승리) */
  play(pose, now, dur, lunge = false) {
    this.anim = { pose, start: now, dur, lunge };
  }

  currentPose(now) {
    const a = this.anim;
    if (a.dur < 0 || now < a.start + a.dur) return a.pose;
    return 'idle';
  }

  offsetX(now) {
    const a = this.anim, t = now - a.start;
    if (a.lunge) {
      if (t < 0) return 0;
      if (t < LUNGE_LEAD) return (LUNGE_DIST * t) / LUNGE_LEAD;
      if (t < 0.16) return LUNGE_DIST;
      if (t < 0.28) return LUNGE_DIST * (1 - (t - 0.16) / 0.12);
      return 0;
    }
    if (a.pose === 'hit' && t < a.dur) return -5 * (1 - t / a.dur);
    return 0;
  }

  get x() { return this.drawX ?? this.baseX; }

  /** beatFrac: 지금 박자 안에서의 위치(0~1). 박자에 맞춰 몸을 콩콩 */
  draw(ctx, now, beatFrac) {
    const pose = this.currentPose(now);
    const bob = beatFrac < 0.18 ? 1 : 0;
    const blink = (now + this.side * 1.3) % 3.2 < 0.12;
    const x = this.baseX + this.facing * this.offsetX(now);
    this.drawX = x;

    ctx.fillStyle = 'rgba(90,50,110,0.25)';
    ctx.fillRect(Math.round(x) - 8, GROUND_Y - 1, 16, 3);
    ctx.fillRect(Math.round(x) - 10, GROUND_Y, 20, 1);
    this.chibi.draw(ctx, x, GROUND_Y, this.facing, makePose(pose, { bob, blink }));
  }
}
