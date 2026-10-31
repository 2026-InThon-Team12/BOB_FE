import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Gauge, Badge, Button, Card, Chip, Icon, ProgressBar, Row, Stack, Text, TextLink } from '@/components/ui';
import { GoalCard, ShelfSlot, BarRow, RateRow, StatTile } from '@/components/feature';
import { apkCategories, apkCopy as c, apkMoney as money, apkReasons } from '@/constants/apkCopy';
import { copy } from '@/constants/copy';
import { htmlCopy as h, htmlImpulsePresets } from '@/constants/htmlCopy';
import { num, object, questionTasks, rows, str, taskKey, validMoney } from '@/lib/apkDomain';
import {
  HtmlScreen,
  Action,
  Panel,
  Stat,
  Product,
  Field,
  openUrl,
  MonthNav,
  ItemList,
  useHtmlStyles,
  type VM,
} from './shared';

export function Home({ vm }: { vm: VM }) {
  const s = useHtmlStyles();
  const tasks = questionTasks(vm.today).filter((t) => !vm.records[taskKey(t)]?.answer);
  const items = rows(vm.home.simulations),
    reviews = rows(vm.today.reviews),
    g = vm.goal;
  const ratio = num(g.target_amount) ? num(g.saved_amount) / num(g.target_amount) : 0;
  return (
    <HtmlScreen vm={vm}>
      <View style={s.hero}>
        <Row justify="space-between">
          <Text variant="label" tone="inverse">
            {h.questionTime}
          </Text>
          <Badge tone="onBrand" label={h.count(tasks.length)} />
        </Row>
        <Text variant="htmlHero" tone="inverse">
          {h.hero}
        </Text>
        <Pressable accessibilityRole="button" style={s.heroButton} onPress={() => vm.go('today')}>
          <Text variant="bodyStrong" weight="700" tone="brand">
            {h.answer}
          </Text>
        </Pressable>
      </View>
      {g.id ? (
        <Card onPress={() => vm.go('goal')} accessibilityLabel={copy.tabs.goal}>
          <Stack gap={3}>
            <Row justify="space-between">
              <Text variant="label" tone="secondary">
                {copy.main.goalLabel(str(g.name))}
              </Text>
              <Text variant="label" tone="brand">
                {copy.goal.percent(Math.min(1, ratio))}
              </Text>
            </Row>
            <Row align="baseline">
              <Text variant="title">{money(g.saved_amount)}</Text>
              <Text variant="label" tone="secondary">
                {copy.main.goalSaved(num(g.target_amount))}
              </Text>
            </Row>
            <ProgressBar value={ratio} />
            <Text variant="caption" tone="tertiary">
              {g.achieved === true
                ? copy.main.goalReached
                : g.estimated_completion_on
                  ? copy.main.goalEta(str(g.estimated_completion_on))
                  : copy.goal.etaUnknown}
            </Text>
          </Stack>
        </Card>
      ) : (
        <Card onPress={() => vm.go('goalSetup')} accessibilityLabel={c.firstGoal}>
          <Row justify="space-between">
            <Stack gap={1}>
              <Text variant="bodyStrong">{copy.goal.emptyTitle}</Text>
              <Text variant="caption" tone="secondary">
                {copy.goal.emptyDescription}
              </Text>
            </Stack>
            <Icon name="chevronRight" />
          </Row>
        </Card>
      )}
      {reviews.length > 0 && (
        <Card padding={3} onPress={() => vm.openReview(reviews[0])} accessibilityLabel={c.review}>
          <Row gap={3}>
            <View style={s.reviewIcon}>
              <Icon name="clock" tone="warning" />
            </View>
            <Stack flex={1}>
              <Text variant="bodyStrong">{str(reviews[0].item_name)}</Text>
              <Text variant="caption" tone="secondary">
                {h.reviewTitle}
              </Text>
            </Stack>
            <Icon name="chevronRight" />
          </Row>
        </Card>
      )}
      <Row justify="space-between">
        <Text variant="heading">
          {copy.main.simTitle} {items.length}
        </Text>
        <TextLink label={copy.main.add} icon="add" onPress={() => vm.go('add')} />
      </Row>
      {items.length ? (
        <ItemList vm={vm} items={items} />
      ) : (
        <Panel>
          <Text variant="heading">{h.mainEmpty}</Text>
          <Text variant="label" tone="secondary">
            {h.mainEmptyBody}
          </Text>
        </Panel>
      )}
      <Button label={h.history} variant="ghost" size="sm" onPress={() => vm.go('history')} />
    </HtmlScreen>
  );
}

