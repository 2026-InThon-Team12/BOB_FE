import { router } from 'expo-router';
import { View } from 'react-native';

import { GoalCard } from '@/components/feature';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Icon,
  Input,
  MoneyInput,
  Row,
  Screen,
  Stack,
  Text,
  TextLink,
  useToast,
} from '@/components/ui';
import { copy } from '@/constants/copy';
import { useGoalShelf } from '@/features/goal/useGoalShelf';
import { useImpulse } from '@/features/goal/useImpulse';
import { formatMonthDay } from '@/lib/format';
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
  const toast = useToast();
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

  const resist = () => {
    const out = imp.resist();
    if (!out || out.kind !== 'resisted') return;
    if (out.reached) {
      toast(copy.impulse.reached, {
        label: copy.impulse.seeReached,
        onPress: () => router.push({ pathname: '/goals/done', params: { id: goal.id } }),
      });
    } else {
      toast(copy.impulse.resisted(out.amount));
    }
  };
  const giveIn = () => {
    if (imp.giveIn()) toast(copy.impulse.gaveIn);
  };

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

      {progress.achieved ? (
        <Card tone="brandSubtle">
          <Stack gap={3}>
            <Text variant="heading" tone="brand">
              {copy.main.goalReached}
            </Text>
            <Button
              label={copy.impulse.achievedCta}
              fullWidth
              onPress={() => router.push({ pathname: '/goals/done', params: { id: goal.id } })}
            />
            <Button label={copy.goalDone.next} variant="ghost" fullWidth onPress={toNewGoal} />
          </Stack>
        </Card>
      ) : (
        <>
          <Text variant="heading">{copy.impulse.title}</Text>
          <Row gap={2} wrap>
            {imp.presets.map((p, i) => (
              <Chip
                key={p.label}
                label={copy.impulse.preset(p.label, p.amount)}
                selectedStyle="inverse"
                selected={imp.picked === i}
                onPress={() => imp.pick(i)}
              />
            ))}
            <Chip
              label={copy.impulse.custom}
              dashed={imp.picked !== 'custom'}
              selectedStyle="inverse"
              selected={imp.picked === 'custom'}
              onPress={() => imp.pick('custom')}
            />
          </Row>
          {imp.picked === 'custom' && (
            <Row gap={3} align="flex-start">
              <View style={styles.half}>
                <Input
                  label={copy.impulse.customName}
                  placeholder={copy.impulse.customNamePlaceholder}
                  value={imp.customName}
                  onChangeText={imp.setCustomName}
                />
              </View>
              <View style={styles.half}>
                <MoneyInput
                  label={copy.impulse.customAmount}
                  placeholder="0"
                  value={imp.customAmount}
                  onChangeValue={imp.setCustomAmount}
                />
              </View>
            </Row>
          )}

          {imp.ready && (
            <Card>
              {imp.delay !== null && imp.dailySaving ? (
                <Stack gap={4}>
                  <Text variant="title">
                    {copy.impulse.headline(imp.label, goal.name)}
                    <Text variant="title" tone="brand">
                      {copy.impulse.late(imp.delay)}
                    </Text>
                    {copy.impulse.lateSuffix}
                  </Text>
                  {imp.etaIfResist && imp.etaIfBuy && (
                    <Row gap={2}>
                      <View style={styles.half}>
                        <Card tone="subtle" padding={4}>
                          <Text variant="caption" tone="secondary">
                            {copy.impulse.ifResist}
                          </Text>
                          <Text variant="heading">{formatMonthDay(imp.etaIfResist)}</Text>
                        </Card>
                      </View>
                      <View style={styles.arrow}>
                        <Icon name="arrowRight" tone="tertiary" />
                      </View>
                      <View style={styles.half}>
                        <Card tone="brandSubtle" padding={4}>
                          <Text variant="caption" tone="brand">
                            {copy.impulse.ifBuy}
                          </Text>
                          <Text variant="heading" tone="brand">
                            {formatMonthDay(imp.etaIfBuy)}
                          </Text>
                        </Card>
                      </View>
                    </Row>
                  )}
                  <Text variant="caption" tone="tertiary">
                    {copy.impulse.formula(imp.amount, imp.dailySaving, imp.delay)}
                  </Text>
                </Stack>
              ) : (
                <Text variant="label" tone="secondary">
                  {copy.impulse.noSaving}
                </Text>
              )}
            </Card>
          )}

          <Button label={copy.impulse.resist(imp.amount)} size="lg" fullWidth disabled={!imp.ready} onPress={resist} />
          <Button label={copy.impulse.giveIn} variant="ghost" fullWidth disabled={!imp.ready} onPress={giveIn} />
        </>
      )}
    </Screen>
  );
}
