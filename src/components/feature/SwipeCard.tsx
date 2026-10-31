import { useEffect, useImperativeHandle, useRef, useState, type ComponentRef, type ReactNode, type Ref } from 'react';
import { AccessibilityInfo, Animated, Easing, PanResponder, Platform, View } from 'react-native';

import { Icon, Stack, Text, type IconName } from '@/components/ui';
import { makeStyles, useTheme } from '@/theme';

export type SwipeDirection = 'right' | 'left' | 'up';

export type SwipeCardHandle = {
  /** 버튼으로 답할 때도 같은 날아가는 애니메이션을 쓴다 */
  swipe: (direction: SwipeDirection) => void;
  reset: () => void;
};

/** 명세서 4.5 제스처 수치 */
export const SWIPE = {
  /** 판정 임계값 (세로는 |dy| > |dx| 이고 dy < −90) */
  threshold: 90,
  /** 회전 = dx / 14 deg */
  rotateDivisor: 14,
  /** 오버레이 불투명도 = clamp((거리 − 20) / 70, 0, 1) */
  fadeStart: 20,
  fadeRange: 70,
  /** 원위치·비행 0.28s */
  durationMs: 280,
  fling: { x: 560, y: 900 },
} as const;

const useNativeDriver = Platform.OS !== 'web';
const isWeb = Platform.OS === 'web';

/** 모션 줄이기 설정이면 카드 비행·되돌림을 즉시 처리한다 (명세서 8장) */
let reduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled()
  .then((v) => (reduceMotion = v))
  .catch(() => {});
AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v) => (reduceMotion = v));

/** 방향별 끈 정도 0~1 (오버레이 불투명도 · 버튼 확대 · 뒤 카드에 공통) */
export function swipeStrength(pos: Animated.ValueXY, direction: SwipeDirection) {
  const { fadeStart, fadeRange } = SWIPE;
  const input = [fadeStart, fadeStart + fadeRange];
  if (direction === 'right') return pos.x.interpolate({ inputRange: input, outputRange: [0, 1], extrapolate: 'clamp' });
  if (direction === 'left')
    return pos.x.interpolate({ inputRange: [-input[1], -input[0]], outputRange: [1, 0], extrapolate: 'clamp' });
  return pos.y.interpolate({ inputRange: [-input[1], -input[0]], outputRange: [1, 0], extrapolate: 'clamp' });
}

/** 판정 방향 (임계 미만이면 null) */
export function swipeDirection(dx: number, dy: number): SwipeDirection | null {
  const t = SWIPE.threshold;
  if (Math.abs(dy) > Math.abs(dx) && dy < -t) return 'up';
  if (dx > t) return 'right';
  if (dx < -t) return 'left';
  return null;
}

/** 카드 하나의 제스처 상태 (React 바깥의 일반 객체 — 처리기 안에서만 읽고 쓴다) */
function createSwipeController(pos: Animated.ValueXY) {
  let busy = false;
  let onSwipe: (direction: SwipeDirection) => void = () => {};
  const timing = () => ({ duration: reduceMotion ? 0 : SWIPE.durationMs, easing: Easing.out(Easing.ease), useNativeDriver });

  const fling = (direction: SwipeDirection) => {
    if (busy) return;
    busy = true;
    const { fling: f } = SWIPE;
    const to = direction === 'up' ? { x: 0, y: -f.y } : { x: direction === 'right' ? f.x : -f.x, y: 0 };
    Animated.timing(pos, { toValue: to, ...timing() }).start(() => onSwipe(direction));
  };
  /** 새로 끌기 시작하면 아직 돌아가는 중인 되돌림 애니메이션을 멈춘다 — 안 멈추면 끄는 위치를 덮어쓴다 */
  const grab = () => pos.stopAnimation();
  const reset = () => {busy = false; Animated.timing(pos, { toValue: { x: 0, y: 0 }, ...timing() }).start();};
  const move = (dx: number, dy: number) => pos.setValue({ x: dx, y: Math.min(dy, 40) });
  const release = (dx: number, dy: number) => {
    const dir = swipeDirection(dx, dy);
    if (dir) fling(dir);
    else reset();
  };
  const responder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
    onPanResponderGrant: grab,
    onPanResponderMove: (_, g) => move(g.dx, g.dy),
    onPanResponderRelease: (_, g) => release(g.dx, g.dy),
    onPanResponderTerminate: reset,
  });

  return {
    fling,
    reset,
    grab,
    move,
    release,
    responder,
    isBusy: () => busy,
    setOnSwipe: (fn: (direction: SwipeDirection) => void) => {
      onSwipe = fn;
    },
  };
}

type Overlay = { label: string; icon: IconName; color: string };

type Props = {
  children: ReactNode;
  onSwipe: (direction: SwipeDirection) => void;
  /** 끄는 위치 — 화면이 갖고 있어서 뒤 카드·답 버튼도 같이 반응한다. 카드가 바뀌면 0으로 돌아간다 */
  position: Animated.ValueXY;
  /** 방향별 오버레이 (명세서: 있었어요 buy · 없었어요 진회색 · 모르겠어요 bye) */
  overlays: Record<SwipeDirection, Overlay>;
  ref?: Ref<SwipeCardHandle>;
};

