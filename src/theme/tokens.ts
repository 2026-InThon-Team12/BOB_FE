/**
 * 디자인 토큰 — 디자인 시안 적용 지점 1.
 * 값은 디자인 시안 `Buy or Bye (BoB).html`에서 뽑았다.
 *
 * - `palette`는 원시 색상값이다. 이 파일 밖에서는 직접 쓰지 않는다.
 * - 앱 코드는 의미 기반 이름(`color.text.primary`, `space[4]` …)만 사용한다.
 */

const palette = {
  white: '#FFFFFF',
  black: '#000000',
  // 시안 회색 계열
  gray50: '#F2F4F7', // 화면 배경
  gray100: '#EEF1F5', // 이미지 자리, 보조 배경
  gray150: '#E6EAF0', // 진행 바 트랙
  gray200: '#DCE1E8', // 테두리
  gray300: '#B5BCC7', // 예측 막대
  gray400: '#9AA1AD', // 비활성 텍스트
  gray500: '#646B78', // 보조 텍스트
  gray600: '#4B5262', // 본문 보조
  gray700: '#3A404C',
  gray900: '#15181E', // 본문, 어두운 카드
  gray950: '#0C0E12',
  // 브랜드 (Buy)
  blue50: '#EBF1FF',
  blue100: '#DCE6FF',
  blue400: '#5B82F0',
  blue500: '#2556E0',
  blue600: '#1D45B8',
  blue950: '#121C38',
  // 주의 · Bye
  orange50: '#FFF0E6',
  orange200: '#FFB088',
  orange600: '#C4440F',
  orange700: '#9A3409',
  orange800: '#7A2A07',
  orange950: '#3A1A0A',
  red50: '#FDECEC',
  red200: '#F5C2C0',
  red700: '#B42318',
  switchOff: '#C9CED8',
  gold: '#F2B33D',
  shelfBg: '#BCC2CC',
  shelfWall: '#AAB1BC',
  shelfPlank: '#E4E7EC',
  shelfStamp: '#45484F',
  green500: '#16A36A',
  green50: '#E6F6EE',
  green950: '#0E2A1E',
} as const;

const lightColor = {
  bg: {
    canvas: palette.gray50,
    surface: palette.white,
    subtle: palette.gray100,
    /** 리포트 "이번 달 발견" 같은 어두운 강조 카드 */
    inverse: palette.gray900,
  },
  text: {
    primary: palette.gray900,
    secondary: palette.gray600,
    tertiary: palette.gray500,
    disabled: palette.gray400,
    inverse: palette.white,
    brand: palette.blue500,
    success: palette.green500,
    warning: palette.orange600,
    danger: palette.orange600,
    /** 어두운 카드 위 강조 숫자 (예: 4.5배) */
    highlightOnInverse: palette.orange200,
    alert: palette.red700,
  },
  border: {
    default: palette.gray200,
    strong: palette.gray300,
    focus: palette.blue500,
  },
  brand: {
    solid: palette.blue500,
    pressed: palette.blue600,
    subtle: palette.blue50,
    /** 선택된 칩·카드 테두리 */
    subtleBorder: palette.blue100,
    onSolid: palette.white,
    /** 파란 바탕 위 반투명 흰색 (배지) */
    onSolidSubtle: 'rgba(255,255,255,0.18)',
  },
  /** "Bye" 버튼, 함정·주의 안내 */
  warning: { solid: palette.orange600, pressed: palette.orange700, subtle: palette.orange50, onSubtle: palette.orange800 },
  success: { solid: palette.green500, subtle: palette.green50 },
  danger: { solid: palette.orange600, subtle: palette.orange50 },
  /** 필수 경고 (명세서: 사용자 행동을 막는 경고에만 — "같은 쇼핑몰" 안내) */
  alert: { text: palette.red700, subtle: palette.red50, border: palette.red200 },
  switchOff: palette.switchOff,
  /** 일러스트(동전·선물·색종이) 전용 */
  gold: palette.gold,
  /** 스와이프 "딱히 없었어요" 오버레이 (명세서 #3A404C) */
  swipeNo: palette.gray700,
  /** 목표 진열장 */
  shelf: { bg: palette.shelfBg, wall: palette.shelfWall, plank: palette.shelfPlank, stamp: palette.shelfStamp },
  track: palette.gray150,
  /** 예측 vs 실제 막대의 "예측" */
  predicted: palette.gray300,
  overlay: 'rgba(21,24,30,0.4)',
  frame: { backdrop: palette.gray200 },
};

