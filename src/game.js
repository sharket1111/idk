// 게임 흐름: 타이틀 → 대전(라운드) → 결과
//
// 대전 규칙 (2마디 = 1턴)
//   공격 마디: 공격자가 노트에 맞춰 펀치/킥 → 정확도만큼 공격이 "장전"된다
//   방어 마디: 장전된 공격이 같은 리듬으로 날아옴 → 방어자가 같은 버튼으로 막는다
//   턴마다 공격/방어가 바뀌고, 2턴마다 패턴이 어려워진다
import {
  SCREEN_W, SCREEN_H, BEAT, BAR, STEP, WINDOWS, DAMAGE, GRADE_POWER, GUARD_TAKEN, ROUNDS_TO_WIN, GROUND_Y,
} from './config.js';
import { KEYS, setClock, onGesture, takeEvents, wasPressed, endFrame } from './input.js';
import { AudioEngine } from './audio.js';
import { makePattern, rollGrade } from './chart.js';
import { Fighter, LUNGE_LEAD } from './fighter.js';
import { CHARACTERS } from './characters.js';
import { Stage } from './stage.js';
import { Effects } from './effects.js';
import { HUD, drawText } from './hud.js';
import { drawTrack, TRACK } from './track.js';

const GRADE_TEXT = { perfect: 'PERFECT', great: 'GREAT', good: 'GOOD', miss: 'MISS' };
const GRADE_COLOR = { perfect: '#ffe27a', great: '#ff9cc6', good: '#8ee8b8', miss: '#b8a8c8' };

function loadCalib() {
  try { return Number(localStorage.getItem('rb.calib')) || 0; } catch { return 0; }
}
function saveCalib(v) {
  try { localStorage.setItem('rb.calib', String(v)); } catch {}
}

export class Game {
  constructor(ctx) {
    this.ctx = ctx;
    this.audio = new AudioEngine();
    setClock((perf) => (this.audio.ready ? this.audio.heardTime(perf) : null));
    onGesture(() => this.audio.init());

    this.roster = Object.keys(CHARACTERS);
    this.pick = [0, 1];
    this.p2cpu = true;
    this.calib = loadCalib(); // ms. +면 판정을 늦게 (입력이 늦게 찍히는 환경)
    this.stage = new Stage();
    this.effects = new Effects();
    this.hud = new HUD();
    this.popups = [];
    this.shakeUntil = 0;
    this.songStart = 0;
    this.makeFighters();
    this.scene = 'title';
  }

  makeFighters() {
    this.p1 = new Fighter(CHARACTERS[this.roster[this.pick[0]]], 0);
    this.p2 = new Fighter(CHARACTERS[this.roster[this.pick[1]]], 1);
    this.p2.cpu = this.p2cpu;
  }

  get now() {
    return this.audio.ready ? this.audio.heardTime() : performance.now() / 1000;
  }
  barTime(b) { return this.songStart + b * BAR; }
  barAt(t) { return Math.floor((t - this.songStart) / BAR); }
  beatFrac(t) {
    const x = (t - this.songStart) / BEAT;
    return x - Math.floor(x);
  }

  // ───────────────────────── 업데이트 ─────────────────────────
  update() {
    const now = this.now;
    if (wasPressed('BracketLeft')) this.setCalib(this.calib - 5);
    if (wasPressed('BracketRight')) this.setCalib(this.calib + 5);

    if (this.scene === 'title') this.updateTitle();
    else if (this.scene === 'battle') this.updateBattle(now);
    else if (this.scene === 'result') {
      takeEvents();
      if (wasPressed('Enter')) {
        this.audio.stopMusic();
        this.scene = 'title';
      }
    }

    this.effects.update();
    this.hud.update(this.p1, this.p2);
    this.popups = this.popups.filter((p) => now - p.t0 < 0.7);
    endFrame();
  }

  setCalib(v) {
    this.calib = Math.max(-200, Math.min(200, v));
    saveCalib(this.calib);
  }

