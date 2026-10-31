import { useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { Button, Card, Chip, Icon, ProgressBar, Row, Stack, Text, Thumbnail } from '@/components/ui';
import {
  AnswerButtons,
  BarRow,
  BucketOption,
  SwipeCard,
  type SwipeCardHandle,
  type SwipeDirection,
} from '@/components/feature';
import { apkCopy as c, apkMoney as money, apkPeriod } from '@/constants/apkCopy';
import { htmlCopy as h, htmlReviewOptions } from '@/constants/htmlCopy';
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
  validAnswer,
  validMoney,
  type Json,
} from '@/lib/apkDomain';
import { useTheme } from '@/theme';
import { Action, Field, HtmlScreen, Panel, Product, Stat, useHtmlStyles, type VM } from './shared';

export function Question({ vm }: { vm: VM }) {
  const q = vm.question,
    spec = object(q.answer_spec),
    s = useHtmlStyles(),
    theme = useTheme();
  const [answer, setAnswer] = useState<Json>(object(q.answer)),
    [retry, setRetry] = useState(0);
  const [position] = useState(() => new Animated.ValueXY()),
    swipe = useRef<SwipeCardHandle>(null);
  const fields = object(spec.fields),
    options = rows(spec.options),
    tasks = questionTasks(vm.today);
  const step = Math.max(
    0,
    tasks.findIndex((t) => vm.task && taskKey(t) === taskKey(vm.task)),
  );
  const yesNo =
    options.length === 3 && ['YES', 'NO', 'UNSURE'].every((code) => options.some((o) => o.code === code));
  const label = (code: string) => str(options.find((o) => o.code === code)?.label);
  const saveChoice = async (direction: SwipeDirection) => {
    if (vm.busy) return;
    const choice_code = { right: 'YES', left: 'NO', up: 'UNSURE' }[direction];
    if (await vm.actions.answer({ choice_code })) vm.go('today');
    else {
      position.setValue({ x: 0, y: 0 });
      setRetry((n) => n + 1);
    }
  };
  const card = (
    <View style={[s.questionCard, !yesNo && s.questionInputCard]}>
      <Row gap={3}>
        <Thumbnail size="sm" />
        <Stack flex={1} gap={1}>
          <Text variant="bodyStrong">{vm.task?.name}</Text>
          <Text variant="caption" tone="secondary">
            {str(q.question_date)}
          </Text>
        </Stack>
      </Row>
      <View style={s.divider} />
      <Text variant="label">{h.questionImagine}</Text>
      <Text variant="title">{str(q.question)}</Text>
      <Stack flex={1} />
      {q.usage_window != null && (
        <Text variant="caption" tone="secondary">
          {str(object(q.usage_window).start ?? object(q.usage_window).start_date)} ~{' '}
          {str(object(q.usage_window).end ?? object(q.usage_window).end_date)}
        </Text>
      )}
      {!!q.reference_text && (
        <Card tone="warning" padding={3}>
          <Row gap={2}>
            <Icon name="ai" tone="warning" size="sm" />
            <Stack flex={1}>
              <Text variant="caption" tone="warning">
                {str(q.reference_text)}
              </Text>
            </Stack>
          </Row>
        </Card>
      )}
    </View>
  );
  return (
    <HtmlScreen
      vm={vm}
      title={copy.check.title}
      right={<Text variant="label">{h.step(step + 1, Math.max(1, tasks.length))}</Text>}
      footer={
        !yesNo && (
          <Action
            vm={vm}
            label={c.answer}
            disabled={!validAnswer(spec, answer)}
            run={() => vm.finish(vm.actions.answer(answer), 'today')}
          />
        )
      }
    >
      <Row gap={1}>
        {tasks.map((t, i) => (
          <Stack key={taskKey(t)} flex={1}>
            <ProgressBar value={i <= step ? 1 : 0} size="sm" />
          </Stack>
        ))}
      </Row>
      <View pointerEvents={vm.busy ? 'none' : 'auto'}>
        <View style={s.backgroundCard} pointerEvents="none" />
        {yesNo ? (
          <SwipeCard
            key={retry}
            ref={swipe}
            position={position}
            onSwipe={(direction) => {
              void saveChoice(direction);
            }}
            overlays={{
              right: {
                label: label('YES'),
                icon: 'check',
                color: theme.color.brand.solid,
              },
              left: {
                label: label('NO'),
                icon: 'close',
                color: theme.color.swipeNo,
              },
              up: {
                label: label('UNSURE'),
                icon: 'help',
                color: theme.color.warning.solid,
              },
            }}
          >
            {card}
          </SwipeCard>
        ) : (
          card
        )}
      </View>
      {yesNo ? (
        <Stack paddingY={3}>
          <AnswerButtons
            labels={[label('YES'), label('NO'), label('UNSURE')]}
            hints={[label('YES'), label('NO'), label('UNSURE')]}
            disabled={vm.busy}
            onAnswer={(i) => swipe.current?.swipe((['right', 'left', 'up'] as const)[i])}
          />
        </Stack>
      ) : (
        <Panel>
          <Row gap={2} wrap>
            {options.map((o) => (
              <Chip
                key={str(o.code)}
                label={str(o.label)}
                selected={answer.choice_code === o.code}
                disabled={vm.busy}
                onPress={() => setAnswer({ choice_code: o.code })}
              />
            ))}
          </Row>
          {spec.type === 'INTEGER' && (
            <Field
              label={`${c.number} (${spec.minimum} ~ ${spec.maximum})`}
              value={str(answer.number_value)}
              set={(v) => setAnswer(v ? { number_value: Number(v) } : {})}
              numeric
            />
          )}
          {spec.type === 'TEXT' && (
            <Field
              label={c.text}
              value={str(answer.text_value)}
              set={(v) =>
                setAnswer({
                  text_value: v.slice(0, num(spec.max_length ?? 300)),
                })
              }
            />
          )}
          {spec.type === 'OBJECT' &&
            Object.entries(fields).map(([key, field]) => (
              <Stack key={key} gap={2}>
                <Text variant="label">{str(object(field).label) || key}</Text>
                <Row gap={2} wrap>
                  {rows(object(field).options).map((o) => (
                    <Chip
                      key={str(o.code)}
                      label={str(o.label)}
                      selected={object(answer.object_value)[key] === o.code}
                      onPress={() =>
                        setAnswer({
                          object_value: {
                            ...object(answer.object_value),
                            [key]: o.code,
                          },
                        })
                      }
                    />
                  ))}
                </Row>
              </Stack>
            ))}
        </Panel>
      )}
    </HtmlScreen>
  );
}

