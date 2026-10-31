import { router, useLocalSearchParams } from 'expo-router';

import { ItemSummary } from '@/components/feature';
import { Button, Card, EmptyState, Icon, Row, Screen, ScreenHeader, Stack, Text, useToast } from '@/components/ui';
import { copy, reflectionCopy } from '@/constants/copy';
import { REASON_TOPICS } from '@/constants/reasons';
import { policy } from '@/config/policy';
import { useSimulationResult } from '@/features/simulation/useSimulationResult';
import { goBack } from '@/lib/navigation';

/** 시뮬레이션 결과 + Buy · Bye · 7일 보류 (기능 1) */
export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { view, decide, busy, error, summaryLoading, refresh } = useSimulationResult(id);
  const toast = useToast();

  /** 명세서 3장: Buy ▶ 홈 (2주 뒤 점검 예약) · Bye ▶ 목표 (참은 금액 누적) · 보류 ▶ 홈 */
  const onDecide = async (action: 'buy' | 'abandon' | 'hold') => {
    const out = await decide(action);
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

      <Card><Stack gap={3}>
        <Text variant="heading">{reflectionCopy.summaryTitle}</Text>
        {summaryLoading && <Text>{reflectionCopy.summaryLoading}</Text>}
        {error && <><Text tone="warning">{error}</Text><Button label={reflectionCopy.retry} onPress={refresh}/></>}
        {item.summary ? <>
          <Text>{item.summary.text}</Text>
          <Text tone="secondary">{item.summary.method === 'AI' ? reflectionCopy.aiSummary : reflectionCopy.fallbackSummary} · {reflectionCopy.coverage(item.summary.coverage)}</Text>
          {item.summary.expectedDays !== null && <Text>{reflectionCopy.expected(item.summary.expectedDays)}</Text>}
          {!item.summary.eligible && <Text tone="secondary">{reflectionCopy.insufficient}</Text>}
        </> : !summaryLoading && <Text>{reflectionCopy.unfinished}</Text>}
      </Stack></Card>

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
              <Button label={copy.decision.buy} sublabel={copy.decision.buySub} disabled={busy || summaryLoading} onPress={() => onDecide('buy')} />
            </Stack>
            <Stack flex={1}>
              <Button
                label={copy.decision.bye}
                sublabel={copy.decision.byeSub}
                variant="bye"
                disabled={busy || summaryLoading || view.phase !== 'awaitingDecision'} onPress={() => onDecide('abandon')}
              />
            </Stack>
          </Row>
          {view.phase === 'awaitingDecision' && view.canHold && (
            <Button label={copy.decision.hold(policy.holdDays)} variant="ghost" disabled={busy || summaryLoading} onPress={() => onDecide('hold')} />
          )}
        </Stack>
      ) : null}
    </Screen>
  );
}
