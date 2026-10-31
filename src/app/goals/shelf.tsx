import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ShelfSlot } from '@/components/feature';
import { BottomSheet, Row, Screen, ScreenHeader, Stack, Text } from '@/components/ui';
import { copy } from '@/constants/copy';
import { useGoalShelf, type ShelfSlot as Slot } from '@/features/goal/useGoalShelf';
import { formatWon } from '@/lib/format';
import { goBack } from '@/lib/navigation';
import { makeStyles } from '@/theme';

const useStyles = makeStyles((t) => ({
  cabinet: {
    borderRadius: t.radius.xxl,
    overflow: 'hidden',
    backgroundColor: t.color.shelf.bg,
    borderLeftWidth: t.space[4],
    borderRightWidth: t.space[4],
    borderColor: t.color.shelf.wall,
  },
  shelf: { paddingTop: t.space[5], gap: t.space[3] },
  slots: { flexDirection: 'row', justifyContent: 'space-evenly', minHeight: 150 },
  plank: { height: t.space[5], backgroundColor: t.color.shelf.plank },
  sheetRow: { paddingVertical: t.space[2], borderBottomWidth: 1, borderBottomColor: t.color.border.default },
}));

/** "YY.MM" (달성 연월) */
const stamp = (dateKey: string) => `${dateKey.slice(2, 4)}.${dateKey.slice(5, 7)}`;

/** 목표 진열장 (명세서 4.9) */
export default function GoalShelfScreen() {
  const styles = useStyles();
  const shelf = useGoalShelf();
  const [selected, setSelected] = useState<Extract<Slot, { kind: 'achieved' }> | null>(null);

  return (
    <Screen
      edges={['top', 'bottom']}
      header={<ScreenHeader title={copy.shelf.title} onBack={() => goBack('/goal')} backLabel={copy.common.back} />}
    >
      <Row justify="space-between" align="flex-end">
        <Stack gap={1}>
          <Text variant="title">
            {copy.shelf.countLabel}
            <Text variant="title" tone="brand">
              {copy.shelf.count(shelf.achievedCount)}
            </Text>
          </Text>
          <Text variant="label" tone="secondary">
            {copy.shelf.sub}
          </Text>
        </Stack>
        <Text variant="bodyStrong" weight="700">
          {formatWon(shelf.achievedTotal)}
        </Text>
      </Row>

      <View style={styles.cabinet}>
        {shelf.shelves.map((row, r) => (
          <View key={r} style={styles.shelf}>
            <View style={styles.slots}>
              {row.map((slot) =>
                slot.kind === 'next' ? (
                  <ShelfSlot key="next" kind="next" onPress={() => router.push('/goals/new?mode=first')} />
                ) : slot.kind === 'active' ? (
                  <ShelfSlot
                    key={slot.goal.id}
                    kind="active"
                    name={slot.goal.name}
                    price={slot.goal.price}
                    percent={copy.goal.percent(slot.ratio)}
                  />
                ) : (
                  <ShelfSlot
                    key={slot.goal.id}
                    kind="achieved"
                    name={slot.goal.name}
                    price={slot.goal.price}
                    imageUri={slot.goal.imageUri}
                    stamp={stamp(slot.achievedOn)}
                    selected={selected?.goal.id === slot.goal.id}
                    onPress={() => setSelected(slot)}
                  />
                ),
              )}
            </View>
            <View style={styles.plank} />
          </View>
        ))}
      </View>

      <BottomSheet visible={!!selected} onClose={() => setSelected(null)} closeLabel={copy.shelf.close}>
        {selected && (
          <Stack gap={3}>
            <Stack gap={1}>
              <Text variant="title">{selected.goal.name}</Text>
              <Text variant="label" tone="secondary">
                {`${copy.shelf.achievedOn(selected.achievedOn)} · ${copy.shelf.took(selected.stats.daysTaken)}`}
              </Text>
            </Stack>
            <Stack>
              {[
                [copy.shelf.price, formatWon(selected.goal.price)],
                [copy.shelf.resisted, copy.shelf.times(selected.stats.resistedCount)],
                [copy.shelf.top, selected.stats.topLabel ?? copy.goalDone.none],
              ].map(([label, value]) => (
                <Row key={label} justify="space-between" style={styles.sheetRow}>
                  <Text variant="label" tone="secondary">
                    {label}
                  </Text>
                  <Text variant="bodyStrong">{value}</Text>
                </Row>
              ))}
            </Stack>
          </Stack>
        )}
      </BottomSheet>
    </Screen>
  );
}
