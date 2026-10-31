import { Animated, Pressable } from 'react-native';

import { Icon, Row, Stack, Text, type IconName } from '@/components/ui';
import { makeStyles, useTheme } from '@/theme';

type Props = {
  /** 순서: 있었어요 · 딱히 없었어요 · 잘 모르겠어요 */
  labels: readonly [string, string, string];
  hints: readonly [string, string, string];
  onAnswer: (optionIndex: number) => void;
  disabled?: boolean;
  /** 카드를 끄는 정도(0~1, 선택지 순서) — 해당 방향 버튼을 1 + 0.15 × 강도로 키운다 */
  strengths?: readonly [Animated.AnimatedInterpolation<number>, Animated.AnimatedInterpolation<number>, Animated.AnimatedInterpolation<number>];
};

const useStyles = makeStyles((t) => ({
  circle: { alignItems: 'center', justifyContent: 'center', borderRadius: t.radius.pill, borderWidth: 1 },
  lg: { width: 60, height: 60 },
  md: { width: 48, height: 48 },
}));

/** 시안 하단 답 버튼: ✕ 딱히 없었어요 · ? 잘 모르겠어요 · ✓ 있었어요 */
export function AnswerButtons({ labels, hints, onAnswer, disabled, strengths }: Props) {
  const theme = useTheme();
  const styles = useStyles();

  // 화면 배치는 왼쪽부터 ✕ · ? · ✓ (스와이프 방향과 같은 위치)
  const buttons: { option: number; icon: IconName; size: 'lg' | 'md'; primary?: boolean }[] = [
    { option: 1, icon: 'close', size: 'lg' },
    { option: 2, icon: 'help', size: 'md' },
    { option: 0, icon: 'check', size: 'lg', primary: true },
  ];

  return (
    <Row justify="space-around" align="flex-end">
      {buttons.map((b) => (
        <Stack key={b.option} align="center" gap={2}>
          <Animated.View
            style={
              strengths && {
                transform: [{ scale: strengths[b.option].interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) }],
              }
            }
          >
          <Pressable
            onPress={() => onAnswer(b.option)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={labels[b.option]}
            style={({ pressed }) => [
              styles.circle,
              styles[b.size],
              {
                backgroundColor: b.primary ? theme.color.brand.solid : theme.color.bg.surface,
                borderColor: b.primary ? theme.color.brand.solid : theme.color.border.default,
              },
              pressed && { opacity: theme.motion.pressedOpacity },
            ]}
          >
            <Icon name={b.icon} size="lg" tone={b.primary ? 'onBrand' : 'primary'} />
          </Pressable>
          </Animated.View>
          <Text variant="caption" weight="500" tone={b.primary ? 'brand' : 'secondary'}>
            {hints[b.option]}
          </Text>
        </Stack>
      ))}
    </Row>
  );
}
