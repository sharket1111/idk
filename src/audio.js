// Web Audio로 음악과 효과음을 직접 합성한다 (음원 파일 없음 → 저작권 걱정 없음).
// 게임의 "시계"도 여기서 나온다: 노트 시간 = 오디오 컨텍스트 시간.
import { BEAT } from './config.js';

// F - C - Dm - Bb 코드 진행 (MIDI 근음)
const PROG = [{ root: 53 }, { root: 48 }, { root: 50, minor: true }, { root: 46 }];
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.timer = null;
  }
  get ready() { return !!this.ctx; }

  /** 반드시 사용자 입력(키/클릭) 이벤트 안에서 호출 */
  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      const c = (this.ctx = new AC({ latencyHint: 'interactive' }));
      this.master = c.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(c.destination);
      this.music = c.createGain();
      this.music.gain.value = 0.55;
      this.music.connect(this.master);
      this.fx = c.createGain();
      this.fx.gain.value = 0.9;
      this.fx.connect(this.master);
      this.noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  /** 지금 스피커에서 "들리고 있는" 소리의 오디오 시간. 화면 표시와 판정은 이 시간 기준 */
  heardTime(perf = performance.now()) {
    const c = this.ctx;
    const ts = c.getOutputTimestamp ? c.getOutputTimestamp() : null;
    if (ts && ts.contextTime > 0 && ts.performanceTime > 0) {
      return ts.contextTime + (perf - ts.performanceTime) / 1000;
    }
    const latency = c.outputLatency || c.baseLatency || 0;
    return c.currentTime - latency + (perf - performance.now()) / 1000;
  }

  // ───────────── 음악 (미리 예약하는 스케줄러) ─────────────
  startMusic(at) {
    this.stopMusic();
    this.songStart = at;
    this.step = 0;
    this.timer = setInterval(() => this.schedule(), 25);
    this.schedule();
  }
  stopMusic() {
    clearInterval(this.timer);
    this.timer = null;
  }
  schedule() {
    const s16 = BEAT / 4;
    while (this.songStart + this.step * s16 < this.ctx.currentTime + 0.15) {
      const t = this.songStart + this.step * s16;
      if (t >= this.ctx.currentTime - 0.01) this.playStep(this.step, t);
      this.step++;
    }
  }
  playStep(i, t) {
    const s = i % 16, bar = Math.floor(i / 16), ch = PROG[bar % 4];
    const tones = [0, ch.minor ? 3 : 4, 7];
    const s16 = BEAT / 4;
    if (s === 0 || s === 8 || (s === 10 && bar % 2 === 1)) this.kick(t);
    if (s === 4 || s === 12) this.snare(t);
    if (s % 2 === 0) this.hat(t, s % 4 === 2 ? 0.12 : 0.06);
    if (s % 4 === 0 || s === 6 || s === 14) this.bass(t, mtof(ch.root - 12 + (s === 6 || s === 14 ? 12 : 0)), s16 * 1.6);
    if (s % 2 === 0) {
      const k = [0, 1, 2, 1, 0, 2, 1, 2][s / 2];
      this.bell(t, mtof(ch.root + 12 + tones[k] + (bar % 2 ? 12 : 0)), 0.08);
    }
  }

  // ───────────── 악기 ─────────────
  tone(type, f0, f1, t, dur, vol, dest) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
  noiseHit(t, dur, vol, filterType, freq, dest) {
    const c = this.ctx, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = this.noise;
    f.type = filterType;
    f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(dest);
    src.start(t);
    src.stop(t + dur + 0.02);
  }
  kick(t) { this.tone('sine', 150, 40, t, 0.15, 0.9, this.music); }
  snare(t) { this.noiseHit(t, 0.12, 0.35, 'highpass', 1500, this.music); this.tone('triangle', 220, 180, t, 0.07, 0.2, this.music); }
  hat(t, v) { this.noiseHit(t, 0.04, v, 'highpass', 7000, this.music); }
  bass(t, f, dur) { this.tone('triangle', f, null, t, dur, 0.35, this.music); }
  bell(t, f, v) { this.tone('triangle', f, null, t, 0.22, v, this.music); this.tone('sine', f * 2, null, t, 0.12, v * 0.5, this.music); }

  /** 효과음. t를 주면 그 오디오 시간에 정확히 재생 */
  sfx(name, t = this.ctx.currentTime) {
    const o = this.fx;
    switch (name) {
      case 'light': this.tone('square', 660, 1100, t, 0.06, 0.18, o); this.noiseHit(t, 0.03, 0.2, 'highpass', 3000, o); break;
      case 'heavy': this.tone('sine', 200, 60, t, 0.14, 0.7, o); this.noiseHit(t, 0.05, 0.3, 'lowpass', 2000, o); break;
      case 'hit': this.noiseHit(t, 0.12, 0.5, 'lowpass', 1400, o); this.tone('square', 240, 110, t, 0.08, 0.15, o); break;
      case 'guard': this.tone('triangle', 1320, null, t, 0.08, 0.3, o); this.tone('triangle', 1980, null, t, 0.06, 0.15, o); break;
      case 'parry': this.tone('triangle', 1568, null, t, 0.2, 0.3, o); this.tone('sine', 2093, null, t + 0.05, 0.2, 0.25, o); break;
      case 'miss': this.tone('sawtooth', 110, 90, t, 0.1, 0.12, o); break;
      case 'tick': this.tone('sine', 1760, null, t, 0.04, 0.3, o); break;
      case 'go': this.tone('square', 880, null, t, 0.15, 0.15, o); this.tone('square', 1320, null, t, 0.15, 0.12, o); break;
      case 'ko': this.tone('square', 440, 55, t, 0.7, 0.25, o); this.noiseHit(t, 0.4, 0.4, 'lowpass', 800, o); break;
    }
  }
}
