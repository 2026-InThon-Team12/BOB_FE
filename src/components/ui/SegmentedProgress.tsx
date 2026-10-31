import { View } from 'react-native';

import { makeStyles, useTheme } from '@/theme';

type Props = {
  total: number;
  /** 채워진 칸 수 */
  filled: number;
  accessibilityLabel?: string;
};

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', gap: t.space[1] },
  seg: { flex: 1, height: 4, borderRadius: t.radius.pill },
}));

/** 칸으로 나뉜 진행 표시 (시안 "오늘의 질문" 상단) */
export function SegmentedProgress({ total, filled, accessibilityLabel }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: total, now: filled }}
    >
      {Array.from({ length: Math.max(total, 1) }, (_, i) => (
        <View
          key={i}
          style={[styles.seg, { backgroundColor: i < filled ? theme.color.brand.solid : theme.color.track }]}
        />
      ))}
    </View>
  );
}
