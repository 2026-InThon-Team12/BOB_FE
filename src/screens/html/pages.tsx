import { useState } from 'react';
import { Linking } from 'react-native';
import { Button, Switch, ProgressBar, Row, Stack, Text, Thumbnail } from '@/components/ui';
import { apkCopy as c, apkMoney as money, apkTabs, apkTitles } from '@/constants/apkCopy';
import { copy } from '@/constants/copy';
import { htmlCopy as h } from '@/constants/htmlCopy';
import {
  num,
  object,
  questionTasks,
  rows,
  seoulDate,
  str,
  taskKey,
  validDate,
  validMoney,
  type Json,
} from '@/lib/apkDomain';
import { useApkPush } from '@/features/apklike/useApkPush';
import { HtmlScreen, Action, Panel, Stat, Field, DateField, MonthNav, type VM } from './shared';
import { CompactNumberInput } from '@/components/feature';

export function Today({ vm }: { vm: VM }) {
  const tasks = questionTasks(vm.today);
  return (
    <HtmlScreen vm={vm} title={vm.page in apkTabs ? undefined : apkTitles[vm.page]}>
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
      {!tasks.length && !rows(vm.today.decisions).length && !rows(vm.today.reviews).length && (
        <Text>{c.empty}</Text>
      )}
    </HtmlScreen>
  );
}

