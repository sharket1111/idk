// 캐릭터 1명의 상태 머신 + 물리 + 판정 박스.
//
// 상태 목록
//   idle / walk / crouch : 지상에서 자유롭게 행동 가능
//   jump                 : 공중 (공중 공격 1회 가능)
//   attack               : 기술 사용 중 (startup → active → recovery)
//   hitstun / blockstun  : 맞았거나 가드해서 경직
//   knockdown            : 다운 (무적)
//   ko                   : 패배
import { GRAVITY, GROUND_Y, FRICTION } from './config.js';
import { SpriteSheet } from './sprite.js';

const NULL_INPUT = { held: () => false, pressed: () => false };
const DEFAULT_STATS = { maxHp: 100, walkSpeed: 1.5, backSpeed: 1.2, jumpVel: -5.2, jumpVx: 1.35 };
const STAND_H = 28;
const CROUCH_H = 21;
const KNOCKDOWN_FRAMES = 60;

export class Fighter {
  constructor(def, controller) {
    this.def = def;
    this.name = def.name;
    this.palette = def.palette;
    this.stats = { ...DEFAULT_STATS, ...def.stats };
    this.moves = def.moves;
    this.controller = controller;
    this.sprite = def.sprite ? new SpriteSheet(def.sprite) : null;
    this.width = 13;
    this.wins = 0;
    this.reset(0, 1);
  }

  reset(x, facing) {
    this.x = x;
    this.y = GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.hp = this.stats.maxHp;
    this.move = null;
    this.moveId = null;
    this.moveHit = false;
    this.airMoveUsed = false;
    this.stun = 0;
    this.lastInput = NULL_INPUT;
    this.state = 'idle';
    this.stateFrame = 0;
  }

  setState(s) {
    this.state = s;
    this.stateFrame = 0;
  }
  /** 같은 상태면 프레임 카운트를 유지 (걷기 애니메이션 등) */
  enter(s) {
    if (this.state !== s) this.setState(s);
  }

  get onGround() { return this.y >= GROUND_Y && this.vy >= 0; }
  get isCrouching() {
    return this.state === 'crouch'
      || (this.state === 'attack' && this.move.crouch)
      || (this.state === 'blockstun' && this.blockCrouch);
  }
  /** 스프라이트 애니메이션 이름 */
  get animName() { return this.state === 'attack' ? this.moveId : this.state; }
  /** 'startup' | 'active' | 'recovery' */
  get attackPhase() {
    if (this.state !== 'attack') return null;
    const m = this.move, f = this.stateFrame;
    if (f < m.startup) return 'startup';
    if (f < m.startup + m.active) return 'active';
    return 'recovery';
  }

  // ───────────────────────── 업데이트 ─────────────────────────
  update(opponent, canAct) {
    const input = canAct ? this.controller : NULL_INPUT;
    this.lastInput = input;

    switch (this.state) {
      case 'idle':
      case 'walk':
      case 'crouch':
        this.facing = opponent.x >= this.x ? 1 : -1; // 지상에서는 항상 상대를 바라봄
        this.updateGrounded(input);
        break;
      case 'jump':
        this.updateJump(input);
        break;
      case 'attack':
        this.updateAttack();
        break;
      case 'hitstun':
      case 'blockstun':
        if (--this.stun <= 0 && this.onGround) this.setState('idle');
        break;
      case 'knockdown':
        if (this.stateFrame >= KNOCKDOWN_FRAMES && this.onGround) this.setState('idle');
        break;
      case 'ko':
        break;
    }

    this.applyPhysics();
    this.stateFrame++;
  }

  updateGrounded(input) {
    const crouching = input.held('down');
    if (input.pressed('light')) return this.startAttack(crouching ? 'crouchLight' : 'standLight');
    if (input.pressed('heavy')) return this.startAttack(crouching ? 'crouchHeavy' : 'standHeavy');

    const dir = (input.held('right') ? 1 : 0) - (input.held('left') ? 1 : 0);
    if (input.held('up')) {
      this.vx = dir * this.stats.jumpVx;
      this.vy = this.stats.jumpVel;
      this.airMoveUsed = false;
      return this.setState('jump');
    }
    if (crouching) {
      this.vx = 0;
      return this.enter('crouch');
    }
    if (dir !== 0) {
      this.vx = dir * (dir === this.facing ? this.stats.walkSpeed : this.stats.backSpeed);
      return this.enter('walk');
    }
    this.vx = 0;
    this.enter('idle');
  }

