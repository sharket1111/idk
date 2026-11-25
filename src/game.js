// 게임 전체 흐름: 라운드 진행, 충돌/타격 판정, 카메라, 그리기
import { SCREEN_W, SCREEN_H, STAGE_W, SCREEN_MARGIN, ROUND_TIME, ROUNDS_TO_WIN, FPS } from './config.js';
import { KEYMAPS, KeyboardController, AIController, wasPressed, endFrame } from './input.js';
import { Fighter } from './fighter.js';
import { CHARACTERS } from './characters.js';
import { drawFighter, drawDebug } from './render-fighter.js';
import { Stage } from './stage.js';
import { Effects } from './effects.js';
import { HUD, drawText } from './hud.js';

const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

class Camera {
  constructor() { this.x = 0; this.shakeT = 0; this.mag = 0; this.ox = 0; this.oy = 0; }
  follow(a, b) {
    this.x = clamp((a.x + b.x) / 2 - SCREEN_W / 2, 0, STAGE_W - SCREEN_W);
  }
  shake(mag, frames) { this.mag = mag; this.shakeT = frames; }
  update() {
    if (this.shakeT > 0) {
      this.shakeT--;
      this.ox = Math.round((Math.random() * 2 - 1) * this.mag);
      this.oy = Math.round((Math.random() * 2 - 1) * this.mag);
    } else {
      this.ox = this.oy = 0;
    }
  }
}

export class Game {
  constructor(ctx) {
    this.ctx = ctx;
    this.debug = false;
    this.p2Keyboard = new KeyboardController(KEYMAPS.p2);
    this.p2AI = new AIController();
    this.p1 = new Fighter(CHARACTERS.momo, new KeyboardController(KEYMAPS.p1));
    this.p2 = new Fighter(CHARACTERS.yuki, this.p2AI); // 기본은 CPU (F1로 2인용 전환)
    this.stage = new Stage();
    this.camera = new Camera();
    this.effects = new Effects();
    this.hud = new HUD();
    this.startMatch();
  }

  startMatch() {
    this.p1.wins = this.p2.wins = 0;
    this.roundNum = 1;
    this.startRound();
  }

  startRound() {
    const mid = STAGE_W / 2;
    this.p1.reset(mid - 38, 1);
    this.p2.reset(mid + 38, -1);
    this.timer = ROUND_TIME * FPS;
    this.hitstop = 0;
    this.effects.clear();
    this.hud.reset(this.p1, this.p2);
    this.camera.follow(this.p1, this.p2);
    this.setPhase('intro');
  }

  setPhase(p) {
    this.phase = p;
    this.phaseFrame = 0;
    this.subMessage = '';
  }

  // ───────────────────────── 업데이트 (1/60초마다) ─────────────────────────
  update() {
    if (wasPressed('F3')) this.debug = !this.debug;
    if (wasPressed('F1')) this.p2.controller = this.p2.controller === this.p2AI ? this.p2Keyboard : this.p2AI;

    this.p1.controller.update(this.p1, this.p2);
    this.p2.controller.update(this.p2, this.p1);
    this.updatePhase();

    const canAct = this.phase === 'fight';
    if (this.hitstop > 0) {
      this.hitstop--; // 타격 순간 잠깐 멈춤 → 타격감
    } else {
      this.p1.update(this.p2, canAct);
      this.p2.update(this.p1, canAct);
      this.resolvePush();
      if (this.phase === 'fight') this.resolveHits();
      this.effects.update();
    }

    this.camera.follow(this.p1, this.p2);
    this.camera.update();
    this.clampToScreen();
    this.hud.update(this.p1, this.p2);
    endFrame();
  }

  updatePhase() {
    this.phaseFrame++;
    switch (this.phase) {
      case 'intro':
        this.message = this.phaseFrame < 70 ? `ROUND ${this.roundNum}` : 'FIGHT!';
        if (this.phaseFrame >= 100) { this.message = ''; this.setPhase('fight'); }
        break;
      case 'fight':
        if (--this.timer <= 0) {
          this.timer = 0;
          const { p1, p2 } = this;
          this.endRound(p1.hp === p2.hp ? null : p1.hp > p2.hp ? p1 : p2, 'TIME');
        }
        break;
      case 'roundEnd':
        if (this.phaseFrame >= 150) {
          const champ = [this.p1, this.p2].find((p) => p.wins >= ROUNDS_TO_WIN);
          if (champ) {
            this.setPhase('matchEnd');
            this.message = `${champ.name} WINS!`;
            this.subMessage = 'PRESS ENTER';
          } else {
            this.roundNum++;
            this.startRound();
          }
        }
        break;
      case 'matchEnd':
        this.subMessage = 'PRESS ENTER';
        if (wasPressed('Enter')) this.startMatch();
        break;
    }
  }

