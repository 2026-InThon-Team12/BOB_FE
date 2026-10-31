import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Linking } from 'react-native';
import { Button, Card, Chip, Input, Row, Screen, Stack, Text, Thumbnail, InlineCalendar } from '@/components/ui';
import {
  apkCategories,
  apkCopy as c,
  apkFrequencies,
  apkMoney as money,
  apkPeriod,
  apkRegistrationPeriod,
  apkReasons,
  apkTabs,
  apkTitles,
} from '@/constants/apkCopy';
import { copy } from '@/constants/copy';
import { useApk } from '@/features/apklike/useApk';
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
  validDate,
  validDraft,
  validMoney,
  type Json,
} from '@/lib/apkDomain';
import { useApkPush } from '@/features/apklike/useApkPush';

type VM = ReturnType<typeof useApk>;
function Panel({ children }: { children: ReactNode }) {
  return (
    <Card>
      <Stack gap={3}>{children}</Stack>
    </Card>
  );
}
function Stat({ label, value }: { label: string; value: unknown }) {
  return (
    <Row justify="space-between">
      <Text tone="secondary">{label}</Text>
      <Text variant="bodyStrong">{str(value)}</Text>
    </Row>
  );
}
function Product({ item, crop }: { item: Json; crop?: string }) {
  return (
    <Row gap={3}>
      <Thumbnail uri={crop ? `data:image/jpeg;base64,${crop}` : str(item.image_url) || undefined} />
      <Stack gap={1} flex={1}>
        <Text variant="heading">{str(item.name ?? item.item_name)}</Text>
        <Text tone="secondary">{apkCategories[str(item.category)]}</Text>
        <Text>{money(item.price ?? item.target_amount)}</Text>
      </Stack>
    </Row>
  );
}
function Field({
  label,
  value,
  set,
  numeric = false,
  disabled = false,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  numeric?: boolean;
  disabled?: boolean;
}) {
  return (
    <Input
      label={label}
      value={value}
      onChangeText={(v) => {
        if (!numeric || /^\d*$/.test(v)) set(v);
      }}
      keyboardType={numeric ? 'number-pad' : 'default'}
      editable={!disabled}
    />
  );
}
function DateField({
  label,
  value,
  set,
  min,
  max,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  min?: string;
  max?: string;
}) {
  const [open, toggle] = useState(false);
  return (
    <Stack gap={2}>
      <Button variant="secondary" label={`${label} ${value}`} onPress={() => toggle(!open)} />
      {open && (
        <InlineCalendar
          value={value || seoulDate()}
          minDate={min ?? '1900-01-01'}
          maxDate={max}
          onChange={(d) => {
            set(d);
            toggle(false);
          }}
          weekdayLabels={copy.calendar.weekdays}
          monthLabel={copy.calendar.month}
          prevLabel={copy.calendar.prev}
          nextLabel={copy.calendar.next}
        />
      )}
    </Stack>
  );
}
function Action({
  vm,
  label,
  run,
  disabled = false,
  secondary = false,
}: {
  vm: VM;
  label: string;
  run: () => unknown;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Button
      label={label}
      variant={secondary ? 'secondary' : 'primary'}
      disabled={vm.busy || disabled}
      onPress={() => {
        void run();
      }}
      fullWidth
    />
  );
}
async function openUrl(value: unknown) {
  const url = str(value);
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' && !parsed.username && !parsed.password) await Linking.openURL(url);
  } catch {
    /* Invalid URLs never open external apps. */
  }
}

