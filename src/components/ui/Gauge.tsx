import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { makeStyles, useTheme } from '@/theme';

import { clamp01, progressColor, type ProgressTone } from './ProgressBar';

type Props = {
  /** 0 ~ 1 */
  value: number;
  tone?: ProgressTone;
  size?: 'md' | 'lg';
  /** 가운데에 표시할 내용 (예: 퍼센트 텍스트) */
  children?: ReactNode;
  accessibilityLabel?: string;
};

const dimensions = {
  md: { diameter: 96, stroke: 10 },
  lg: { diameter: 160, stroke: 16 },
} as const;

const useStyles = makeStyles(() => ({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
}));

/** 원형 게이지 (목표 달성률 등) */
export function Gauge({ value, tone = 'brand', size = 'lg', children, accessibilityLabel }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const { diameter, stroke } = dimensions[size];
  const r = (diameter - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const ratio = clamp01(value);

  return (
    <View
      style={[styles.wrap, { width: diameter, height: diameter }]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}
    >
      <Svg width={diameter} height={diameter}>
        <Circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={r}
          stroke={theme.color.track}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={r}
          stroke={progressColor(theme, tone)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - ratio)}
          fill="none"
          transform={`rotate(-90 ${diameter / 2} ${diameter / 2})`}
        />
      </Svg>
      {children && <View style={styles.center}>{children}</View>}
    </View>
  );
}