  endRound(winner, reason) {
    if (winner) winner.wins++;
    this.message = winner ? reason : reason === 'TIME' ? 'DRAW' : 'DOUBLE K.O.';
    this.setPhase('roundEnd');
  }

  /** 공격 판정 검사. 양쪽 동시에 맞으면 상쇄(트레이드)도 가능하도록 먼저 모두 수집 후 적용 */
  resolveHits() {
    const hits = [];
    for (const [att, def] of [[this.p1, this.p2], [this.p2, this.p1]]) {
      const hb = att.getHitbox();
      const hurt = def.getHurtbox();
      if (hb && hurt && overlap(hb, hurt)) hits.push({ att, def, move: att.move, hb, hurt });
    }
    let ko = false;
    for (const { att, def, move, hb, hurt } of hits) {
      att.moveHit = true;
      const blocked = def.canBlock(move);
      const result = def.receiveHit(move, att.facing, blocked);
      // 스파크 위치 = 두 박스가 겹치는 영역 중앙
      const cx = (Math.max(hb.x, hurt.x) + Math.min(hb.x + hb.w, hurt.x + hurt.w)) / 2;
      const cy = (Math.max(hb.y, hurt.y) + Math.min(hb.y + hb.h, hurt.y + hurt.h)) / 2;
      this.effects.spawn(cx, cy, blocked ? 'block' : 'hit');
      this.hitstop = Math.max(this.hitstop, blocked ? move.hitstop - 2 : move.hitstop);
      if (!blocked) this.camera.shake(move.damage >= 8 ? 2 : 1, move.hitstop);
      if (result === 'ko') ko = true;
    }
    if (ko) {
      this.hitstop = 40; // KO 순간 슬로우
      this.camera.shake(3, 30);
      const alive = [this.p1, this.p2].filter((p) => p.hp > 0);
      this.endRound(alive.length === 1 ? alive[0] : null, 'K.O.');
    }
  }

  /** 두 캐릭터 몸이 겹치지 않게 밀어냄 */
  resolvePush() {
    const { p1: a, p2: b } = this;
    if (a.state === 'ko' || b.state === 'ko') return;
    const vertical = a.y - 24 < b.y && b.y - 24 < a.y; // 높이 차가 크면(점프로 넘어감) 통과
    if (!vertical) return;
    const min = (a.width + b.width) / 2;
    const dx = b.x - a.x;
    const over = min - Math.abs(dx);
    if (over <= 0) return;
    const s = dx === 0 ? a.facing : Math.sign(dx);
    a.x -= (s * over) / 2;
    b.x += (s * over) / 2;
  }

  /** 스테이지 끝 / 화면 밖으로 못 나가게 */
  clampToScreen() {
    const lo = Math.max(0, this.camera.x) + SCREEN_MARGIN;
    const hi = Math.min(STAGE_W, this.camera.x + SCREEN_W) - SCREEN_MARGIN;
    for (const p of [this.p1, this.p2]) p.x = clamp(p.x, lo, hi);
  }

  // ───────────────────────── 그리기 ─────────────────────────
  render() {
    const ctx = this.ctx;
    const camX = Math.round(this.camera.x) + this.camera.ox;
    this.stage.draw(ctx, camX);

    ctx.save();
    ctx.translate(-camX, this.camera.oy);
    // 공격 중인 캐릭터를 위에 그림
    const order = this.p1.state === 'attack' ? [this.p2, this.p1] : [this.p1, this.p2];
    for (const f of order) drawFighter(ctx, f);
    this.effects.draw(ctx);
    if (this.debug) for (const f of order) drawDebug(ctx, f);
    ctx.restore();

    this.hud.draw(ctx, this);

    if (this.debug) {
      const info = (f) => `${f.state}${f.moveId && f.state === 'attack' ? ':' + f.moveId : ''} ${f.stateFrame}`;
      drawText(ctx, info(this.p1), 4, SCREEN_H - 20, { size: 8, color: '#3cdc6e' });
      drawText(ctx, info(this.p2), SCREEN_W - 4, SCREEN_H - 30, { size: 8, align: 'right', color: '#3cdc6e' });
    }
    drawText(ctx, this.p2.controller === this.p2AI ? 'P2:CPU' : 'P2:HUMAN', SCREEN_W - 4, SCREEN_H - 10, { size: 8, align: 'right', color: '#7a5a86' });
  }
}
