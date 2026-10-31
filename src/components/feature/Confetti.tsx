import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, View } from 'react-native';

import { makeStyles, useTheme } from '@/theme';

/**
 * 목표 달성 폭죽 (명세서 4.10): 좌·우·중앙 3곳에서 지연 0 / 0.12 / 0.32s, 색종이 18개씩,
 * 1.9s 동안 퍼졌다가 90px 낙하하며 사라짐. 모션 줄이기 설정이면 그리지 않는다.
 */
const BURSTS = [
  { x: 0.2, delay: 0 },
  { x: 0.8, delay: 120 },
  { x: 0.5, delay: 320 },
];
const PER_BURST = 18;
const DURATION = 1900;
const FALL = 90;
const useNativeDriver = Platform.OS !== 'web';

type Piece = { t: Animated.Value; dx: number; dy: number; color: string; size: number; burst: number; spin: number };

const useStyles = makeStyles((t) => ({
  layer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  piece: { position: 'absolute', top: 0, borderRadius: t.space[1] / 2 },
}));

export function Confetti({ originY }: { originY: number }) {
  const theme = useTheme();
  const styles = useStyles();
  const [width, setWidth] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [pieces] = useState<Piece[]>(() => {
    const colors = [theme.color.brand.solid, theme.color.warning.solid, theme.color.gold, theme.color.success.solid];
    return BURSTS.flatMap((_, burst) =>
      Array.from({ length: PER_BURST }, (__, i) => {
        const angle = (-Math.PI / 2) + (Math.random() - 0.5) * Math.PI * 1.4;
        const dist = 60 + Math.random() * 110;
        return {
          t: new Animated.Value(0),
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
          color: colors[(i + burst) % colors.length],
          size: 6 + Math.random() * 5,
          burst,
          spin: (Math.random() - 0.5) * 720,
        };
      }),
    );
  });

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduced)
      .catch(() => setReduced(false));
  }, []);

  useEffect(() => {
    if (reduced) return;
    pieces.forEach((p) => p.t.setValue(0));
    const anims = pieces.map((p) =>
      Animated.timing(p.t, {
        toValue: 1,
        duration: DURATION,
        delay: BURSTS[p.burst].delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver,
      }),
    );
    Animated.parallel(anims).start();
    return () => anims.forEach((a) => a.stop());
  }, [reduced, pieces]);

  if (reduced) return null;

  return (
    <View style={styles.layer} pointerEvents="none" onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 &&
        pieces.map((p, i) => (
          <Animated.View
            key={i}
            style={[
              styles.piece,
              {
                left: width * BURSTS[p.burst].x,
                width: p.size,
                height: p.size * 0.6,
                backgroundColor: p.color,
                opacity: p.t.interpolate({ inputRange: [0, 0.05, 0.75, 1], outputRange: [0, 1, 1, 0] }),
                transform: [
                  { translateY: originY },
                  { translateX: p.t.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] }) },
                  // 퍼진 뒤 90px 떨어진다
                  { translateY: p.t.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, p.dy, p.dy + FALL] }) },
                  { rotate: p.t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
                ],
              },
            ]}
          />
        ))}
    </View>
  );
}