/** 리터럴 색상값을 string으로 넓혀 라이트/다크가 같은 구조를 공유하게 한다 */
type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
export type ColorTokens = Widen<typeof lightColor>;

/** 시안에는 다크 모드가 없다 — 라이트 시안을 기준으로 만든 임시 값 */
const darkColor: ColorTokens = {
  bg: {
    canvas: palette.gray950,
    surface: palette.gray900,
    subtle: palette.gray700,
    inverse: palette.gray50,
  },
  text: {
    primary: palette.gray50,
    secondary: palette.gray300,
    tertiary: palette.gray400,
    disabled: palette.gray500,
    inverse: palette.gray900,
    brand: palette.blue400,
    success: palette.green500,
    warning: palette.orange200,
    danger: palette.orange200,
    highlightOnInverse: palette.orange600,
    alert: palette.red200,
  },
  border: {
    default: palette.gray700,
    strong: palette.gray600,
    focus: palette.blue400,
  },
  brand: {
    solid: palette.blue500,
    pressed: palette.blue600,
    subtle: palette.blue950,
    subtleBorder: palette.blue600,
    onSolid: palette.white,
    onSolidSubtle: 'rgba(255,255,255,0.18)',
  },
  warning: { solid: palette.orange600, pressed: palette.orange700, subtle: palette.orange950, onSubtle: palette.orange200 },
  success: { solid: palette.green500, subtle: palette.green950 },
  danger: { solid: palette.orange600, subtle: palette.orange950 },
  alert: { text: palette.red200, subtle: palette.red700, border: palette.red700 },
  switchOff: palette.gray600,
  gold: palette.gold,
  swipeNo: palette.gray600,
  shelf: { bg: palette.gray700, wall: palette.gray600, plank: palette.gray500, stamp: palette.gray950 },
  track: palette.gray700,
  predicted: palette.gray500,
  overlay: 'rgba(0,0,0,0.6)',
  frame: { backdrop: palette.black },
};

/** 4px 단위 간격. 키 숫자 × 4 = px (시안: 화면 좌우 20, 카드 안 20, 요소 간 8·12·16) */
export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;
export type SpaceKey = keyof typeof space;

/** 시안: 카드 20, 큰 버튼 16, 입력·작은 카드 12~14, 썸네일 8~12, 칩·배지 999 */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;
export type RadiusKey = keyof typeof radius;

/** 글꼴은 app/_layout.tsx에서 로드한다. 커스텀 글꼴은 굵기별로 family 이름이 다르다 */
export const font = {
  family: {
    regular: 'IBMPlexSansKR_400Regular' as string | undefined,
    medium: 'IBMPlexSansKR_500Medium' as string | undefined,
    semibold: 'IBMPlexSansKR_600SemiBold' as string | undefined,
    bold: 'IBMPlexSansKR_700Bold' as string | undefined,
  },
};

/** 시안 글자 크기: 44·36(큰 숫자) / 22(화면 제목) / 17(카드 제목) / 15(본문) / 13·12(보조) */
export const typography = {
  hero: { fontSize: 36, lineHeight: 44, fontWeight: '700' },
  display: { fontSize: 30, lineHeight: 38, fontWeight: '700' },
  title: { fontSize: 22, lineHeight: 30, fontWeight: '700' },
  heading: { fontSize: 17, lineHeight: 24, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
} as const;
export type TypographyVariant = keyof typeof typography;

export const elevation = {
  /** 시안의 기본 카드는 그림자 없음 */
  card: {},
  /** 떠 있는 카드 (오늘의 질문 카드 스택) */
  float: {
    shadowColor: palette.gray900,
    shadowOpacity: 0.14,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  raised: {
    shadowColor: palette.gray900,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  frame: {
    shadowColor: palette.black,
    shadowOpacity: 0.18,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 12 },
    elevation: 0,
  },
} as const;

export const layout = {
  /** 웹 데모 PhoneFrame 폭 / 높이 (시안 기준 390 × 844) */
  frameWidth: 390,
  frameMaxHeight: 844,
  /** 이 폭보다 넓으면 PhoneFrame을 보여준다 */
  frameBreakpoint: 600,
  hitSlop: 8,
  iconSize: { sm: 16, md: 20, lg: 24, xl: 32 },
  /** 물품 썸네일 */
  thumbnail: { sm: 48, md: 56 },
} as const;

export const motion = {
  pressedOpacity: 0.7,
  disabledOpacity: 0.4,
} as const;

export const themes = {
  light: { scheme: 'light' as const, color: lightColor as ColorTokens },
  dark: { scheme: 'dark' as const, color: darkColor },
};

export type ThemeScheme = keyof typeof themes;
