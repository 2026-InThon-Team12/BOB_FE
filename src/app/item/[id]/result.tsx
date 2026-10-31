import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { DayGrid, ItemSummary } from '@/components/feature';
import { Button, Card, EmptyState, Icon, Row, Screen, ScreenHeader, Stack, Text, useToast } from '@/components/ui';
import { copy } from '@/constants/copy';
import { REASON_TOPICS } from '@/constants/reasons';
import { policy } from '@/config/policy';
import { useSimulationResult } from '@/features/simulation/useSimulationResult';
import { formatWon } from '@/lib/format';
import { goBack } from '@/lib/navigation';
import { makeStyles } from '@/theme';

const useStyles = makeStyles((t) => ({
  divider: { height: 1, backgroundColor: t.color.border.default },
}));

/** 시뮬레이션 결과 + Buy · Bye · 7일 보류 (기능 1) */
export default function ResultScreen() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { view, decide } = useSimulationResult(id);
  const toast = useToast();

  /** 명세서 3장: Buy ▶ 홈 (2주 뒤 점검 예약) · Bye ▶ 목표 (참은 금액 누적) · 보류 ▶ 홈 */
  const onDecide = (action: 'buy' | 'abandon' | 'hold') => {
    const out = decide(action);
    if (!out) return;
    if (out.action === 'buy') {
      toast(copy.result.boughtToast(out.reviewAfterDays));
      router.dismissTo('/');
    } else if (out.action === 'hold') {
      toast(copy.result.holdTitle(out.days));
      router.dismissTo('/');
    } else {
      toast(out.goal ? copy.result.byeBody(out.amount) : copy.result.byeNoGoal);
      router.dismissTo(out.goal ? '/goal' : '/');
    }
  };
  const header = <ScreenHeader title={copy.result.title} onBack={() => goBack('/')} backLabel={copy.common.back} />;

  if (!view) {
    return (
      <Screen header={header} edges={['top', 'bottom']}>
        <EmptyState title={copy.result.notFound} action={<Button label={copy.check.toHome} onPress={() => router.replace('/')} />} />
      </Screen>
    );
  }

  const { item } = view;
  const firstReason = item.reasons[0];

  return (
    <Screen header={header} edges={['top', 'bottom']}>
      <ItemSummary
        name={item.name}
        price={item.price}
        category={item.category}
        imageUri={item.imageUri}
        extra={firstReason ? copy.result.registeredFor(REASON_TOPICS[firstReason]) : undefined}
      />

      <Card>
        <Stack gap={4}>
          <Row gap={2} align="baseline">
            <Text tone="secondary">{copy.result.neededPrefix(view.totalDays)}</Text>
            <Text variant="hero" tone="brand">
              {copy.result.neededDays(view.usedDays)}
            </Text>
            <Text tone="secondary">{copy.result.neededSuffix}</Text>
          </Row>
          <DayGrid states={view.cells.map((c) => c.state)} counts={view.counts} />
          <View style={styles.divider} />
          <Row justify="space-between">
            <Text tone="secondary">{copy.result.perUse}</Text>
            {view.costPerUse !== null ? (
              <Text variant="title">{formatWon(view.costPerUse)}</Text>
            ) : (
              <Text variant="bodyStrong">{copy.result.neverNeeded}</Text>
            )}
          </Row>
        </Stack>
      </Card>

      {view.notes.length > 0 && (
        <Card>
          <Stack gap={2}>
            <Row gap={1}>
              <Icon name="ai" size="sm" tone="brand" />
              <Text variant="label" weight="600" tone="brand">
                {copy.result.summaryTitle}
              </Text>
            </Row>
            {view.notes.map((note) => (
              <Text key={note.kind}>
                {note.kind === 'frontLoaded' || note.kind === 'backLoaded'
                  ? copy.result.summary[note.kind](note.days)
                  : note.kind === 'mostlyUnsure' || note.kind === 'missed'
                    ? copy.result.summary[note.kind](note.count)
                    : note.kind === 'mixed'
                      ? copy.result.summary.mixed(note.yes, note.no)
                      : copy.result.summary[note.kind]()}
              </Text>
            ))}
          </Stack>
        </Card>
      )}

      {view.warning && (
        <Card tone="warning">
          <Row gap={2} align="flex-start">
            <Icon name="warning" size="sm" tone="warning" />
            <Stack flex={1}>
              <Text variant="label" tone="warning">
                {copy.result.reasonWarning(REASON_TOPICS[view.warning.reason], view.warning.abandonRate)}
              </Text>
            </Stack>
          </Row>
        </Card>
      )}

      {view.phase === 'awaitingDecision' || view.phase === 'simulating' ? (
        <Stack gap={3}>
          <Text variant="heading">{copy.result.ask}</Text>
          {view.phase === 'simulating' && (
            <Text variant="label" tone="secondary">{copy.result.inProgress(view.daysLeft)}</Text>
          )}
          <Row gap={3}>
            <Stack flex={1}>
              <Button label={copy.decision.buy} sublabel={copy.decision.buySub} onPress={() => onDecide('buy')} />
            </Stack>
            <Stack flex={1}>
              <Button
                label={copy.decision.bye}
                sublabel={copy.decision.byeSub}
                variant="bye"
                onPress={() => onDecide('abandon')}
              />
            </Stack>
          </Row>
          {view.phase === 'awaitingDecision' && (
            <Button label={copy.decision.hold(policy.holdDays)} variant="ghost" onPress={() => onDecide('hold')} />
          )}
        </Stack>
      ) : null}
    </Screen>
  );
}
