// 게임 전체 상수. 값을 바꿔가며 난이도와 손맛을 조절하세요.

export const SCREEN_W = 320;      // 내부 해상도 (픽셀아트 기준)
export const SCREEN_H = 180;
export const STAGE_W = 320;
export const GROUND_Y = 118;      // 캐릭터 발 위치

// ── 리듬 ──
export const BPM = 120;
export const BEAT = 60 / BPM;     // 1박 (초)
export const BAR = BEAT * 4;      // 1마디
export const STEP = BEAT / 2;     // 노트 간격 = 8분음표
export const SCROLL_SPEED = 120;  // 노트가 흐르는 속도 (px/초)

// 판정 범위 (초, ±)
export const WINDOWS = { perfect: 0.045, great: 0.09, good: 0.135 };

// ── 전투 ──
export const MAX_HP = 100;
export const ROUNDS_TO_WIN = 2;
export const DAMAGE = { light: 5, heavy: 8 };                            // 펀치 / 킥 기본 피해
export const GRADE_POWER = { perfect: 1, great: 0.8, good: 0.6, miss: 0 }; // 공격 정확도 → 위력
export const GUARD_TAKEN = { perfect: 0, great: 0.25, good: 0.5, miss: 1 }; // 방어 정확도 → 받는 피해 비율
