import { router } from 'expo-router';
import { View } from 'react-native';

import { GoalCard } from '@/components/feature';
import {
  Button,
  Card,
  EmptyState,
  Icon,
  Row,
  Screen,
  Stack,
  Text,
  TextLink,
} from '@/components/ui';
import { copy, updateCopy } from '@/constants/copy';
import { useGoalShelf } from '@/features/goal/useGoalShelf';
import { useImpulse } from '@/features/goal/useImpulse';
import { makeStyles } from '@/theme';

const useStyles = makeStyles((t) => ({
  shelfThumbs: { flexDirection: 'row', width: 64, height: 32 },
  shelfThumb: {
    width: 28,
    height: 32,
    marginRight: -8,
    borderRadius: t.radius.sm,
    borderWidth: 2,
    borderColor: t.color.bg.surface,
    backgroundColor: t.color.bg.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: { paddingHorizontal: t.space[1] },
  half: { flex: 1 },
}));

/** 목표 탭 (기능 4, 명세서 4.8) — 목표 카드 · 진열장 · 즉석 개입 */
export default function GoalScreen() {
  const styles = useStyles();
  const imp = useImpulse();
  const shelf = useGoalShelf();
  const { overview } = imp;
  const toNewGoal = () => router.push('/goals/new');

  if (!overview.goal) {
    return (
      <Screen title={copy.goal.title}>
        <EmptyState
          icon="goal"
          title={copy.goal.emptyTitle}
          description={copy.goal.emptyDescription}
          action={<Button label={copy.goal.setGoal} onPress={toNewGoal} />}
        />
      </Screen>
    );
  }

  const { goal, progress, dailySaving, eta } = overview;

  return (
    <Screen title={copy.goal.title} titleAction={<TextLink label={copy.goal.change} onPress={toNewGoal} />}>
      <GoalCard
        name={goal.name}
        price={goal.price}
        imageUri={goal.imageUri}
        saved={progress.saved}
        ratio={progress.ratio}
        eta={eta}
        dailySaving={dailySaving}
      />

      <Card onPress={() => router.push('/goals/shelf')} padding={4} accessibilityLabel={copy.shelf.entry(shelf.achievedCount)}>
        <Row gap={3}>
          <View style={styles.shelfThumbs}>
            <View style={styles.shelfThumb} />
            <View style={styles.shelfThumb} />
            <View style={styles.shelfThumb}>
              <Icon name="check" size="sm" tone="brand" />
            </View>
          </View>
          <Stack flex={1} gap={1}>
            <Text variant="bodyStrong">{copy.shelf.entry(shelf.achievedCount)}</Text>
            <Text variant="caption" tone="secondary">
              {copy.shelf.entrySub}
            </Text>
          </Stack>
          <Icon name="chevronRight" tone="tertiary" />
        </Row>
      </Card>

      {progress.achieved && <Button label={copy.goal.nextGoal} fullWidth onPress={() => router.push({pathname:'/goals/new',params:{mode:'first'}})} />}
      <Text variant="caption" tone="secondary">{updateCopy.estimated}</Text>
      {overview.usesPreviousBudget && <Text variant="caption" tone="secondary">{updateCopy.recurring}</Text>}
      {progress.achieved && <Button label={copy.impulse.achievedCta} fullWidth onPress={() => router.push({ pathname: '/goals/done', params: { id: goal.id } })}/>}
      <Button label={copy.goal.impulseTitle} icon="clock" fullWidth onPress={() => router.push('/impulse')}/>
    </Screen>
  );
}