const useStyles = makeStyles((t) => ({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: t.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayIcon: {
    width: 72,
    height: 72,
    borderRadius: t.radius.pill,
    backgroundColor: t.color.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

/**
 * 스와이프로 답하는 카드 (→ 있었어요 · ← 딱히 없었어요 · ↑ 잘 모르겠어요).
 * - 네이티브: React Native PanResponder
 * - 웹: DOM 포인터 이벤트 (마우스·터치·펜 공통). RN Web의 PanResponder는 마우스로 한 번 조작한 뒤
 *   새로 그려진 카드의 드래그를 받지 못해서 웹은 직접 처리한다.
 * 다음 카드는 부모가 key를 바꿔 새로 그린다.
 */
export function SwipeCard({ children, onSwipe, position, overlays, ref }: Props) {
  const styles = useStyles();
  const theme = useTheme();
  const [gesture] = useState(() => createSwipeController(position));
  const nodeRef = useRef<ComponentRef<typeof View>>(null);

  // 새 카드는 제자리에서 시작
  useEffect(() => position.setValue({ x: 0, y: 0 }), [position]);
  useEffect(() => gesture.setOnSwipe(onSwipe), [gesture, onSwipe]);
  useImperativeHandle(ref, () => ({ swipe: gesture.fling, reset: gesture.reset }), [gesture]);

  // 웹: 포인터 이벤트로 직접 끌기 처리
  useEffect(() => {
    if (!isWeb) return;
    const el = nodeRef.current as unknown as HTMLElement | null;
    if (!el) return;
    el.style.touchAction = 'none'; // 모바일 브라우저에서 끄는 동안 화면이 스크롤되지 않게
    el.style.cursor = 'grab';
    // 끌면서 글자가 선택되면 다음 끌기를 브라우저가 '선택한 글자 끌어 옮기기'로 보고 pointercancel을 보낸다
    el.style.userSelect = 'none';
    el.style.setProperty('-webkit-user-select', 'none');
    let start: { x: number; y: number; id: number } | null = null;

    const onDown = (e: PointerEvent) => {
      if (gesture.isBusy()) return;
      e.preventDefault(); // 글자 선택·이미지 끌기 같은 브라우저 기본 동작 막기
      gesture.grab();
      start = { x: e.clientX, y: e.clientY, id: e.pointerId };
      el.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (start && e.pointerId === start.id) gesture.move(e.clientX - start.x, e.clientY - start.y);
    };
    const onUp = (e: PointerEvent) => {
      if (!start || e.pointerId !== start.id) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      start = null;
      gesture.release(dx, dy);
    };
    const onCancel = () => {
      start = null;
      gesture.reset();
    };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onCancel);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onCancel);
    };
  }, [gesture]);

  const rotate = position.x.interpolate({
    inputRange: [-SWIPE.rotateDivisor, 0, SWIPE.rotateDivisor],
    outputRange: ['-1deg', '0deg', '1deg'],
  });
  const dirs: SwipeDirection[] = ['right', 'left', 'up'];

  return (
    <Animated.View
      ref={nodeRef}
      {...(isWeb ? {} : gesture.responder.panHandlers)}
      style={{
        // 회전축: 카드 하단 중앙
        transformOrigin: 'bottom',
        transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }],
      }}
    >
      {children}
      {dirs.map((d) => (
        <Animated.View
          key={d}
          pointerEvents="none"
          style={[styles.overlay, { backgroundColor: overlays[d].color, opacity: swipeStrength(position, d) }]}
        >
          <Stack align="center" gap={4}>
            <View style={styles.overlayIcon}>
              <Icon name={overlays[d].icon} size="xl" color={d === 'up' ? theme.color.text.onBrand : overlays[d].color} />
            </View>
            <Text variant="display" tone={d === 'left' ? 'inverse' : 'onBrand'}>
              {overlays[d].label}
            </Text>
          </Stack>
        </Animated.View>
      ))}
    </Animated.View>
  );
}

/** 뒤에 깔린 다음 카드: 앞 카드를 끌수록 scale 0.95 → 1, translateY 10 → 0 */
export function behindCardStyle(position: Animated.ValueXY) {
  const dist = Animated.add(
    position.x.interpolate({ inputRange: [-1, 0, 1], outputRange: [1, 0, 1], extrapolate: 'extend' }),
    position.y.interpolate({ inputRange: [-1, 0, 1], outputRange: [1, 0, 0], extrapolate: 'extend' }),
  );
  const p = dist.interpolate({ inputRange: [0, SWIPE.threshold], outputRange: [0, 1], extrapolate: 'clamp' });
  return {
    transform: [
      { scale: p.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
      { translateY: p.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
    ],
  };
}