export default function ApkScreen() {
  const vm = useApk();
  const tab = vm.page in apkTabs;
  return (
    <Screen
      edges={['top', 'bottom']}
      title={apkTitles[vm.page]}
      header={
        <Stack padding={3}>
          <Row gap={2}>
            {!tab && <Action vm={vm} label={c.back} run={vm.back} secondary />}
            <Action
              vm={vm}
              label={c.refresh}
              run={() => (vm.ready ? vm.actions.refresh(vm.page) : vm.actions.init())}
              secondary
            />
            {vm.page === 'home' && <Action vm={vm} label={c.settings} run={() => vm.go('settings')} secondary />}
          </Row>
        </Stack>
      }
      footer={
        tab ? (
          <Row justify="space-between">
            {Object.entries(apkTabs).map(([page, label]) => (
              <Button
                key={page}
                label={label}
                variant={vm.page === page ? 'primary' : 'ghost'}
                disabled={vm.busy}
                onPress={() => vm.go(page)}
              />
            ))}
          </Row>
        ) : undefined
      }
    >
      {vm.busy && <ActivityIndicator />}
      {(vm.error || vm.notice) && (
        <Card tone={vm.error ? 'warning' : 'subtle'}>
          <Text>{vm.error || vm.notice}</Text>
          <Button label={c.close} variant="ghost" onPress={vm.actions.dismiss} />
        </Card>
      )}
      {vm.ready && <Page key={vm.page} vm={vm} />}
    </Screen>
  );
}
function Page({ vm }: { vm: VM }) {
  switch (vm.page) {
    case 'home':
      return <Home vm={vm} />;
    case 'add':
      return <Add vm={vm} />;
    case 'drafts':
    case 'reasons':
    case 'registrationPreview':
      return <Drafts vm={vm} />;
    case 'discount':
      return <Discount vm={vm} />;
    case 'today':
      return <Today vm={vm} />;
    case 'question':
      return <Question vm={vm} />;
    case 'result':
      return <Result vm={vm} />;
    case 'review':
      return <Review vm={vm} />;
    case 'goal':
      return <Goal vm={vm} />;
    case 'goalSetup':
      return <GoalSetup vm={vm} />;
    case 'shelf':
      return <Shelf vm={vm} />;
    case 'impulse':
      return <Impulse vm={vm} />;
    case 'wallet':
      return <Wallet vm={vm} />;
    case 'report':
      return <Report vm={vm} />;
    case 'settings':
      return <Settings vm={vm} />;
    case 'history':
      return (
        <>
          {!vm.history.length && <Text>{c.empty}</Text>}
          {vm.history.map((i) => (
            <Panel key={str(i.id)}>
              <Product item={i} crop={vm.crops[str(i.id)]} />
              <Text>
                {i.decision === 'BUY' ? c.buy : i.decision === 'GIVE_UP' ? c.bye : apkPeriod(object(i.simulation))}
              </Text>
              <Action vm={vm} label={c.record} run={() => vm.openItem(str(i.id))} />
            </Panel>
          ))}
          {vm.historyMore && <Action vm={vm} label={c.more} run={vm.actions.moreHistory} />}
        </>
      );
    default:
      return null;
  }
}
function Home({ vm }: { vm: VM }) {
  const count =
    questionTasks(vm.today).filter((t) => !vm.records[taskKey(t)]?.answer).length +
    rows(vm.today.decisions).length +
    rows(vm.today.reviews).length;
  return (
    <>
      <Panel>
        <Text variant="title">{c.thinking}</Text>
        <Action vm={vm} label={`${c.today} · ${count}`} run={() => vm.go('today')} />
        <Action vm={vm} label={c.add} run={() => vm.go('add')} />
      </Panel>
      {vm.goal.id ? (
        <Panel>
          <Product item={vm.goal} />
          <Stat label={c.savedAmount} value={money(vm.goal.saved_amount)} />
          <Action vm={vm} label={apkTitles.goal} run={() => vm.go('goal')} />
        </Panel>
      ) : (
        <Action vm={vm} label={c.firstGoal} run={() => vm.go('goalSetup')} />
      )}
      {rows(vm.home.simulations).map((i) => (
        <Panel key={str(i.id)}>
          <Product item={i} crop={vm.crops[str(i.id)]} />
          <Text>{apkPeriod(object(i.simulation))}</Text>
          <Action vm={vm} label={c.record} run={() => vm.openItem(str(i.id))} secondary />
        </Panel>
      ))}
      <Action vm={vm} label={c.history} run={() => vm.go('history')} secondary />
    </>
  );
}
function Add({ vm }: { vm: VM }) {
  const [method, setMethod] = useState<'manual' | 'url'>('manual');
  const [name, setName] = useState(''),
    [price, setPrice] = useState(''),
    [url, setUrl] = useState('');
  return (
    <>
      <Action vm={vm} label={c.importPhoto} run={vm.pickPhoto} />
      {vm.pendingPhoto && (
        <Panel>
          <Text variant="heading">{c.replacePhoto}</Text>
          <Text>{c.replaceBody}</Text>
          <Action vm={vm} label={c.replace} run={() => vm.usePhoto(true)} />
          <Action vm={vm} label={c.append} run={() => vm.usePhoto(false)} />
          <Action vm={vm} label={c.cancel} run={vm.cancelPhoto} secondary />
        </Panel>
      )}
      <Row gap={2}>
        <Chip label={c.manual} selected={method === 'manual'} onPress={() => setMethod('manual')} />
        <Chip label={c.importUrl} selected={method === 'url'} onPress={() => setMethod('url')} />
      </Row>
      <Panel>
        {method === 'url' ? (
          <Field label={c.url} value={url} set={setUrl} />
        ) : (
          <>
            <Field label={c.name} value={name} set={setName} />
            <Field label={c.price} value={price} set={setPrice} numeric />
          </>
        )}
        <Action
          vm={vm}
          label={c.load}
          disabled={method === 'url' ? !url.startsWith('https://') : !name.trim() || (!!price && !validMoney(price))}
          run={() => vm.finish(vm.actions.importDraft(method, name, price, url), 'drafts')}
        />
        <Action
          vm={vm}
          label={c.direct}
          secondary
          run={() =>
            vm.finish(
              vm.actions.addBlank({
                name,
                price,
                source: method === 'url' ? 'URL' : 'MANUAL',
                source_url: method === 'url' && url.startsWith('https://') ? url : '',
              }),
              'drafts',
            )
          }
        />
      </Panel>
      {vm.drafts.length > 0 && (
        <Action vm={vm} label={`${c.resume} (${vm.drafts.length})`} run={() => vm.go('drafts')} secondary />
      )}
    </>
  );
}
function Drafts({ vm }: { vm: VM }) {
  return (
    <>
      {vm.page === 'registrationPreview' && <Text>{c.tomorrow}</Text>}
      {vm.drafts.map((d, i) => (
        <Panel key={i}>
          <Product item={d} crop={d.crop} />
          {vm.page === 'drafts' ? (
            <>
              <Field
                label={c.name}
                value={d.name}
                set={(name) => {
                  void vm.actions.draft(i, { name: name.slice(0, 200) });
                }}
              />
              <Field
                label={c.price}
                value={d.price}
                set={(price) => {
                  void vm.actions.draft(i, { price });
                }}
                numeric
              />
              <Row wrap gap={2}>
                {Object.entries(apkCategories).map(([code, label]) => (
                  <Chip
                    key={code}
                    label={label}
                    selected={d.category === code}
                    onPress={() => {
                      void vm.actions.draft(i, { category: code });
                    }}
                  />
                ))}
              </Row>
              <Action vm={vm} label={c.exclude} secondary run={() => vm.actions.removeDraft(i)} />
            </>
          ) : vm.page === 'reasons' ? (
            <>
              {Object.entries(apkReasons).map(([code, label]) => (
                <Chip
                  key={code}
                  label={label}
                  selected={d.reasons.includes(code)}
                  onPress={() => {
                    const checked = !d.reasons.includes(code);
                    void vm.actions.draft(i, {
                      reasons: checked ? [...d.reasons, code] : d.reasons.filter((r) => r !== code),
                      needed: code === 'EXTRA_DISCOUNT' ? !checked : d.needed,
                    });
                  }}
                />
              ))}
              {d.reasons.includes('OTHER') && (
                <Field
                  label={c.other}
                  value={d.other}
                  set={(other) => {
                    void vm.actions.draft(i, { other: other.slice(0, 300) });
                  }}
                />
              )}
              {d.reasons.includes('DISCOUNT_LIMITED') && (
                <DateField
                  label={c.deadline}
                  value={d.deadline}
                  min={seoulDate()}
                  set={(deadline) => {
                    void vm.actions.draft(i, { deadline });
                  }}
                />
              )}
            </>
          ) : (
            <Text>{apkRegistrationPeriod(num(rows(vm.registrationPreview.items)[i]?.duration_days))}</Text>
          )}
        </Panel>
      ))}
      {vm.page === 'drafts' ? (
        <>
          <Action
            vm={vm}
            label={c.addBlank}
            secondary
            disabled={vm.drafts.length >= 20}
            run={() => vm.actions.addBlank()}
          />
          <Action
            vm={vm}
            label={c.reasons}
            disabled={!vm.drafts.length || vm.drafts.some((d) => !d.name.trim() || !validMoney(d.price))}
            run={() => vm.go('reasons')}
          />
        </>
      ) : vm.page === 'reasons' ? (
        <Action
          vm={vm}
          label={c.preview}
          disabled={!vm.drafts.length || !vm.drafts.every(validDraft)}
          run={() =>
            vm.finish(
              vm.actions.preview(),
              vm.drafts.some((d) => d.reasons.includes('EXTRA_DISCOUNT')) ? 'discount' : 'registrationPreview',
            )
          }
        />
      ) : (
        <>
          <Text>{c.localRecords}</Text>
          <Action
            vm={vm}
            label={c.start}
            disabled={!vm.drafts.length}
            run={() => vm.finish(vm.actions.register(), 'home')}
          />
        </>
      )}
    </>
  );
}
function Discount({ vm }: { vm: VM }) {
  const [minimum, setMinimum] = useState(''),
    [value, setValue] = useState(''),
    [shipping, setShipping] = useState(''),
    [threshold, setThreshold] = useState(''),
    [unit, setUnit] = useState('PCT'),
    [free, setFree] = useState(false);
  const change = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    vm.actions.clearDiscount();
  };
  const valid =
    [minimum, value, shipping].every((v) => validMoney(v, false)) &&
    (!free || validMoney(threshold, false)) &&
    (unit !== 'PCT' || Number(value) <= 100);
  return (
    <>
      <Text>{c.requiredOnly}</Text>
      {vm.drafts.map((d, i) => (
        <Chip
          key={i}
          label={`${d.name} · ${money(d.price)}`}
          selected={d.needed}
          onPress={() => {
            void vm.actions.draft(i, { needed: !d.needed });
          }}
        />
      ))}
      <Panel>
        <Field label={c.minimum} value={minimum} set={change(setMinimum)} numeric />
        <Row gap={2}>
          {['PCT', 'WON'].map((u) => (
            <Chip
              key={u}
              label={u === 'PCT' ? c.pct : c.won}
              selected={unit === u}
              onPress={() => change(setUnit)(u)}
            />
          ))}
        </Row>
        <Field label={c.discountValue} value={value} set={change(setValue)} numeric />
        <Field label={c.shipping} value={shipping} set={change(setShipping)} numeric />
        <Chip
          label={c.freeShipping}
          selected={free}
          onPress={() => {
            setFree(!free);
            vm.actions.clearDiscount();
          }}
        />
        {free && <Field label={c.freeMinimum} value={threshold} set={change(setThreshold)} numeric />}
        <Action
          vm={vm}
          label={c.compare}
          disabled={!valid}
          run={() =>
            vm.actions.discount({
              minimum_amount: Number(minimum),
              unit,
              value: Number(value),
              shipping_fee: Number(shipping),
              free_shipping_enabled: free,
              ...(free ? { free_shipping_minimum: Number(threshold) } : {}),
            })
          }
        />
      </Panel>
      {vm.discountRule && (
        <>
          {['needed', 'all'].map((key) => {
            const quote = object(vm.discount[key]);
            return (
              <Panel key={key}>
                <Text variant="heading">{key === 'needed' ? c.needed : c.all}</Text>
                {(['subtotal', 'discount', 'shipping', 'total'] as const).map((k) => (
                  <Stat key={k} label={c[k]} value={money(quote[k])} />
                ))}
              </Panel>
            );
          })}
          <Stat label={c.extra} value={money(vm.discount.extra_spending)} />
          <Text>{str(vm.discount.shipping_notice)}</Text>
          <Action vm={vm} label={c.needed} run={() => vm.finish(vm.actions.register('NEEDED'), 'home')} />
          <Action vm={vm} label={c.all} secondary run={() => vm.finish(vm.actions.register('ALL'), 'home')} />
        </>
      )}
    </>
  );
}
function Today({ vm }: { vm: VM }) {
  const tasks = questionTasks(vm.today);
  return (
    <>
      <Text>{str(vm.today.date)}</Text>
      {tasks.map((t) => (
        <Panel key={taskKey(t)}>
          <Text variant="heading">{t.name}</Text>
          <Action
            vm={vm}
            label={vm.records[taskKey(t)]?.answer ? c.answered : c.openQuestion}
            run={() => vm.finish(vm.actions.openQuestion(t), 'question')}
          />
        </Panel>
      ))}
      {rows(vm.today.decisions).map((i) => (
        <Panel key={str(i.item_id)}>
          <Text>{str(i.name)}</Text>
          <Action vm={vm} label={c.record} run={() => vm.openItem(str(i.item_id))} />
        </Panel>
      ))}
      {rows(vm.today.reviews).map((p) => (
        <Panel key={str(p.id)}>
          <Text>{str(p.item_name)}</Text>
          <Action vm={vm} label={c.review} run={() => vm.openReview(p)} />
        </Panel>
      ))}
      {!tasks.length && !rows(vm.today.decisions).length && !rows(vm.today.reviews).length && <Text>{c.empty}</Text>}
    </>
  );
}
function Question({ vm }: { vm: VM }) {
  const q = vm.question,
    spec = object(q.answer_spec);
  const [answer, setAnswer] = useState<Json>(object(q.answer));
  const fields = object(spec.fields);
  return (
    <>
      <Panel>
        <Text>
          {vm.task?.name} · {str(q.question_date)}
        </Text>
        <Text variant="title">{str(q.question)}</Text>
        <Text>{str(q.reference_text)}</Text>
        {q.usage_window != null && (
          <Text>
            {str(object(q.usage_window).start ?? object(q.usage_window).start_date)} ~{' '}
            {str(object(q.usage_window).end ?? object(q.usage_window).end_date)}
          </Text>
        )}
      </Panel>
      <Panel>
        {rows(spec.options).map((o) => (
          <Chip
            key={str(o.code)}
            label={str(o.label)}
            selected={answer.choice_code === o.code}
            onPress={() => setAnswer({ choice_code: o.code })}
          />
        ))}
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
            set={(v) => setAnswer({ text_value: v.slice(0, num(spec.max_length ?? 300)) })}
          />
        )}
        {spec.type === 'OBJECT' &&
          Object.entries(fields).map(([key, field]) => (
            <Stack key={key} gap={2}>
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
            </Stack>
          ))}
      </Panel>
      <Text>{c.localRecords}</Text>
      <Action
        vm={vm}
        label={c.answer}
        disabled={!validAnswer(spec, answer)}
        run={() => vm.finish(vm.actions.answer(answer), 'today')}
      />
    </>
  );
}
function Result({ vm }: { vm: VM }) {
  const i = vm.selected,
    sim = object(i.simulation),
    r = object(vm.result.result),
    complete = sim.status === 'COMPLETED',
    final = ['BUY', 'GIVE_UP'].includes(str(i.decision));
  const [decision, setDecision] = useState(''),
    [price, setPrice] = useState(str(i.price));
  return (
    <>
      <Panel>
        <Product item={i} crop={vm.crops[str(i.id)]} />
        <Text>{apkPeriod(sim)}</Text>
        <Stat
          label={c.answeredDays}
          value={complete || final ? r.answered_days : vm.itemRecords.filter((q) => q.answer).length}
        />
        <Stat label={c.unanswered} value={`${r.unsure_days ?? 0} / ${r.unanswered_days ?? 0}`} />
        <Stat label={c.expected} value={r.expected_used_days ?? c.insufficient} />
        <Stat label={c.cost} value={money(r.expected_cost_per_used_day)} />
        <Text>{str(object(vm.result.ai_summary).summary ?? r.response_summary)}</Text>
      </Panel>
      {vm.itemRecords.map((q, index) => (
        <Panel key={index}>
          <Text>{str(q.question_date)}</Text>
          <Text>{str(q.question)}</Text>
          <Text tone="brand">{answerLabel(q) || c.empty}</Text>
        </Panel>
      ))}
      {!final && (
        <>
          <Action vm={vm} label={c.buy} run={() => setDecision('BUY')} />
          {complete ? (
            <>
              <Action vm={vm} label={c.hold} secondary run={() => setDecision('HOLD')} />
              <Action vm={vm} label={c.bye} run={() => setDecision('GIVE_UP')} />
            </>
          ) : (
            <Text>{c.earlyBuy}</Text>
          )}
        </>
      )}
      {decision && (
        <Panel>
          <Text variant="heading">{c.decision}</Text>
          <Text>{decision === 'BUY' ? c.buyNotice : decision === 'HOLD' ? c.holdNotice : c.byeNotice}</Text>
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
      {object(i.purchase).id != null && str(object(i.purchase).review_due_on) <= seoulDate() && (
        <Action vm={vm} label={c.review} run={() => vm.openReview(object(i.purchase))} />
      )}
    </>
  );
}
function Review({ vm }: { vm: VM }) {
  const p = vm.review;
  const [frequency, setFrequency] = useState(str(object(p.review).frequency));
  return (
    <>
      <Text variant="heading">{str(p.item_name)}</Text>
      <Text>
        {str(p.review_start)} ~ {str(p.review_end)}
      </Text>
      {Object.entries(apkFrequencies).map(([code, label]) => (
        <Chip key={code} label={label} selected={frequency === code} onPress={() => setFrequency(code)} />
      ))}
      <Action vm={vm} label={c.save} disabled={!frequency} run={() => vm.actions.review(frequency)} />
      {p.review != null && (
        <Panel>
          <Stat label={c.difference} value={p.difference_percentage_points ?? c.insufficient} />
          <Stat label={c.reviewExpected} value={p.expected_days_in_review_window ?? c.insufficient} />
          <Stat label={c.reviewActual} value={p.actual_days_estimate ?? c.insufficient} />
          <Text>{str(p.verdict)}</Text>
          <Text>{c.reviewNote}</Text>
        </Panel>
      )}
    </>
  );
}
function Goal({ vm }: { vm: VM }) {
  const g = vm.goal;
  const [name, setName] = useState(''),
    [amount, setAmount] = useState(''),
    [url, setUrl] = useState(str(g.source_url));
  return (
    <>
      {g.id != null && (
        <Panel>
          <Product item={g} />
          <Stat label={c.savedAmount} value={money(g.saved_amount)} />
          <Stat label={c.remaining} value={money(g.remaining_amount)} />
          <Stat label={c.estimate} value={g.estimated_completion_on ?? c.insufficient} />
          <Text>{c.virtual}</Text>
          {g.can_shop === true && <Action vm={vm} label={c.shop} run={() => openUrl(g.source_url)} />}
          <Field label={c.url} value={url} set={setUrl} />
          <Action
            vm={vm}
            label={c.linkSave}
            disabled={!!url && !url.startsWith('https://')}
            run={() => vm.actions.goalUrl(url)}
            secondary
          />
        </Panel>
      )}
      <Action vm={vm} label={c.goalSetup} run={() => vm.go('goalSetup')} />
      <Action vm={vm} label={c.shelf} secondary run={() => vm.go('shelf')} />
      <Panel>
        <Field label={c.impulseName} value={name} set={setName} />
        <Field label={c.amount} value={amount} set={setAmount} numeric />
        <Action
          vm={vm}
          label={c.impulseCompare}
          disabled={!name.trim() || !validMoney(amount)}
          run={() => vm.finish(vm.actions.impulse(name.trim(), amount), 'impulse')}
        />
      </Panel>
    </>
  );
}
function GoalSetup({ vm }: { vm: VM }) {
  const [name, setName] = useState(''),
    [amount, setAmount] = useState(''),
    [url, setUrl] = useState(''),
    [image, setImage] = useState(''),
    [carry, setCarry] = useState(true),
    [previewed, setPreviewed] = useState('');
  const body = {
      name: name.trim(),
      target_amount: Number(amount),
      ...(url ? { source_url: url.trim() } : {}),
      ...(image ? { image_url: image } : {}),
    },
    signature = JSON.stringify([body, carry]);
  const valid = !!name.trim() && validMoney(amount) && (!url || url.startsWith('https://'));
  return (
    <>
      <Panel>
        <Field label={c.goalName} value={name} set={(v) => setName(v.slice(0, 100))} />
        <Field label={c.target} value={amount} set={setAmount} numeric />
        <Field label={c.url} value={url} set={setUrl} />
        {vm.setup.mode === 'CHANGE' && <Chip label={c.carry} selected={carry} onPress={() => setCarry(!carry)} />}
      </Panel>
      {rows(vm.setup.candidates).length > 0 && (
        <Panel>
          <Text>{c.candidates}</Text>
          {rows(vm.setup.candidates).map((i, index) => (
            <Action
              key={index}
              vm={vm}
              label={`${i.name} · ${money(i.target_amount)}`}
              secondary
              run={() => {
                setName(str(i.name));
                setAmount(str(i.target_amount));
                setUrl(str(i.source_url));
                setImage(str(i.image_url));
              }}
            />
          ))}
        </Panel>
      )}
      <Action
        vm={vm}
        label={c.goalPreview}
        disabled={!valid}
        secondary
        run={async () => {
          if (await vm.actions.goalPreview(body, carry)) setPreviewed(signature);
        }}
      />
      {previewed === signature && (
        <Panel>
          <Stat label={c.starting} value={money(vm.goalPreview.starting_saved_amount)} />
          <Stat label={c.remaining} value={money(vm.goalPreview.remaining_amount)} />
          <Text>{str(vm.goalPreview.message)}</Text>
        </Panel>
      )}
      <Action
        vm={vm}
        label={c.goalSave}
        disabled={!valid}
        run={() => vm.finish(vm.actions.goalSave(body, carry), 'goal')}
      />
    </>
  );
}
function Shelf({ vm }: { vm: VM }) {
  return (
    <>
      <Stat label={c.shelf} value={vm.shelf.count ?? 0} />
      <Stat label={c.target} value={money(vm.shelf.total_target_amount)} />
      {rows(vm.shelf.items).map((i) => (
        <Panel key={str(i.id)}>
          <Product item={i} />
          <Text>{str(i.achieved_on)}</Text>
          {i.can_shop === true && <Action vm={vm} label={c.shop} run={() => openUrl(i.source_url)} />}
        </Panel>
      ))}
      {!rows(vm.shelf.items).length && <Text>{c.empty}</Text>}
    </>
  );
}
function Impulse({ vm }: { vm: VM }) {
  const i = vm.impulse;
  return (
    <>
      <Panel>
        <Text variant="title">{str(i.name)}</Text>
        <Text variant="heading">{money(i.amount)}</Text>
        <Text>{str(i.message)}</Text>
        <Stat label={c.ifResisted} value={i.if_resisted_on ?? c.insufficient} />
        <Stat label={c.ifPurchased} value={i.if_purchased_on ?? c.insufficient} />
      </Panel>
      {['RESISTED', 'PURCHASED'].includes(str(i.decision)) ? (
        <Action vm={vm} label={c.undo} secondary run={() => vm.actions.impulseDecision('CANCELLED')} />
      ) : (
        <>
          <Action vm={vm} label={c.resisted} run={() => vm.actions.impulseDecision('RESISTED')} />
          <Action vm={vm} label={c.purchased} secondary run={() => vm.actions.impulseDecision('PURCHASED')} />
        </>
      )}
    </>
  );
}
function Month({ vm }: { vm: VM }) {
  const shift = (delta: number) => {
    const [y, m] = vm.month.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
  };
  return (
    <Row justify="space-between">
      <Action vm={vm} label={c.previous} secondary run={() => vm.actions.changeMonth(shift(-1), vm.page)} />
      <Text>{vm.month}</Text>
      <Action
        vm={vm}
        label={c.next}
        secondary
        disabled={vm.month >= seoulDate().slice(0, 7)}
        run={() => vm.actions.changeMonth(shift(1), vm.page)}
      />
    </Row>
  );
}
function Budget({ vm }: { vm: VM }) {
  const [form, setForm] = useState<Json>(object(vm.wallet.plan));
  const keys = ['income', 'food', 'living', 'transport', 'savings', 'hourly_wage'] as const;
  const valid =
    keys.filter((k) => k !== 'hourly_wage').every((k) => validMoney(form[k], false)) &&
    (!str(form.hourly_wage) || validMoney(form.hourly_wage));
  return (
    <Panel>
      {keys.map((k) => (
        <Field key={k} label={c[k]} value={str(form[k])} set={(v) => setForm({ ...form, [k]: v })} numeric />
      ))}
      <Action
        vm={vm}
        label={c.save}
        disabled={!valid}
        run={() =>
          vm.actions.budget(Object.fromEntries(keys.filter((k) => str(form[k])).map((k) => [k, Number(form[k])])))
        }
      />
    </Panel>
  );
}
function Wallet({ vm }: { vm: VM }) {
  const [editing, setEditing] = useState(false),
    [expense, setExpense] = useState<Json | null>(null),
    [deleting, setDeleting] = useState('');
  const w = vm.wallet;
  return (
    <>
      <Month vm={vm} />
      <Panel>
        <Stat label={c.balance} value={money(w.remaining_amount)} />
        <Stat label={c.freeSpending} value={money(w.free_spending_amount)} />
        <Stat label={c.spent} value={money(w.spent_amount)} />
        <Stat label={c.savings} value={money(w.planned_savings)} />
      </Panel>
      {(w.budget_required === true || w.needs_monthly_confirmation === true) && <Text>{c.budgetNeeded}</Text>}
      <Action vm={vm} label={c.budget} secondary run={() => setEditing(!editing)} />
      {(editing || w.budget_required === true) && <Budget vm={vm} key={`${vm.month}:${JSON.stringify(w.plan)}`} />}
      <Action vm={vm} label={c.expenseAdd} run={() => setExpense({ name: '', amount: '', spent_on: seoulDate() })} />
      {expense && (
        <Panel>
          <Field
            label={c.expenseName}
            value={str(expense.name)}
            set={(v) => setExpense({ ...expense, name: v.slice(0, 200) })}
          />
          <Field
            label={c.amount}
            value={str(expense.amount)}
            set={(v) => setExpense({ ...expense, amount: v })}
            numeric
          />
          <DateField
            label={c.spentOn}
            value={str(expense.spent_on)}
            max={seoulDate()}
            set={(v) => setExpense({ ...expense, spent_on: v })}
          />
          <Action
            vm={vm}
            label={c.save}
            disabled={
              !str(expense.name).trim() ||
              !validMoney(expense.amount) ||
              !validDate(str(expense.spent_on)) ||
              str(expense.spent_on) > seoulDate()
            }
            run={async () => {
              if (
                await vm.actions.expense(
                  {
                    name: str(expense.name).trim(),
                    amount: Number(expense.amount),
                    spent_on: expense.spent_on,
                  },
                  str(expense.id) || undefined,
                )
              )
                setExpense(null);
            }}
          />
          <Action vm={vm} label={c.close} secondary run={() => setExpense(null)} />
        </Panel>
      )}
      {vm.expenses.map((e) => (
        <Panel key={str(e.id)}>
          <Stat label={str(e.name)} value={money(e.amount)} />
          <Text>{str(e.spent_on)}</Text>
          {e.source === 'MANUAL' ? (
            <>
              <Action vm={vm} label={c.edit} secondary run={() => setExpense(e)} />
              <Action vm={vm} label={c.remove} secondary run={() => setDeleting(str(e.id))} />
            </>
          ) : (
            <Text>{c.linkedExpense}</Text>
          )}
        </Panel>
      ))}
      {deleting && (
        <Panel>
          <Text>{c.expenseDelete}</Text>
          <Action
            vm={vm}
            label={c.confirm}
            run={async () => {
              if (await vm.actions.removeExpense(deleting)) setDeleting('');
            }}
          />
          <Action vm={vm} label={c.cancel} secondary run={() => setDeleting('')} />
        </Panel>
      )}
    </>
  );
}
function Report({ vm }: { vm: VM }) {
  const r = vm.report;
  return (
    <>
      <Month vm={vm} />
      <Panel>
        <Stat label={c.reportBye} value={r.bye_count ?? 0} />
        <Stat label={c.reportRegistered} value={r.registered_count ?? 0} />
        <Stat label={c.savedAmount} value={money(r.saved_amount)} />
      </Panel>
      {r.empty === true && <Text>{c.empty}</Text>}
      {r.discovery != null && (
        <Panel>
          <Text variant="heading">{c.discovery}</Text>
          <Text>{str(object(r.discovery).message)}</Text>
        </Panel>
      )}
      {rows(r.categories).map((v) => (
        <Panel key={str(v.category)}>
          <Text variant="heading">{apkCategories[str(v.category)]}</Text>
          <Stat label={c.sample} value={v.sample_count} />
          <Stat label={c.predicted} value={num(v.predicted_days).toFixed(1)} />
          <Stat
            label={c.actual}
            value={`${num(v.actual_days_min).toFixed(1)} ~ ${num(v.actual_days_max).toFixed(1)}`}
          />
        </Panel>
      ))}
      {rows(r.purchase_reasons)
        .filter((v) => num(v.registered_count) > 0)
        .map((v) => (
          <Panel key={str(v.reason)}>
            <Text>{apkReasons[str(v.reason)]}</Text>
            <Stat label={c.decisions} value={`${v.registered_count} / ${v.decided_count}`} />
            <Stat
              label={c.abandonRate}
              value={v.abandonment_rate == null ? c.insufficient : `${(num(v.abandonment_rate) * 100).toFixed(0)}%`}
            />
          </Panel>
        ))}
      <Text>{c.reviewNote}</Text>
    </>
  );
}
function Settings({ vm }: { vm: VM }) {
  const push = useApkPush();
  return (
    <>
      <Panel>
        <Text>{push.message}</Text>
        <Action vm={vm} label={c.pushEnable} disabled={!push.available || push.busy} run={push.enable} />
        <Action vm={vm} label={c.pushDisable} disabled={push.busy} secondary run={push.disable} />
        <Action vm={vm} label={c.pushSettings} secondary run={() => Linking.openSettings()} />
      </Panel>
      <Panel>
        <Text>{c.localRecords}</Text>
        <Text>{c.recordsNotice}</Text>
      </Panel>
    </>
  );
}