export function Result({ vm }: { vm: VM }) {
  const i = vm.selected,
    sim = object(i.simulation),
    r = object(vm.result.result),
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
        <Stat
          label={h.resultCost}
          value={r.expected_cost_per_used_day == null ? c.insufficient : money(r.expected_cost_per_used_day)}
        />
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
            {complete && (
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
            )}
          </Row>
          {complete ? (
            <Action vm={vm} label={h.resultHold} secondary run={() => setDecision('HOLD')} />
          ) : (
            <Text variant="caption" tone="tertiary">
              {c.earlyBuy}
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
  const p = vm.review,
    s = useHtmlStyles(),
    [frequency, setFrequency] = useState(str(object(p.review).frequency));
  return (
    <HtmlScreen vm={vm} title={h.reviewTitle}>
      <Product item={p} compact />
      <Stack gap={2} paddingY={2}>
        <Text variant="title">{h.reviewQuestion(str(p.item_name))}</Text>
        <Text variant="htmlBody" tone="secondary">
          {h.reviewBody}
        </Text>
        <Text variant="caption" tone="tertiary">
          {str(p.review_start)} ~ {str(p.review_end)}
        </Text>
      </Stack>
      <View style={s.twoColumns}>
        {htmlReviewOptions.map((o) => (
          <View key={o.code} style={s.half}>
            <BucketOption
              label={o.label}
              range={o.range}
              selected={frequency === o.code}
              onPress={() => setFrequency(o.code)}
            />
          </View>
        ))}
      </View>
      <Action vm={vm} label={c.save} disabled={!frequency} run={() => vm.actions.review(frequency)} />
      {p.review != null && (
        <>
          <Panel>
            <Text variant="heading">{h.comparison}</Text>
            <BarRow
              label={c.reviewExpected}
              value={
                p.expected_days_in_review_window == null
                  ? c.insufficient
                  : h.days(num(p.expected_days_in_review_window))
              }
              ratio={num(p.expected_days_in_review_window) / 14}
              tone="predicted"
            />
            <BarRow
              label={c.reviewActual}
              value={p.actual_days_estimate == null ? c.insufficient : h.days(num(p.actual_days_estimate))}
              ratio={num(p.actual_days_estimate) / 14}
            />
            <Stat label={c.difference} value={p.difference_percentage_points ?? c.insufficient} />
            <Text variant="bodyStrong">{str(p.verdict)}</Text>
          </Panel>
          <Action vm={vm} label={copy.tabs.report} secondary run={() => vm.go('report')} />
        </>
      )}
      <Text variant="caption" tone="tertiary">
        {c.reviewNote}
      </Text>
    </HtmlScreen>
  );
}
