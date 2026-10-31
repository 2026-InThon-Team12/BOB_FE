import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { BalanceReminder, ItemSummary } from '@/components/feature';
import {
  Button,
  Card,
  Chip,
  Icon,
  InlineCalendar,
  Input,
  Row,
  Screen,
  ScreenHeader,
  Stack,
  Text,
  useToast,
} from '@/components/ui';
import { copy } from '@/constants/copy';
import { REASONS } from '@/constants/reasons';
import { useReasonStep } from '@/features/register/useReasonStep';
import { goBack } from '@/lib/navigation';
import { makeStyles, useTheme } from '@/theme';

const useStyles = makeStyles((t) => ({
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space[2],
    minHeight: 48,
    paddingHorizontal: t.space[4],
    borderRadius: t.radius.md,
    borderWidth: 1.5,
    backgroundColor: t.color.bg.surface,
  },
}));

// 칩 순서 고정 (명세서 4.4). 2번(할인·한정 판매) 바로 아래에 마감일 필드가 끼어든다
const FIRST = REASONS.slice(0, 2);
const REST = REASONS.slice(2);

/** 구매 이유 선택 (기능 6·7, 명세서 4.4) — 등록한 물품마다 한 장씩 */
export default function ReasonsScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const step = useReasonStep();
  const [calendarOpen, setCalendarOpen] = useState(false);

  if (step.empty) return <Redirect href="/" />;
  if (!step.item) return null;
  const { item } = step;

  const chip = (r: (typeof REASONS)[number]) => (
    <Chip key={r.id} label={r.label} selected={step.reasons.includes(r.id)} onPress={() => step.toggle(r.id)} />
  );

  const next = () => {
    const result = step.next();
    setCalendarOpen(false);
    if (result !== 'done') return;
    if (step.trapNames.length > 0 && step.batchId) {
      router.replace({ pathname: '/discount', params: { batch: step.batchId } });
    } else {
      toast(copy.register.started(step.createdCount));
      router.dismissTo('/');
    }
  };

  const showTrap = step.isLast && step.trapNames.length > 0;

  return (
    <Screen
      edges={['top', 'bottom']}
      header={
        <ScreenHeader
          onBack={() => goBack('/')}
          backLabel={copy.common.back}
          right={
            <Text variant="label" tone="tertiary">
              {copy.onboarding.step(step.position.current, step.position.total)}
            </Text>
          }
        />
      }
      footer={
        <Stack gap={2}>
          {showTrap && (
            <Text variant="caption" tone="warning" align="center">
              {copy.register.trapNotice(step.trapNames.join(', '))}
            </Text>
          )}
          <Button
            label={!step.isLast ? copy.register.nextItem : showTrap ? copy.register.toTrap : copy.register.start}
            variant={showTrap ? 'bye' : 'primary'}
            size="lg"
            fullWidth
            onPress={next}
          />
        </Stack>
      }
    >
      <ItemSummary name={item.name} price={item.price} category={item.category} imageUri={item.imageUri} />

      <Stack gap={2}>
        <Text variant="title">{copy.register.reasonTitle}</Text>
        <Text variant="label" tone="secondary">
          {copy.register.reasonBody}
        </Text>
      </Stack>

      <Row gap={2} wrap>
        {FIRST.map(chip)}
      </Row>
      {step.reasons.includes('discount_limited') && (
        <Stack gap={2}>
          <Text variant="label" tone="secondary">
            {copy.register.saleEndQuestion}
          </Text>
          <Pressable
            onPress={() => setCalendarOpen((o) => !o)}
            accessibilityRole="button"
            accessibilityLabel={copy.register.saleEndQuestion}
            style={[styles.dateField, { borderColor: calendarOpen ? theme.color.brand.solid : theme.color.border.default }]}
          >
            <Icon name="calendar" size="sm" tone="brand" />
            <Text variant="bodyStrong" tone={step.saleEndsAt ? 'primary' : 'disabled'}>
              {step.saleEndsAt ? copy.register.saleEnd(step.saleEndsAt) : copy.register.saleEndPlaceholder}
            </Text>
          </Pressable>
          {calendarOpen && (
            <Card padding={4}>
              <InlineCalendar
                value={step.saleEndsAt}
                minDate={step.today}
                onChange={(d) => {
                  step.setSaleEndsAt(d);
                  setCalendarOpen(false);
                }}
                weekdayLabels={copy.calendar.weekdays}
                monthLabel={copy.calendar.month}
                prevLabel={copy.calendar.prev}
                nextLabel={copy.calendar.next}
              />
            </Card>
          )}
        </Stack>
      )}
      <Row gap={2} wrap>
        {REST.map(chip)}
      </Row>
      {step.reasons.includes('other') && (
        <Input
          label={copy.register.otherQuestion}
          placeholder={copy.register.otherPlaceholder}
          value={step.otherText}
          onChangeText={step.setOtherText}
        />
      )}

      {step.balance ? (
        <BalanceReminder
          bucketLabel={copy.bucketLabels[step.balance.bucket]}
          limit={step.balance.limit}
          remaining={step.balance.remaining}
          afterPurchase={step.balance.afterPurchase}
        />
      ) : (
        <Card tone="subtle" padding={4}>
          <Text variant="label" tone="secondary">
            {copy.register.noBudget}
          </Text>
        </Card>
      )}

      <Row gap={2}>
        <Icon name="bell" size="sm" tone="tertiary" />
        <Text variant="label" tone="secondary">
          {copy.register.schedule(item.simulation.durationDays, step.notifyTime)}
        </Text>
      </Row>
    </Screen>
  );
}