  updateJump(input) {
    if (this.airMoveUsed) return;
    if (input.pressed('light')) { this.airMoveUsed = true; this.startAttack('airLight'); }
    else if (input.pressed('heavy')) { this.airMoveUsed = true; this.startAttack('airHeavy'); }
  }

  startAttack(id) {
    this.moveId = id;
    this.move = this.moves[id];
    this.moveHit = false;
    if (!this.move.air) this.vx = 0;
    this.setState('attack');
  }

  updateAttack() {
    const m = this.move;
    const f = this.stateFrame;
    if (!m.air) {
      // 강공격 등은 판정이 나올 때까지 살짝 앞으로 전진
      this.vx = m.lunge && f < m.startup + m.active ? this.facing * m.lunge : 0;
    }
    if (f >= m.startup + m.active + m.recovery) {
      const crouch = m.crouch;
      this.move = null;
      if (m.air && !this.onGround) this.setState('jump');
      else this.setState(crouch ? 'crouch' : 'idle');
    }
  }

  applyPhysics() {
    if (this.y < GROUND_Y || this.vy < 0) this.vy += GRAVITY;
    this.x += this.vx;
    this.y += this.vy;

    if (this.y >= GROUND_Y) {
      const landing = this.vy > 0;
      this.y = GROUND_Y;
      this.vy = 0;
      if (landing) this.onLand();
    }
    const sliding = ['hitstun', 'blockstun', 'knockdown', 'ko'].includes(this.state);
    if (this.onGround && sliding) this.vx *= FRICTION;
  }

  onLand() {
    if (this.state === 'jump' || (this.state === 'attack' && this.move.air)) {
      this.move = null;
      this.vx = 0;
      this.setState('idle');
    }
  }

  // ───────────────────────── 판정 ─────────────────────────
  /** 맞는 판정 (월드 좌표). 다운/KO 중엔 무적 */
  getHurtbox() {
    if (this.state === 'knockdown' || this.state === 'ko') return null;
    const h = this.isCrouching ? CROUCH_H : STAND_H;
    return { x: this.x - this.width / 2, y: this.y - h, w: this.width, h };
  }

  /** 공격 판정 (월드 좌표). active 프레임에만, 한 기술당 1회 히트 */
  getHitbox() {
    if (this.attackPhase !== 'active' || this.moveHit) return null;
    const hb = this.move.hitbox;
    const x = this.facing === 1 ? this.x + hb.x : this.x - hb.x - hb.w;
    return { x, y: this.y + hb.y, w: hb.w, h: hb.h };
  }

  /** 상대 반대 방향을 누르고 있고, 기술 높이에 맞는 자세면 가드 성공 */
  canBlock(move) {
    if (!['idle', 'walk', 'crouch', 'blockstun'].includes(this.state) || !this.onGround) return false;
    const back = this.facing === 1 ? 'left' : 'right';
    if (!this.lastInput.held(back)) return false;
    const crouch = this.lastInput.held('down');
    if (move.level === 'low' && !crouch) return false;
    if (move.level === 'high' && crouch) return false;
    this.blockCrouch = crouch;
    return true;
  }

  /** @returns 'block' | 'hit' | 'ko' */
  receiveHit(move, dir, blocked) {
    this.move = null;
    if (blocked) {
      this.stun = move.blockstun;
      this.vx = dir * move.knockback * 0.6;
      this.setState('blockstun');
      return 'block';
    }
    this.hp = Math.max(0, this.hp - move.damage);
    if (this.hp === 0) {
      this.vx = dir * 1.9;
      this.vy = -3.2;
      this.setState('ko');
      return 'ko';
    }
    if (move.knockdown || !this.onGround) {
      this.vx = dir * 1.5;
      this.vy = -2.8;
      this.setState('knockdown');
      return 'hit';
    }
    this.stun = move.hitstun;
    this.vx = dir * move.knockback;
    this.setState('hitstun');
    return 'hit';
  }
}