export function GoalSetup({ vm }: { vm: VM }) {
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
    <HtmlScreen
      vm={vm}
      title={vm.setup.mode === 'CHANGE' ? copy.goalSetup.titleChange : copy.goalSetup.titleFirst}
      footer={
        <Action
          vm={vm}
          label={c.goalSave}
          disabled={!valid}
          run={() => vm.finish(vm.actions.goalSave(body, carry), 'goal')}
        />
      }
    >
      <Stack gap={2} paddingY={2}>
        <Text variant="title">{h.goalSetupTitle}</Text>
        <Text variant="htmlBody" tone="secondary">
          {h.goalSetupBody}
        </Text>
      </Stack>
      {vm.setup.mode === 'CHANGE' && (
        <Panel>
          <Text variant="caption" tone="tertiary">
            {h.goalCurrent}
          </Text>
          <Text variant="bodyStrong">
            {str(object(vm.setup.current_goal).name)} · {money(object(vm.setup.current_goal).saved_amount)}
          </Text>
          <Row justify="space-between">
            <Stack flex={1}>
              <Text variant="label">{h.carry(money(object(vm.setup.current_goal).saved_amount))}</Text>
            </Stack>
            <Switch accessibilityLabel={c.carry} value={carry} onChange={setCarry} />
          </Row>
        </Panel>
      )}
      <Panel>
        <Text variant="bodyStrong">{copy.goalSetup.targetLabel}</Text>
        <Row gap={3}>
          <Thumbnail uri={image || undefined} />
          <Stack flex={1}>
            <Field label={c.goalName} value={name} set={(v) => setName(v.slice(0, 100))} />
          </Stack>
        </Row>
        <Field label={c.target} value={amount} set={setAmount} numeric />
        <Field label={h.goalLink} value={url} set={setUrl} />
        <Text variant="caption" tone="tertiary">
          {h.goalLinkHint}
        </Text>
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
    </HtmlScreen>
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
      <Row justify="space-between">
        <Text variant="heading">{copy.wallet.planTitle}</Text>
        <Text variant="caption" tone="tertiary">
          {copy.wallet.planHint}
        </Text>
      </Row>
      {keys.map((k) => (
        <Row key={k} justify="space-between" gap={3}>
          <Stack flex={1}>
            <Text variant="bodyStrong">{c[k]}</Text>
            {k === 'food' && (
              <Text variant="caption" tone="tertiary">
                {copy.budget.foodHint}
              </Text>
            )}
            {k === 'living' && (
              <Text variant="caption" tone="tertiary">
                {copy.budget.livingHint}
              </Text>
            )}
          </Stack>
          <CompactNumberInput
            width={116}
            accessibilityLabel={c[k]}
            value={form[k] == null ? null : num(form[k])}
            onChangeValue={(v) => setForm({ ...form, [k]: v == null ? '' : String(v) })}
          />
          <Text variant="label">{h.amountUnit}</Text>
        </Row>
      ))}
      <Action
        vm={vm}
        label={h.budgetSave}
        disabled={!valid}
        run={() =>
          vm.actions.budget(
            Object.fromEntries(keys.filter((k) => str(form[k])).map((k) => [k, Number(form[k])])),
          )
        }
      />
    </Panel>
  );
}
export function Wallet({ vm }: { vm: VM }) {
  const [expense, setExpense] = useState<Json | null>(null),
    [deleting, setDeleting] = useState('');
  const w = vm.wallet;
  return (
    <HtmlScreen vm={vm} right={<MonthNav vm={vm} />}>
      <Panel>
        <Text variant="label" tone="secondary">
          {copy.wallet.freeTitle(vm.month)}
        </Text>
        <Row align="baseline" gap={2}>
          <Text variant="hero" tone={num(w.remaining_amount) < 0 ? 'warning' : 'primary'}>
            {w.remaining_amount == null ? h.noMoney : money(Math.abs(num(w.remaining_amount)))}
          </Text>
          {w.remaining_amount != null && (
            <Text variant="label" tone="secondary">
              {num(w.remaining_amount) < 0 ? copy.wallet.over : copy.wallet.remaining}
            </Text>
          )}
        </Row>
        <ProgressBar
          value={num(w.free_spending_amount) ? num(w.spent_amount) / num(w.free_spending_amount) : 0}
        />
        <Row justify="space-between">
          <Text variant="caption" tone="secondary">
            {copy.wallet.spent(num(w.spent_amount))}
          </Text>
          <Text variant="caption" tone="secondary">
            {copy.wallet.of(num(w.free_spending_amount))}
          </Text>
        </Row>
      </Panel>
      {(w.budget_required === true || w.needs_monthly_confirmation === true) && (
        <Text variant="label" tone="warning">
          {c.budgetNeeded}
        </Text>
      )}
      <Budget vm={vm} key={`${vm.month}:${JSON.stringify(w.plan)}`} />
      <Panel>
        <Text variant="heading">{copy.wallet.unregisteredTitle}</Text>
        <Text variant="label" tone="secondary">
          {copy.wallet.unregisteredBody}
        </Text>
        {vm.expenses.map((e) => (
          <Stack gap={2} key={str(e.id)}>
            <Row justify="space-between">
              <Stack flex={1}>
                <Text variant="bodyStrong">{str(e.name)}</Text>
                <Text variant="caption" tone="tertiary">
                  {str(e.spent_on)}
                </Text>
              </Stack>
              <Text variant="bodyStrong">{money(e.amount)}</Text>
            </Row>
            {e.source === 'MANUAL' ? (
              <Row justify="flex-end">
                <Button label={c.edit} variant="ghost" size="sm" onPress={() => setExpense(e)} />
                <Button label={c.remove} variant="ghost" size="sm" onPress={() => setDeleting(str(e.id))} />
              </Row>
            ) : (
              <Text variant="caption" tone="tertiary">
                {c.linkedExpense}
              </Text>
            )}
          </Stack>
        ))}
        {!vm.expenses.length && (
          <Text variant="caption" tone="tertiary">
            {copy.wallet.unregisteredEmpty}
          </Text>
        )}
        <Button
          label={copy.wallet.record}
          icon="add"
          variant="dashed"
          onPress={() => setExpense({ name: '', amount: '', spent_on: seoulDate() })}
        />
      </Panel>
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
    </HtmlScreen>
  );
}

export function Settings({ vm }: { vm: VM }) {
  const push = useApkPush();
  return (
    <HtmlScreen vm={vm} title={vm.page in apkTabs ? undefined : apkTitles[vm.page]}>
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
    </HtmlScreen>
  );
}
