import { useFirstVisitHelp } from '@/features/help/useFirstVisitHelp';
import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { AmountRow } from '@/components/feature';
import { Button, Card, EmptyState, Icon, ProgressBar, Row, Screen, Stack, Text, TextLink } from '@/components/ui';
import { copy } from '@/constants/copy';
import { useWallet } from '@/features/budget/useWallet';
import { formatMonthDay, formatWon } from '@/lib/format';

/** 지갑 탭 (기능 7) — 자유 소비 잔액 · 이번 달 돈 계획 · 등록 안 하고 쓴 돈 */
export default function WalletScreen() {
  const wallet = useWallet();
  useFirstVisitHelp('wallet');
  const toPlan = () => router.push('/budget/edit');
  const toRecord = () => router.push('/expenses/new');

  const unregistered = (
    <Card>
      <Stack gap={1}>
        <Text variant="heading">{copy.wallet.unregisteredTitle}</Text>
        <Text variant="label" tone="secondary">
          {copy.wallet.unregisteredBody}
        </Text>
      </Stack>
      <Stack paddingY={2}>
        {wallet.unregistered.length === 0 ? (
          <Stack paddingY={3}>
            <Text variant="label" tone="tertiary">
              {copy.wallet.unregisteredEmpty}
            </Text>
          </Stack>
        ) : (
          wallet.unregistered.map((e, i) => (
            <AmountRow
              key={e.id}
              label={e.label}
              hint={formatMonthDay(e.date)}
              amount={e.amount}
              last={i === wallet.unregistered.length - 1}
              trailing={
                <Pressable
                  onPress={() => wallet.removeExpense(e.id)}
                  accessibilityRole="button"
                  accessibilityLabel={copy.wallet.remove(e.label)}
                >
                  <Icon name="close" size="sm" tone="tertiary" />
                </Pressable>
              }
            />
          ))
        )}
      </Stack>
      <Button label={copy.wallet.record} icon="add" variant="secondary" fullWidth onPress={toRecord} />
    </Card>
  );

  if (!wallet.budget) {
    return (
      <Screen title={copy.wallet.title}>
        <Card>
          <EmptyState
            icon="wallet"
            title={copy.wallet.emptyTitle}
            description={copy.wallet.emptyDescription}
            action={<Button label={copy.wallet.startPlan} onPress={toPlan} />}
          />
        </Card>
        {unregistered}
      </Screen>
    );
  }

  const { budget, balance, free, spentRatio } = wallet;
  const over = balance.remaining < 0;

  return (
    <Screen title={copy.wallet.title}>
      <Card>
        <Stack gap={3}>
          <Text variant="label" tone="secondary">
            {copy.wallet.freeTitle(wallet.month)}
          </Text>
          <Row gap={2} align="flex-end">
            <Text variant="display" tone={over ? 'warning' : 'primary'}>
              {formatWon(Math.abs(balance.remaining))}
            </Text>
            <Text tone="secondary">{over ? copy.wallet.over : copy.wallet.remaining}</Text>
          </Row>
          <ProgressBar value={spentRatio} tone={over ? 'warning' : 'brand'} />
          <Row justify="space-between">
            <Text variant="caption" tone="secondary">
              {copy.wallet.spent(balance.spent)}
            </Text>
            <Text variant="caption" tone="secondary">
              {copy.wallet.of(balance.limit)}
            </Text>
          </Row>
        </Stack>
      </Card>

      <Card>
        <Row justify="space-between">
          <Text variant="heading">{copy.wallet.planTitle}</Text>
          <TextLink label={copy.wallet.planEdit} onPress={toPlan} />
        </Row>
        <Text variant="caption" tone="tertiary">
          {copy.wallet.planHint}
        </Text>
        <Stack paddingY={2}>
          <AmountRow label={copy.budget.income} amount={budget.income} />
          <AmountRow label={copy.budget.food} hint={copy.budget.foodHint} amount={budget.food} />
          <AmountRow label={copy.budget.living} hint={copy.budget.livingHint} amount={budget.living} />
          <AmountRow label={copy.budget.transport} amount={budget.transport} />
          <AmountRow label={copy.budget.saving} amount={budget.saving} />
          <AmountRow label={copy.budget.free} amount={free} emphasis last />
        </Stack>
      </Card>

      {unregistered}
    </Screen>
  );
}
