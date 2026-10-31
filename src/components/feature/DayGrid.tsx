import { View } from 'react-native';

import { Row, Stack, Text } from '@/components/ui';
import { copy } from '@/constants/copy';
import type { DayState } from '@/lib/calc';
import { makeStyles, useTheme, type Theme } from '@/theme';

type Props = {
  states: DayState[];
  counts: Record<DayState, number>;
};

const PER_ROW = 7;

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', gap: t.space[2] },
  cell: { flex: 1, aspectRatio: 1, borderRadius: t.radius.md, borderWidth: 1 },
  dot: { width: 12, height: 12, borderRadius: t.space[1] - 1, borderWidth: 1 },
  /** 마지막 줄의 빈 칸 (줄 맞춤용) */
  blank: { flex: 1, aspectRatio: 1 },
}));

const cellStyle = (t: Theme, s: DayState) => {
  switch (s) {
    case 'yes':
      return { backgroundColor: t.color.brand.solid, borderColor: t.color.brand.solid };
    case 'no':
      return { backgroundColor: t.color.track, borderColor: t.color.track };
    case 'unsure':
      return { backgroundColor: t.color.bg.surface, borderColor: t.color.border.strong, borderStyle: 'dashed' as const };
    case 'missed':
      return { backgroundColor: t.color.bg.subtle, borderColor: t.color.bg.subtle };
    case 'pending':
      return { backgroundColor: t.color.bg.surface, borderColor: t.color.border.default };
  }
};

/** 시안 결과 화면의 날짜별 칸 + 범례 */
export function DayGrid({ states, counts }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const rows = Array.from({ length: Math.ceil(states.length / PER_ROW) }, (_, r) =>
    states.slice(r * PER_ROW, r * PER_ROW + PER_ROW),
  );
  const legend: Exclude<DayState, 'pending'>[] = ['yes', 'no', 'unsure', 'missed'];

  return (
    <Stack gap={3}>
      <Stack gap={2}>
        {rows.map((row, r) => (
          <View key={r} style={styles.row}>
            {Array.from({ length: PER_ROW }, (_, i) =>
              row[i] ? (
                <View key={i} style={[styles.cell, cellStyle(theme, row[i])]} />
              ) : (
                <View key={i} style={styles.blank} />
              ),
            )}
          </View>
        ))}
      </Stack>
      <Row gap={3} wrap>
        {legend
          .filter((s) => s !== 'missed' || counts.missed > 0)
          .map((s) => (
            <Row key={s} gap={1}>
              <View style={[styles.dot, cellStyle(theme, s)]} />
              <Text variant="caption" tone="secondary">
                {copy.result.legend[s]} {counts[s]}
              </Text>
            </Row>
          ))}
      </Row>
    </Stack>
  );
}