export function Goal({ vm }: { vm: VM }) {
  const g = vm.goal,
    s = useHtmlStyles();
  const [custom, setCustom] = useState(false),
    [details, setDetails] = useState(false),
    [name, setName] = useState(''),
    [amount, setAmount] = useState(''),
    [editLink, setEditLink] = useState(false),
    [url, setUrl] = useState(str(g.source_url));
  const ratio = num(g.target_amount) ? num(g.saved_amount) / num(g.target_amount) : 0;
  if (g.achieved === true) return <GoalDone vm={vm} />;
  return (
    <HtmlScreen
      vm={vm}
      right={<Button variant="ghost" size="sm" label={copy.goal.change} onPress={() => vm.go('goalSetup')} />}
    >
      {g.id ? (
        <>
          <GoalCard
            name={str(g.name)}
            price={num(g.target_amount)}
            imageUri={str(g.image_url) || undefined}
            saved={num(g.saved_amount)}
            ratio={Math.min(1, ratio)}
            eta={str(g.estimated_completion_on) || null}
            dailySaving={num(g.daily_savings) || null}
          />
        </>
      ) : (
        <Panel>
          <Text variant="heading">{copy.goal.emptyTitle}</Text>
          <Text variant="label" tone="secondary">
            {copy.goal.emptyDescription}
          </Text>
          <Action vm={vm} label={c.firstGoal} run={() => vm.go('goalSetup')} />
        </Panel>
      )}
      <Card padding={4} onPress={() => vm.go('shelf')} accessibilityLabel={c.shelf}>
        <Row gap={3}>
          <Icon name="goal" tone="brand" />
          <Stack flex={1}>
            <Text variant="bodyStrong">{c.shelf}</Text>
            <Text variant="caption" tone="secondary">
              {copy.shelf.entrySub}
            </Text>
          </Stack>
          <Icon name="chevronRight" />
        </Row>
      </Card>
      <Stack gap={3} paddingY={2}>
        <Text variant="heading">{h.impulseTitle}</Text>
        <Row gap={2} wrap>
          {htmlImpulsePresets.map((p) => (
            <Chip
              key={p.name}
              label={`${p.name} ${money(p.amount)}`}
              onPress={() => {
                if (!vm.busy) void vm.finish(vm.actions.impulse(p.name, String(p.amount)), 'impulse');
              }}
            />
          ))}
          <Chip label={h.impulseCustom} selected={custom} onPress={() => setCustom(!custom)} />
        </Row>
      </Stack>
      {custom && (
        <Panel>
          <Field label={c.impulseName} value={name} set={setName} />
          <Field label={c.amount} value={amount} set={setAmount} numeric />
          <Action
            vm={vm}
            label={h.impulseCompare}
            disabled={!name.trim() || !validMoney(amount)}
            run={() => vm.finish(vm.actions.impulse(name.trim(), amount), 'impulse')}
          />
        </Panel>
      )}
      <Text variant="caption" tone="tertiary">
        {c.virtual}
      </Text>
      {!!g.id && (
        <>
          <Button label={c.record} variant="ghost" size="sm" onPress={() => setDetails(!details)} />
          {details && (
            <Panel>
              <Stat label={h.resistedCount} value={h.countTimes(num(g.resisted_count))} />
              <Stat label={h.elapsed} value={h.days(num(g.elapsed_days))} />
            </Panel>
          )}
        </>
      )}
      {!!g.id && (
        <>
          <Button label={h.goalLinkEdit} variant="ghost" size="sm" onPress={() => setEditLink(!editLink)} />
          {editLink && (
            <View style={s.card}>
              <Field label={c.url} value={url} set={setUrl} />
              <Action
                vm={vm}
                label={h.goalLinkSave}
                disabled={!!url && !url.startsWith('https://')}
                run={() => vm.actions.goalUrl(url)}
              />
            </View>
          )}
        </>
      )}
    </HtmlScreen>
  );
}

