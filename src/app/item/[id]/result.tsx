import { useFirstVisitHelp } from '@/features/help/useFirstVisitHelp';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';

import { ItemSummary } from '@/components/feature';
import { BottomSheet, Button, Card, EmptyState, Icon, Row, Screen, ScreenHeader, Stack, Text, useToast } from '@/components/ui';
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
  const [confirmation, setConfirmation] = useState<'buy' | 'abandon' | null>(null);
  const deciding = useRef(false);
  useFirstVisitHelp('decision', !!view);

  /** 확정 버튼을 누르기 전에는 서버·기기 기록을 변경하지 않는다. */
  const onDecide = async (action: 'buy' | 'abandon' | 'hold') => {
    if (deciding.current) return;
    deciding.current = true;
    setConfirmation(null);
    let out;
    try { out = await decide(action); }
    finally { deciding.current = false; }
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
          {item.summary.syncState === 'preview' && <Text tone="secondary">{reflectionCopy.summaryPreview}</Text>}
          <Text tone="secondary">{item.summary.method === 'AI' ? reflectionCopy.aiSummary : reflectionCopy.fallbackSummary} · {reflectionCopy.coverage(item.summary.coverage)}</Text>
          {item.summary.reflectionCounts ? <>
            <Text>{reflectionCopy.reflectionCounts(item.summary.reflectionCounts.YES,item.summary.reflectionCounts.UNSURE,item.summary.reflectionCounts.NO)}</Text>
            <Text tone="secondary">{reflectionCopy.reflectionNotice}</Text>
          </> : <>
            {item.summary.expectedDays !== null && <Text>{reflectionCopy.expected(item.summary.expectedDays)}</Text>}
            {!item.summary.eligible && <Text tone="secondary">{reflectionCopy.insufficient}</Text>}
          </>}
        </> : !summaryLoading && view.phase !== 'awaitingDecision' && <Text>{reflectionCopy.unfinished}</Text>}
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
              <Button label={copy.decision.buy} sublabel={copy.decision.buySub} disabled={busy || summaryLoading} onPress={() => setConfirmation('buy')} />
            </Stack>
            <Stack flex={1}>
              <Button
                label={copy.decision.bye}
                sublabel={copy.decision.byeSub}
                variant="bye"
                disabled={busy || summaryLoading} onPress={() => setConfirmation('abandon')}
              />
            </Stack>
          </Row>
          {view.phase === 'awaitingDecision' && view.canHold && (
            <Button label={copy.decision.hold(policy.holdDays)} variant="ghost" disabled={busy || summaryLoading} onPress={() => onDecide('hold')} />
          )}
        </Stack>
      ) : null}
      <BottomSheet visible={confirmation !== null} onClose={() => setConfirmation(null)} closeLabel={copy.decision.confirmNo}>
        <Text variant="heading">{copy.decision.confirmTitle(confirmation === 'buy' ? 'Buy' : 'Bye')}</Text>
        <Text>{copy.decision.confirmBody}</Text>
        <Row gap={3}>
          <Stack flex={1}><Button label={copy.decision.confirmNo} variant="secondary" onPress={() => setConfirmation(null)} /></Stack>
          <Stack flex={1}><Button label={copy.decision.confirmYes} disabled={busy} onPress={() => confirmation && onDecide(confirmation)} /></Stack>
        </Row>
      </BottomSheet>
    </Screen>
  );
}
