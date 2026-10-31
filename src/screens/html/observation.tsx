import { useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { Button, Card, ProgressBar, Row, Stack, Text, Thumbnail } from '@/components/ui';
import {
  AnswerButtons,
  BarRow,
  SwipeCard,
  type SwipeCardHandle,
  type SwipeDirection,
} from '@/components/feature';
import { apkCopy as c, apkMoney as money, apkPeriod } from '@/constants/apkCopy';
import { htmlCopy as h } from '@/constants/htmlCopy';
import { copy } from '@/constants/copy';
import {
  answerLabel,
  num,
  object,
  questionTasks,
  rows,
  seoulDate,
  str,
  taskKey,
  isSwipeQuestion,
  reflectionCounts,
  swipeAnswer,
  validMoney,
} from '@/lib/apkDomain';
import { useTheme } from '@/theme';
import { Action, Field, HtmlScreen, Panel, Product, Stat, useHtmlStyles, type VM } from './shared';

export function Question({ vm }: { vm: VM }) {
  const q = vm.question, spec = object(q.answer_spec), s = useHtmlStyles(), theme = useTheme();
  const [retry, setRetry] = useState(0);
  const [position] = useState(() => new Animated.ValueXY());
  const swipe = useRef<SwipeCardHandle>(null);
  const options = rows(spec.options), tasks = questionTasks(vm.today);
  const step = Math.max(0, tasks.findIndex((t) => vm.task && taskKey(t) === taskKey(vm.task)));
  const label = (code: string) => str(options.find((o) => o.code === code)?.label);
  const saveChoice = async (direction: SwipeDirection) => {
    if (vm.busy) return;
    if (await vm.actions.answer({ choice_code: swipeAnswer(direction) })) vm.go('today');
    else {
      position.setValue({ x: 0, y: 0 });
      setRetry((n) => n + 1);
    }
  };
  // Historical non-swipe answers retain their original meaning and remain readable.
  if (!isSwipeQuestion(q)) return (
    <HtmlScreen vm={vm} title={copy.check.title}>
      <Panel>
        <Text variant="title">{str(q.question)}</Text>
        <Text variant="bodyStrong">{answerLabel(q)}</Text>
        <Text variant="caption" tone="secondary">{h.legacyAnswer}</Text>
      </Panel>
    </HtmlScreen>
  );
  return (
    <HtmlScreen vm={vm} title={copy.check.title}
      right={<Text variant="label">{h.step(step + 1, Math.max(1, tasks.length))}</Text>}>
      <Row gap={1}>
        {tasks.map((t, i) => (
          <Stack key={taskKey(t)} flex={1}><ProgressBar value={i <= step ? 1 : 0} size="sm" /></Stack>
        ))}
      </Row>
      <View pointerEvents={vm.busy ? 'none' : 'auto'}>
        <View style={s.backgroundCard} pointerEvents="none" />
        <SwipeCard key={`${str(q.id)}:${retry}`} ref={swipe} position={position}
          onSwipe={(direction) => { void saveChoice(direction); }}
          overlays={{
            right: { label: label('YES'), icon: 'check', color: theme.color.brand.solid },
            left: { label: label('NO'), icon: 'close', color: theme.color.swipeNo },
            up: { label: label('UNSURE'), icon: 'help', color: theme.color.warning.solid },
          }}>
          <View style={s.questionCard}>
            <Row gap={3}>
              <Thumbnail size="sm" />
              <Stack flex={1} gap={1}>
                <Text variant="bodyStrong">{vm.task?.name}</Text>
                <Text variant="caption" tone="secondary">{str(q.question_date)}</Text>
              </Stack>
            </Row>
            <View style={s.divider} />
            <Text variant="label">
              {vm.task?.kind === 'purchases' ? h.questionAfterPurchase : h.questionImagine}
            </Text>
            <Text variant="title">{str(q.question)}</Text>
            <Stack flex={1} />
            {!!q.reference_text && <Card tone="warning" padding={3}>
              <Text variant="caption" tone="warning">{str(q.reference_text)}</Text>
            </Card>}
          </View>
        </SwipeCard>
      </View>
      <Stack paddingY={3} gap={3}>
        <Text variant="caption" tone="secondary" align="center">{h.swipeHint}</Text>
        <AnswerButtons labels={[label('YES'), label('NO'), label('UNSURE')]}
          hints={[label('YES'), label('NO'), label('UNSURE')]} disabled={vm.busy}
          onAnswer={(i) => swipe.current?.swipe((['right', 'left', 'up'] as const)[i])} />
      </Stack>
    </HtmlScreen>
  );
}

export function Result({ vm }: { vm: VM }) {
  const i = vm.selected,
    sim = object(i.simulation),
    r = object(vm.result.result),
    reflection = r.metric_unit === 'purchase_support' || vm.itemRecords.some(isSwipeQuestion),
    counts = r.reflection_counts == null ? reflectionCounts(vm.itemRecords) : object(r.reflection_counts),
    complete = sim.status === 'COMPLETED',
    final = ['BUY', 'GIVE_UP'].includes(str(i.decision)),
    s = useHtmlStyles();
  const [decision, setDecision] = useState(''),
    [price, setPrice] = useState(str(i.price)),
    [details, setDetails] = useState(false);
  const answered = complete || final ? num(r.answered_days) : vm.itemRecords.filter((q) => q.answer).length;
  return (
    <HtmlScreen vm={vm} title={h.resultTitle}>
      <Product item={i} crop={vm.crops[str(i.id)]} compact />
      <Stack align="center" gap={2} paddingY={4}>
        <Text variant="label" tone="secondary">
          {r.expected_used_days == null ? c.answeredDays : h.resultExpected}
        </Text>
        <Row align="baseline" gap={2}>
          <Text variant="hero" tone="brand">
            {h.days(r.expected_used_days == null ? answered : num(r.expected_used_days))}
          </Text>
          <Text variant="label">
            {r.expected_used_days == null ? h.resultObserved : h.resultExpectedSuffix}
          </Text>
        </Row>
        <Text variant="caption" tone="tertiary">
          {apkPeriod(sim)}
        </Text>
      </Stack>
      <Panel>
        <Row wrap gap={2}>
          {Array.from({ length: Math.min(30, num(sim.duration_days)) }, (_, n) => {
            const date =
              str(sim.start_date) &&
              new Date(Date.parse(str(sim.start_date)) + n * 86400000).toISOString().slice(0, 10);
            const record = vm.itemRecords.find((q) => q.question_date === date);
            return (
              <View key={n} style={[s.day, record?.answer ? s.checked : undefined]}>
                <Text variant="caption" tone={record?.answer ? 'inverse' : 'tertiary'}>
                  {n + 1}
                </Text>
              </View>
            );
          })}
          <Row gap={2}>
            <Text variant="caption" tone="brand">
              {c.answeredDays} {answered}
            </Text>
            <Text variant="caption" tone="tertiary">
              {c.unanswered} {str(r.unsure_days ?? 0)} / {str(r.unanswered_days ?? 0)}
            </Text>
          </Row>
        </Row>
        {!reflection && <Stat
          label={h.resultCost}
          value={r.expected_cost_per_used_day == null ? c.insufficient : money(r.expected_cost_per_used_day)}
        />}
        {reflection && <Stack gap={2}>
          <Text variant="heading">{h.reflectionTitle}</Text>
          <Stat label={h.reflectionPositive} value={h.reflectionCount(num(counts.YES))} />
          <Stat label={h.reflectionUnsure} value={h.reflectionCount(num(counts.UNSURE))} />
          <Stat label={h.reflectionNegative} value={h.reflectionCount(num(counts.NO))} />
          <Text variant="caption" tone="secondary">{h.reflectionNote}</Text>
        </Stack>}
      </Panel>
      {!!(object(vm.result.ai_summary).summary ?? r.response_summary) && (
        <Panel>
          <Text variant="heading">{h.resultSummary}</Text>
          <Text variant="htmlBody">{str(object(vm.result.ai_summary).summary ?? r.response_summary)}</Text>
        </Panel>
      )}
      {!final && (
        <>
          <Text variant="heading">{h.resultDecision}</Text>
          <Row gap={3}>
            <Stack flex={1}>
              <Button
                label={h.resultBuy}
                sublabel={h.resultBuySub}
                fullWidth
                disabled={vm.busy}
                onPress={() => setDecision('BUY')}
              />
            </Stack>
            <Stack flex={1}>
              <Button
                label={h.resultBye}
                sublabel={h.resultByeSub}
                variant="bye"
                fullWidth
                disabled={vm.busy}
                onPress={() => setDecision('GIVE_UP')}
              />
            </Stack>
          </Row>
          {complete ? (
            <Action vm={vm} label={h.resultHold} secondary run={() => setDecision('HOLD')} />
          ) : (
            <Text variant="caption" tone="tertiary">
              {h.earlyDecision}
            </Text>
          )}
        </>
      )}
      {decision && (
        <Panel>
          <Text variant="heading">{c.decision}</Text>
          <Text variant="label">
            {decision === 'BUY' ? c.buyNotice : decision === 'HOLD' ? c.holdNotice : c.byeNotice}
          </Text>
          {decision === 'BUY' && <Field label={c.actualPrice} value={price} set={setPrice} numeric />}
          <Action
            vm={vm}
            label={c.confirm}
            disabled={decision === 'BUY' && !validMoney(price)}
            run={() => vm.finish(vm.actions.decide(decision, price), 'home')}
          />
          <Action vm={vm} label={c.cancel} secondary run={() => setDecision('')} />
        </Panel>
      )}
      <Button label={c.record} variant="ghost" onPress={() => setDetails(!details)} />
      {details &&
        vm.itemRecords.map((q, index) => (
          <Panel key={index}>
            <Text variant="caption" tone="tertiary">
              {str(q.question_date)}
            </Text>
            <Text variant="bodyStrong">{str(q.question)}</Text>
            <Text tone="brand">{answerLabel(q) || c.empty}</Text>
          </Panel>
        ))}
      {object(i.purchase).id != null && str(object(i.purchase).review_due_on) <= seoulDate() && (
        <Action vm={vm} label={c.review} run={() => vm.openReview(object(i.purchase))} />
      )}
    </HtmlScreen>
  );
}

export function Review({ vm }: { vm: VM }) {
  const p = vm.review;
  return (
    <HtmlScreen vm={vm} title={h.reviewTitle}>
      <Product item={p} compact />
      <Text variant="caption" tone="secondary">{h.legacyAnswer}</Text>
      {p.review != null && <Panel>
        <Text variant="heading">{h.comparison}</Text>
        <BarRow label={c.reviewExpected}
          value={p.expected_days_in_review_window == null ? c.insufficient : h.days(num(p.expected_days_in_review_window))}
          ratio={num(p.expected_days_in_review_window) / 14} tone="predicted" />
        <BarRow label={c.reviewActual}
          value={p.actual_days_estimate == null ? c.insufficient : h.days(num(p.actual_days_estimate))}
          ratio={num(p.actual_days_estimate) / 14} />
        <Text variant="bodyStrong">{str(p.verdict)}</Text>
      </Panel>}
    </HtmlScreen>
  );
}