export function Shelf({ vm }: { vm: VM }) {
  const s = useHtmlStyles(),
    [selected, setSelected] = useState('');
  const items = rows(vm.shelf.items),
    chosen = items.find((i) => i.id === selected),
    g = vm.goal;
  return (
    <HtmlScreen vm={vm} title={c.shelf}>
      <Row justify="space-between">
        <Text variant="heading">{copy.report.count(num(vm.shelf.count))}</Text>
        <Text variant="label" tone="secondary">
          {money(vm.shelf.total_target_amount)}
        </Text>
      </Row>
      <View style={s.shelf}>
        <View style={s.shelfRow}>
          {!!g.id && g.achieved !== true && (
            <ShelfSlot
              kind="active"
              name={str(g.name)}
              price={num(g.target_amount)}
              percent={copy.goal.percent(
                num(g.target_amount) ? Math.min(1, num(g.saved_amount) / num(g.target_amount)) : 0,
              )}
            />
          )}
          {items.map((i) => (
            <ShelfSlot
              key={str(i.id)}
              kind="achieved"
              name={str(i.name)}
              price={num(i.target_amount)}
              imageUri={str(i.image_url) || undefined}
              stamp={str(i.achieved_on)}
              selected={selected === i.id}
              onPress={() => setSelected(str(i.id))}
            />
          ))}
          <ShelfSlot kind="next" onPress={() => vm.go('goalSetup')} />
        </View>
      </View>
      {chosen && (
        <Panel>
          <Product item={chosen} />
          <Text variant="label">{str(chosen.achieved_on)}</Text>
          {chosen.elapsed_days != null && <Stat label={h.elapsed} value={h.days(num(chosen.elapsed_days))} />}
          {chosen.resisted_count != null && (
            <Stat label={h.resistedCount} value={h.countTimes(num(chosen.resisted_count))} />
          )}
          {chosen.can_shop === true && (
            <Action vm={vm} label={c.shop} run={() => openUrl(chosen.source_url)} />
          )}
        </Panel>
      )}
    </HtmlScreen>
  );
}

export function Impulse({ vm }: { vm: VM }) {
  const i = vm.impulse;
  return (
    <HtmlScreen vm={vm} title={h.impulseCompare}>
      <Panel>
        <Text variant="heading">
          {str(i.name)} · {money(i.amount)}
        </Text>
        <Text variant="htmlHero">{str(i.message)}</Text>
        <Row gap={2}>
          <Stack flex={1}>
            <Card tone="subtle" padding={3}>
              <Stack gap={2}>
                <Text variant="caption">{c.ifPurchased}</Text>
                <Text variant="heading">{str(i.if_purchased_on) || c.insufficient}</Text>
              </Stack>
            </Card>
          </Stack>
          <Stack flex={1}>
            <Card tone="brandSubtle" padding={3}>
              <Stack gap={2}>
                <Text variant="caption" tone="brand">
                  {c.ifResisted}
                </Text>
                <Text variant="heading" tone="brand">
                  {str(i.if_resisted_on) || c.insufficient}
                </Text>
              </Stack>
            </Card>
          </Stack>
        </Row>
        {['RESISTED', 'PURCHASED'].includes(str(i.decision)) ? (
          <Action vm={vm} label={c.undo} secondary run={() => vm.actions.impulseDecision('CANCELLED')} />
        ) : (
          <>
            <Action
              vm={vm}
              label={h.impulseResist(money(i.amount))}
              run={() => vm.actions.impulseDecision('RESISTED')}
            />
            <Action
              vm={vm}
              label={h.impulseBuy}
              secondary
              run={() => vm.actions.impulseDecision('PURCHASED')}
            />
          </>
        )}
      </Panel>
    </HtmlScreen>
  );
}

