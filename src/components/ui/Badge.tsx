import { View } from 'react-native';

import { makeStyles, useTheme } from '@/theme';

import { Text, type TextTone } from './Text';

/**
 * 시안 기준 알약 모양 배지
 * - brandSolid: "추천", "3개 품목"
 * - brand: "결과 도착", "14일 시뮬레이션", "거의 정확"
 * - warning: "4.5배 과대예측"
 * - neutral: "1.8배"
 */
export type BadgeTone = 'neutral' | 'brand' | 'brandSolid' | 'onBrand' | 'success' | 'warning' | 'danger';

type Props = {
  label: string;
  tone?: BadgeTone;
};

const useStyles = makeStyles((t) => ({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: t.space[2],
    paddingVertical: t.space[1] - 1,
    borderRadius: t.radius.pill,
  },
}));

export function Badge({ label, tone = 'neutral' }: Props) {
  const theme = useTheme();
  const styles = useStyles();

  const map: Record<BadgeTone, { bg: string; text: TextTone }> = {
    neutral: { bg: theme.color.bg.subtle, text: 'secondary' },
    brand: { bg: theme.color.brand.subtle, text: 'brand' },
    brandSolid: { bg: theme.color.brand.solid, text: 'inverse' },
    /** 파란 카드 위 ("3개 품목") */
    onBrand: { bg: theme.color.brand.onSolidSubtle, text: 'inverse' },
    success: { bg: theme.color.success.subtle, text: 'success' },
    warning: { bg: theme.color.warning.subtle, text: 'warning' },
    danger: { bg: theme.color.danger.subtle, text: 'danger' },
  };

  return (
    <View style={[styles.base, { backgroundColor: map[tone].bg }]}>
      <Text variant="caption" weight="600" tone={map[tone].text}>
        {label}
      </Text>
    </View>
  );
}