  updateTitle() {
    takeEvents();
    if (wasPressed('F2')) { this.pick[0] = (this.pick[0] + 1) % this.roster.length; this.makeFighters(); }
    if (wasPressed('F4')) { this.pick[1] = (this.pick[1] + 1) % this.roster.length; this.makeFighters(); }
    if (wasPressed('F1')) { this.p2cpu = !this.p2cpu; this.p2.cpu = this.p2cpu; }
    if (wasPressed('Enter') && this.audio.ready) this.startMatch();
  }

  startMatch() {
    this.makeFighters();
    this.roundNum = 1;
    this.songStart = this.audio.ctx.currentTime + 0.3;
    this.audio.startMusic(this.songStart);
    this.scene = 'battle';
    this.startRound(0);
  }

  /** bar 마디부터 라운드 시작: 1마디 "ROUND N", 1마디 카운트다운, 그다음부터 턴 */
  startRound(bar) {
    this.roundBar = bar;
    this.turnBar = bar + 2;
    this.phrases = new Map();
    this.p1.reset();
    this.p2.reset();
    this.hud.reset();
    this.phase = 'intro';
    for (let i = 0; i < 4; i++) this.audio.sfx(i < 3 ? 'tick' : 'go', this.barTime(bar + 1) + i * BEAT);
  }

  /** pair번째 턴 (공격 마디 + 방어 마디) */
  getPhrase(pair) {
    if (pair < 0) return null;
    let ph = this.phrases.get(pair);
    if (!ph) {
      const p1First = (pair + this.roundNum - 1) % 2 === 0;
      const attacker = p1First ? this.p1 : this.p2;
      const defender = p1First ? this.p2 : this.p1;
      const callBar = this.turnBar + pair * 2;
      const callStart = this.barTime(callBar);
      const respStart = this.barTime(callBar + 1);
      const notes = makePattern(Math.floor(pair / 2)).map((n) => ({
        ...n,
        callTime: callStart + n.step * STEP,
        respTime: respStart + n.step * STEP,
        call: null, resp: null, armed: false, launched: false,
        cpuCall: rollGrade(0.5), cpuResp: rollGrade(0.5),
      }));
      ph = { pair, attacker, defender, callBar, notes };
      this.phrases.set(pair, ph);
    }
    return ph;
  }

  currentPair(now) { return Math.floor((this.barAt(now) - this.turnBar) / 2); }

  visiblePhrases() {
    if (this.scene !== 'battle' || this.phase === 'ko') return [];
    const p = Math.max(0, this.currentPair(this.now));
    return [p - 1, p, p + 1].map((i) => this.getPhrase(i)).filter(Boolean);
  }

  /** 트랙 마디선 위에 쓸 라벨 */
  barInfo(bar) {
    if (this.scene !== 'battle' || this.phase === 'ko') return null;
    const b = bar - this.turnBar;
    if (b < 0) return null;
    const ph = this.getPhrase(Math.floor(b / 2));
    const f = b % 2 === 0 ? ph.attacker : ph.defender;
    return { label: `${f.side === 0 ? 'P1' : 'P2'} ${b % 2 === 0 ? 'ATK' : 'DEF'}`, color: f.color };
  }

  /** 지금 입력해야 하는 사람 */
  activeActor(now) {
    if (this.scene !== 'battle' || this.phase !== 'fight') return null;
    const b = this.barAt(now) - this.turnBar;
    if (b < 0) return null;
    const ph = this.getPhrase(Math.floor(b / 2));
    return b % 2 === 0 ? ph.attacker : ph.defender;
  }

  keyLabels(f) {
    if (f.cpu) return ['-', '-'];
    if (f.side === 0) return this.p2.cpu ? ['D/J', 'F/K'] : ['D', 'F'];
    return ['J', 'K'];
  }

  /** 키 → (누구, 펀치/킥). P2가 CPU면 J/K도 P1이 쓸 수 있음 */
  actorOf(code) {
    if (KEYS.p1[code]) return { f: this.p1, type: KEYS.p1[code] };
    if (KEYS.p2[code]) return { f: this.p2.cpu ? this.p1 : this.p2, type: KEYS.p2[code] };
    return null;
  }

