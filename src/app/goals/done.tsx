import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Platform, View } from 'react-native';

import { Confetti } from '@/components/feature';
import { Button, Card, EmptyState, Gauge, Row, Screen, ScreenHeader, Stack, Text } from '@/components/ui';
import { copy } from '@/constants/copy';
import { useAchievedGoal } from '@/features/goal/useGoalShelf';
import { formatWon } from '@/lib/format';
import { goBack } from '@/lib/navigation';
import { makeStyles } from '@/theme';

const useStyles = makeStyles((t) => ({
  hero: { alignItems: 'center', gap: t.space[4], paddingTop: t.space[6] },
  stat: { flex: 1, alignItems: 'center', gap: t.space[1] },
  divider: { width: 1, alignSelf: 'stretch', backgroundColor: t.color.border.default },
}));

const RING_Y = 140;

/** 목표 달성 (명세서 4.10) — 화면 진입 시 링 팝 + 폭죽 */
export default function GoalDoneScreen() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const data = useAchievedGoal(id);
  const [pop] = useState(() => new Animated.Value(0.6));

  useEffect(() => {
    pop.setValue(0.6);
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 60, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [pop]);

  const close = () => goBack('/goal');
  const header = <ScreenHeader onBack={close} backIcon="close" backLabel={copy.goalDone.close} />;

  if (!data) {
    return (
      <Screen header={header} edges={['top', 'bottom']}>
        <EmptyState title={copy.goal.emptyTitle} action={<Button label={copy.goal.setGoal} onPress={() => router.replace('/goals/new?mode=first')} />} />
      </Screen>
    );
  }

  const { goal, stats } = data;
  return (
    <Screen
      header={header}
      edges={['top', 'bottom']}
      footer={
        <Stack gap={2}>
          <Button label={copy.goalDone.buy} size="lg" fullWidth onPress={close} />
          <Button label={copy.goalDone.next} variant="ghost" fullWidth onPress={() => router.replace('/goals/new?mode=first')} />
        </Stack>
      }
    >
      <View style={styles.hero}>
          <Animated.View style={{ transform: [{ scale: pop }] }}>
            <Gauge value={1} accessibilityLabel={copy.goalDone.title}>
              <Text variant="display" tone="brand">
                100%
              </Text>
              <Text variant="caption" tone="secondary">
                {formatWon(goal.price)}
              </Text>
            </Gauge>
          </Animated.View>
        <Text variant="title" align="center">
          {copy.goalDone.title}
        </Text>
        <Text tone="secondary" align="center">
          {copy.goalDone.body(goal.name)}
        </Text>
      </View>

      <Card tone="subtle" padding={4}>
        <Row>
          <View style={styles.stat}>
            <Text variant="caption" tone="secondary">
              {copy.goalDone.resisted}
            </Text>
            <Text variant="heading">{copy.goalDone.times(stats.resistedCount)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text variant="caption" tone="secondary">
              {copy.goalDone.took}
            </Text>
            <Text variant="heading">{copy.goalDone.days(stats.daysTaken)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text variant="caption" tone="secondary">
              {copy.goalDone.top}
            </Text>
            <Text variant="heading" numberOfLines={1}>
              {stats.topLabel ?? copy.goalDone.none}
            </Text>
          </View>
        </Row>
      </Card>

      <Confetti originY={RING_Y} />
    </Screen>
  );
}
