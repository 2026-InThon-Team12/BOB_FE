import { View } from 'react-native';

import { makeStyles, useTheme, type Theme } from '@/theme';

/** predicted: 리포트·점검의 "예측" 회색 막대 */
export type ProgressTone = 'brand' | 'success' | 'warning' | 'danger' | 'predicted';

type Props = {
  /** 0 ~ 1 (범위를 벗어나면 잘라낸다) */
  value: number;
  tone?: ProgressTone;
  size?: 'sm' | 'md';
  accessibilityLabel?: string;
};

const useStyles = makeStyles((t) => ({
  track: { width: '100%', overflow: 'hidden', borderRadius: t.radius.pill, backgroundColor: t.color.track },
  sm: { height: 6 },
  md: { height: 8 },
  fill: { height: '100%', borderRadius: t.radius.pill },
}));

export const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);

export const progressColor = (t: Theme, tone: ProgressTone) =>
  tone === 'predicted' ? t.color.predicted : t.color[tone].solid;

export function ProgressBar({ value, tone = 'brand', size = 'md', accessibilityLabel }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const ratio = clamp01(value);

  return (
    <View
      style={[styles.track, styles[size]]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}
    >
      <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: progressColor(theme, tone) }]} />
    </View>
  );
}
