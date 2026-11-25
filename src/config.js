// 게임 전체에서 쓰는 상수. 값을 바꿔가며 손맛을 조절하세요.

export const SCREEN_W = 384;      // 내부 해상도 (픽셀아트 기준 해상도)
export const SCREEN_H = 216;
export const STAGE_W = 768;       // 스테이지 전체 가로 길이 (화면보다 넓어서 카메라가 따라감)
export const GROUND_Y = 192;      // 바닥 높이 (캐릭터 발 위치)

export const FPS = 60;            // 고정 업데이트 주기. 모든 프레임 데이터는 1/60초 단위
export const GRAVITY = 0.45;
export const FRICTION = 0.85;     // 피격/가드 중 넉백이 줄어드는 비율
export const SCREEN_MARGIN = 16;  // 캐릭터가 화면 끝에 붙을 수 있는 최소 거리

export const ROUND_TIME = 99;     // 초
export const ROUNDS_TO_WIN = 2;   // 2선승제
