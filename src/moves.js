// 기술 데이터 (프레임 데이터).
// - 모든 시간 값은 프레임(1/60초) 단위
// - startup: 공격 판정이 나오기까지, active: 판정 유지, recovery: 후딜
// - hitbox: 캐릭터가 "오른쪽을 볼 때" 발 중앙(0,0) 기준 좌표. 위쪽이 음수 y
// - level: 'mid'(서서/앉아서 둘 다 가드 가능) / 'low'(앉아서만 가드) / 'high'(서서만 가드)
// - pose: 임시 그래픽(플레이스홀더)에서 쓸 자세

export const MOVES = {
  standLight: {
    startup: 4, active: 3, recovery: 7,
    damage: 4, hitstun: 12, blockstun: 8, knockback: 1.1, hitstop: 5,
    level: 'mid', hitbox: { x: 4, y: -13, w: 10, h: 5 }, pose: 'punch',
  },
  standHeavy: {
    startup: 9, active: 4, recovery: 16,
    damage: 10, hitstun: 20, blockstun: 14, knockback: 2.6, hitstop: 9,
    level: 'mid', hitbox: { x: 4, y: -13, w: 14, h: 6 }, pose: 'punch', lunge: 1.1,
  },
  crouchLight: {
    startup: 4, active: 3, recovery: 8, crouch: true,
    damage: 3, hitstun: 11, blockstun: 7, knockback: 0.9, hitstop: 5,
    level: 'low', hitbox: { x: 3, y: -4, w: 11, h: 4 }, pose: 'lowKick',
  },
  crouchHeavy: {
    startup: 8, active: 4, recovery: 20, crouch: true,
    damage: 9, hitstun: 22, blockstun: 12, knockback: 2.2, hitstop: 8,
    level: 'low', hitbox: { x: 3, y: -4, w: 15, h: 4 }, pose: 'sweep', knockdown: true,
  },
  airLight: {
    startup: 4, active: 6, recovery: 6, air: true,
    damage: 5, hitstun: 14, blockstun: 9, knockback: 1.1, hitstop: 6,
    level: 'high', hitbox: { x: 2, y: -7, w: 10, h: 6 }, pose: 'airKick',
  },
  airHeavy: {
    startup: 7, active: 5, recovery: 10, air: true,
    damage: 9, hitstun: 18, blockstun: 12, knockback: 1.9, hitstop: 8,
    level: 'high', hitbox: { x: 2, y: -8, w: 14, h: 7 }, pose: 'airKick',
  },
};