  updateBattle(now) {
    const events = takeEvents();
    if (this.phase === 'intro') {
      if (now >= this.barTime(this.turnBar) - WINDOWS.good) this.phase = 'fight';
    }
    if (this.phase === 'fight') {
      this.handleInputs(events);
      this.processNotes(now);
    }
    if (this.phase === 'ko' && now >= this.koUntil) {
      if (this.p1.wins >= ROUNDS_TO_WIN || this.p2.wins >= ROUNDS_TO_WIN) {
        this.scene = 'result';
      } else {
        this.roundNum++;
        this.startRound(this.barAt(now) + 1);
      }
    }
  }

  handleInputs(events) {
    const phrases = this.visiblePhrases();
    for (const ev of events) {
      const who = this.actorOf(ev.code);
      if (!who || who.f.cpu) continue;
      const t = ev.time - this.calib / 1000;
      let best = null;
      const consider = (ph, n, kind, time) => {
        const d = Math.abs(t - time);
        if (d <= WINDOWS.good && (!best || d < best.d)) best = { ph, n, kind, d };
      };
      for (const ph of phrases) {
        for (const n of ph.notes) {
          if (ph.attacker === who.f && n.call === null) consider(ph, n, 'call', n.callTime);
          if (ph.defender === who.f && n.armed && n.resp === null) consider(ph, n, 'resp', n.respTime);
        }
      }
      if (!best) continue; // 노트 없는 곳 입력은 무시
      const wrong = best.n.type !== who.type;
      const grade = wrong ? 'miss' : best.d <= WINDOWS.perfect ? 'perfect' : best.d <= WINDOWS.great ? 'great' : 'good';
      if (best.kind === 'call') this.judgeCall(best.ph, best.n, grade, wrong);
      else this.judgeResp(best.ph, best.n, grade, wrong);
      if (this.phase !== 'fight') return;
    }
  }

  processNotes(now) {
    for (const ph of this.visiblePhrases()) {
      for (const n of ph.notes) {
        if (n.call === null) {
          if (ph.attacker.cpu && now >= n.callTime) this.judgeCall(ph, n, n.cpuCall, false);
          else if (now > n.callTime + WINDOWS.good) this.judgeCall(ph, n, 'miss', false);
        }
        if (n.armed && n.resp === null) {
          if (!n.launched && now >= n.respTime - LUNGE_LEAD) {
            ph.attacker.play(n.type === 'light' ? 'punch' : 'kick', now, 0.22, true);
            n.launched = true;
          }
          if (ph.defender.cpu && now >= n.respTime) this.judgeResp(ph, n, n.cpuResp, false);
          else if (now > n.respTime + WINDOWS.good) this.judgeResp(ph, n, 'miss', false);
        }
        if (this.phase !== 'fight') return;
      }
    }
  }

  /** 공격 마디 판정: 성공하면 그 노트가 장전됨 */
  judgeCall(ph, n, grade, wrong) {
    const now = this.now;
    n.call = grade;
    n.armed = grade !== 'miss';
    const f = ph.attacker;
    if (n.armed) {
      f.play(n.type === 'light' ? 'punch' : 'kick', now, 0.14);
      this.audio.sfx(n.type);
    } else {
      this.audio.sfx('miss');
    }
    this.popup(f, wrong ? 'WRONG' : GRADE_TEXT[grade], wrong ? '#ff6b6b' : GRADE_COLOR[grade]);
  }

  /** 방어 마디 판정: 피해 계산 */
  judgeResp(ph, n, grade, wrong) {
    const now = this.now;
    n.resp = grade;
    const def = ph.defender;
    const dmg = Math.round(DAMAGE[n.type] * GRADE_POWER[n.call] * GUARD_TAKEN[grade]);
    const hx = def.baseX - def.facing * 8;
    const hy = GROUND_Y - (n.type === 'light' ? 22 : 8);
    if (grade === 'miss') {
      def.play('hit', now, 0.3);
      this.audio.sfx('hit');
      this.effects.spawn(hx, hy, 'hit');
      this.shakeUntil = now + 0.12;
    } else {
      def.play(n.type === 'light' ? 'guardHigh' : 'guardLow', now, 0.2);
      this.audio.sfx(grade === 'perfect' ? 'parry' : 'guard');
      this.effects.spawn(hx, hy, 'block');
    }
    def.hp = Math.max(0, def.hp - dmg);
    if (wrong) this.popup(def, 'WRONG', '#ff6b6b');
    else if (grade === 'perfect') this.popup(def, 'PARRY!', '#8ee6ff');
    else this.popup(def, GRADE_TEXT[grade], GRADE_COLOR[grade]);
    if (dmg > 0) this.popup(def, `-${dmg}`, '#ff5f7e', 10);
    if (def.hp === 0) this.ko(ph.attacker, def, now);
  }