export function Report({ vm }: { vm: VM }) {
  const r = vm.report,
    categories = rows(r.categories),
    reasons = rows(r.purchase_reasons).filter((v) => num(v.registered_count) > 0);
  return (
    <HtmlScreen vm={vm} right={<MonthNav vm={vm} />}>
      <Row gap={2}>
        <Stack flex={1}>
          <StatTile label={copy.report.byeCount} value={copy.report.count(num(r.bye_count))} />
        </Stack>
        <Stack flex={1}>
          <StatTile label={copy.report.registered} value={copy.report.count(num(r.registered_count))} />
        </Stack>
        <Stack flex={1}>
          <StatTile label={copy.report.saved} value={money(r.saved_amount)} />
        </Stack>
      </Row>
      {r.discovery != null && (
        <Card tone="inverse">
          <Stack gap={2}>
            <Text variant="caption" tone="inverse">
              {h.reportFinding}
            </Text>
            <Text variant="title" tone="inverse">
              {str(object(r.discovery).message)}
            </Text>
          </Stack>
        </Card>
      )}
      <Panel>
        <Text variant="heading">{copy.report.compareTitle}</Text>
        <Text variant="caption" tone="secondary">
          {copy.report.compareHint}
        </Text>
        <Row gap={4}>
          <Text variant="caption" tone="tertiary">
            {copy.report.legendPredicted}
          </Text>
          <Text variant="caption" tone="brand">
            {copy.report.legendActual}
          </Text>
        </Row>
        {categories.map((v) => (
          <Stack key={str(v.category)} gap={2}>
            <Row justify="space-between">
              <Text variant="bodyStrong">{apkCategories[str(v.category)]}</Text>
              <Text variant="caption" tone="secondary">
                {copy.report.count(num(v.sample_count))}
              </Text>
            </Row>
            <BarRow
              label={c.predicted}
              value={h.days(num(v.predicted_days))}
              ratio={num(v.predicted_days) / 14}
              tone="predicted"
            />
            <BarRow
              label={c.actual}
              value={h.actualRange(num(v.actual_days_min), num(v.actual_days_max))}
              ratio={num(v.actual_days_max) / 14}
              tone="brand"
            />
          </Stack>
        ))}
        {!categories.length && (
          <Text variant="label" tone="secondary">
            {copy.report.compareEmpty}
          </Text>
        )}
      </Panel>
      <Panel>
        <Text variant="heading">{copy.report.reasonTitle}</Text>
        {reasons.map((v) => (
          <Stack gap={1} key={str(v.reason)}>
            {v.abandonment_rate == null ? (
              <Stat label={apkReasons[str(v.reason)]} value={c.insufficient} />
            ) : (
              <RateRow
                label={apkReasons[str(v.reason)]}
                rate={num(v.abandonment_rate)}
                rateText={copy.report.rate(num(v.abandonment_rate))}
              />
            )}
            <Text variant="caption" tone="tertiary">
              {c.decisions} {str(v.registered_count)} / {str(v.decided_count)}
            </Text>
          </Stack>
        ))}
        {!reasons.length && (
          <Text variant="label" tone="secondary">
            {copy.report.reasonEmpty}
          </Text>
        )}
      </Panel>
      <Text variant="caption" tone="tertiary">
        {c.reviewNote}
      </Text>
    </HtmlScreen>
  );
}

function GoalDone({ vm }: { vm: VM }) {
  const g = vm.goal;
  const [editing, setEditing] = useState(false),
    [url, setUrl] = useState(str(g.source_url));
  return (
    <HtmlScreen
      vm={{ ...vm, page: 'goalDone' }}
      back={() => vm.go('home')}
      footer={
        <>
          <Action vm={vm} label={c.shop} disabled={g.can_shop !== true} run={() => openUrl(g.source_url)} />
          <Action vm={vm} label={copy.shelf.next} secondary run={() => vm.go('goalSetup')} />
        </>
      }
    >
      <Stack align="center" gap={5} paddingY={8}>
        <Gauge value={1}>
          <Text variant="hero" tone="brand">
            {copy.goal.percent(1)}
          </Text>
          <Text variant="label" tone="tertiary">
            {money(g.target_amount)}
          </Text>
        </Gauge>
        <Text variant="title">{h.goalDoneTitle}</Text>
        <Text align="center" tone="secondary">
          {h.goalDoneBody(str(g.name))}
        </Text>
      </Stack>
      <Card tone="subtle" padding={4}>
        <Row justify="space-between">
          <Stack align="center" gap={2}>
            <Text variant="caption">{h.resistedCount}</Text>
            <Text variant="heading">{h.countTimes(num(g.resisted_count))}</Text>
          </Stack>
          <Stack align="center" gap={2}>
            <Text variant="caption">{h.elapsed}</Text>
            <Text variant="heading">{h.days(num(g.elapsed_days))}</Text>
          </Stack>
          <Stack align="center" gap={2}>
            <Text variant="caption">{copy.goalDone.top}</Text>
            <Text variant="heading">{str(g.most_resisted_item) || c.insufficient}</Text>
          </Stack>
        </Row>
      </Card>
      <Button label={h.goalLinkEdit} variant="ghost" size="sm" onPress={() => setEditing(!editing)} />
      {editing && (
        <Panel>
          <Field label={c.url} value={url} set={setUrl} />
          <Action
            vm={vm}
            label={h.goalLinkSave}
            disabled={!!url && !url.startsWith('https://')}
            run={() => vm.actions.goalUrl(url)}
          />
        </Panel>
      )}
      <Button label={c.shelf} variant="ghost" onPress={() => vm.go('shelf')} />
    </HtmlScreen>
  );
}
