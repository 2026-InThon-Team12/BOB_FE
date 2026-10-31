import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { makeStyles, useTheme, type SpaceKey } from '@/theme';

/**
 * 시안 기준:
 * - default: 흰 카드, 테두리·그림자 없음 (회색 배경 위)
 * - brand: 파란 카드 (홈 "오늘의 질문")
 * - brandSubtle: 연한 파란 카드 ("사면 11월 20일")
 * - warning: 연한 주황 카드 ("잠깐만요", 자유 소비 잔액)
 * - subtle: 연한 회색 카드 (달성 통계)
 * - inverse: 어두운 카드 (리포트 "이번 달 발견")
 */
export type CardTone = 'default' | 'subtle' | 'brand' | 'brandSubtle' | 'warning' | 'success' | 'inverse' | 'alert';

type Props = {
  children: ReactNode;
  tone?: CardTone;
  padding?: SpaceKey;
  /** 선택된 카드 (파란 테두리, 예: 등록 방법 "추천") */
  selected?: boolean;
  /** 떠 있는 카드 (오늘의 질문 카드 스택) */
  floating?: boolean;
  /** 지정하면 눌리는 카드가 된다 */
  onPress?: () => void;
  accessibilityLabel?: string;
};

const useStyles = makeStyles((t) => ({
  base: {
    borderRadius: t.radius.xl,
    borderWidth: 1,
  },
  floating: t.elevation.float,
}));

export function Card({
  children,
  tone = 'default',
  padding = 5,
  selected,
  floating,
  onPress,
  accessibilityLabel,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();

  const bg = {
    default: theme.color.bg.surface,
    subtle: theme.color.bg.subtle,
    brand: theme.color.brand.solid,
    brandSubtle: theme.color.brand.subtle,
    warning: theme.color.warning.subtle,
    success: theme.color.success.subtle,
    inverse: theme.color.bg.inverse,
    alert: theme.color.alert.subtle,
  }[tone];

  const style = [
    styles.base,
    floating && styles.floating,
    {
      backgroundColor: bg,
      // 필수 경고는 빨간 테두리 (명세서 danger)
      borderColor: selected ? theme.color.brand.solid : tone === 'alert' ? theme.color.alert.border : 'transparent',
      padding: theme.space[padding],
    },
  ];

  if (!onPress) return <View style={style}>{children}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      style={({ pressed }) => [style, pressed && { opacity: theme.motion.pressedOpacity }]}
    >
      {children}
    </Pressable>
  );
}