  ko(winner, loser, now) {
    this.phase = 'ko';
    winner.wins++;
    loser.play('ko', now, -1);
    winner.play('win', now + 0.4, -1);
    this.audio.sfx('ko');
    this.shakeUntil = now + 0.4;
    this.koUntil = now + 3;
  }

  popup(f, text, color, dy = 0) {
    this.popups.push({ text, color, x: f.baseX, y: GROUND_Y - 54 + dy, t0: this.now });
  }

  // ───────────────────────── 그리기 ─────────────────────────
  render() {
    const ctx = this.ctx;
    const now = this.now;
    const beat = this.scene === 'title' ? (now / BEAT) % 1 : this.beatFrac(now);

    ctx.save();
    if (now < this.shakeUntil) ctx.translate(Math.round(Math.random() * 4 - 2), Math.round(Math.random() * 2 - 1));
    this.stage.draw(ctx, 0);
    this.p1.draw(ctx, now, beat);
    this.p2.draw(ctx, now, beat);
    this.effects.draw(ctx);
    ctx.restore();

    if (this.scene === 'title') return this.renderTitle(now);

    this.hud.draw(ctx, this.p1, this.p2, beat);
    for (const p of this.popups) {
      const t = now - p.t0;
      drawText(ctx, p.text, p.x, Math.round(p.y - t * 20), { align: 'center', color: p.color });
    }
    drawTrack(ctx, this, now);

    // 가운데 큰 메시지
    let msg = '', sub = '';
    if (this.scene === 'battle' && this.phase === 'intro') {
      const b = this.barAt(now) - this.roundBar;
      if (b <= 0) msg = `ROUND ${this.roundNum}`;
      else {
        const k = Math.floor((now - this.barTime(this.roundBar + 1)) / BEAT);
        msg = ['3', '2', '1', 'GO!'][Math.max(0, Math.min(3, k))];
      }
    } else if (this.scene === 'battle' && this.phase === 'ko') msg = 'K.O.!';
    else if (this.scene === 'result') {
      msg = `${(this.p1.wins > this.p2.wins ? this.p1 : this.p2).name} WINS!`;
      sub = 'PRESS ENTER';
    }
    if (msg) drawText(ctx, msg, SCREEN_W / 2, 44, { size: 16, align: 'center', color: '#fff4c8' });
    if (sub && Math.floor(now * 2) % 2 === 0) drawText(ctx, sub, SCREEN_W / 2, 64, { align: 'center' });
  }

  renderTitle(now) {
    const ctx = this.ctx;
    drawText(ctx, 'RHYTHM', SCREEN_W / 2, 26, { size: 16, align: 'center', color: '#ff9cc6' });
    drawText(ctx, 'BRAWL', SCREEN_W / 2, 46, { size: 16, align: 'center', color: '#8ee6ff' });
    drawText(ctx, this.p1.name, this.p1.baseX, 124, { align: 'center', color: this.p1.color });
    drawText(ctx, this.p2.name, this.p2.baseX, 124, { align: 'center', color: this.p2.color });
    drawText(ctx, 'VS', SCREEN_W / 2, 96, { align: 'center', color: '#fff4c8' });
    drawText(ctx, this.p2.cpu ? 'CPU' : '2P', this.p2.baseX, 136, { align: 'center', color: '#fff' });
    drawText(ctx, 'F2/F4:CHARA  F1:CPU', SCREEN_W / 2, 150, { align: 'center' });
    drawText(ctx, `[ ]:SYNC ${this.calib >= 0 ? '+' : ''}${this.calib}MS`, SCREEN_W / 2, 160, { align: 'center' });
    if (Math.floor(now * 2) % 2 === 0) drawText(ctx, 'PRESS ENTER', SCREEN_W / 2, 70, { align: 'center', color: '#fff4c8' });
  }
}
