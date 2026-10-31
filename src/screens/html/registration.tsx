import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Badge, Button, Card, Chip, Icon, Row, Stack, Text } from '@/components/ui';
import { BalanceReminder, MethodOption } from '@/components/feature';
import { apkCategories, apkCopy as c, apkReasons, apkRegistrationPeriod } from '@/constants/apkCopy';
import { copy } from '@/constants/copy';
import { htmlCopy as h } from '@/constants/htmlCopy';
import { num, object, rows, seoulDate, validDraft, validMoney } from '@/lib/apkDomain';
import { HtmlScreen, Action, Panel, Product, Field, DateField, useHtmlStyles, type VM } from './shared';

export function Add({ vm }: { vm: VM }) {
  const s = useHtmlStyles(),
    [method, setMethod] = useState<'manual' | 'url' | null>(null);
  const [name, setName] = useState(''),
    [price, setPrice] = useState(''),
    [url, setUrl] = useState('');
  return (
    <HtmlScreen vm={vm} back={method ? () => setMethod(null) : vm.back}>
      {!method ? (
        <>
          <View style={s.titleBlock}>
            <Text variant="title">{copy.register.methodTitle}</Text>
            <Text variant="htmlBody" tone="secondary">
              {copy.register.methodBody}
            </Text>
          </View>
          <View style={s.alert}>
            <Row gap={2}>
              <Icon name="warning" tone="alert" size="sm" />
              <Stack flex={1}>
                <Text variant="label" weight="600" tone="alert">
                  {copy.register.sameShop}
                </Text>
              </Stack>
            </Row>
          </View>
          <MethodOption
            icon="image"
            title={copy.register.screenshotTitle}
            body={copy.register.screenshotBody}
            badge={copy.register.recommended}
            highlighted
            onPress={() => {
              if (!vm.busy) void vm.pickPhoto();
            }}
          />
          <MethodOption
            icon="link"
            title={copy.register.linkTitle}
            body={copy.register.linkBody}
            onPress={() => setMethod('url')}
          />
          <MethodOption
            icon="pencil"
            title={copy.register.manualTitle}
            body={copy.register.manualBody}
            onPress={() => setMethod('manual')}
          />
          {vm.pendingPhoto && (
            <Panel>
              <Text variant="heading">{c.replacePhoto}</Text>
              <Text variant="label">{c.replaceBody}</Text>
              <Action vm={vm} label={c.replace} run={() => vm.usePhoto(true)} />
              <Action vm={vm} label={c.append} run={() => vm.usePhoto(false)} />
              <Action vm={vm} label={c.cancel} secondary run={vm.cancelPhoto} />
            </Panel>
          )}
          <Stack gap={3} paddingY={2}>
            <Text variant="label" tone="tertiary">
              {copy.register.otherTitle}
            </Text>
            <Panel>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={copy.register.otherImpulseTitle}
                onPress={() => vm.go('goal')}
              >
                <Row gap={2}>
                  <Stack flex={1}>
                    <Text variant="label" weight="700">
                      {copy.register.otherImpulseTitle}
                    </Text>
                    <Text variant="caption" tone="secondary">
                      {copy.register.otherImpulseBody}
                    </Text>
                  </Stack>
                  <Icon name="chevronRight" />
                </Row>
              </Pressable>
              <View style={s.divider} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={copy.register.otherDiscountTitle}
                disabled={vm.busy}
                onPress={() => {
                  void vm.pickPhoto();
                }}
              >
                <Row gap={2}>
                  <Stack flex={1}>
                    <Text variant="label" weight="700">
                      {copy.register.otherDiscountTitle}
                    </Text>
                    <Text variant="caption" tone="secondary">
                      {copy.register.otherDiscountBody}
                    </Text>
                  </Stack>
                  <Icon name="chevronRight" />
                </Row>
              </Pressable>
            </Panel>
          </Stack>
        </>
      ) : (
        <>
          <View style={s.titleBlock}>
            <Text variant="title">
              {method === 'url' ? copy.register.linkScreenTitle : copy.register.manualTitle}
            </Text>
            <Text variant="htmlBody" tone="secondary">
              {method === 'url' ? copy.register.linkBody : copy.register.manualBody}
            </Text>
          </View>
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
              disabled={
                method === 'url'
                  ? !url.startsWith('https://')
                  : !name.trim() || (!!price && !validMoney(price))
              }
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
        </>
      )}
      {vm.drafts.length > 0 && (
        <Button variant="ghost" label={`${c.resume} (${vm.drafts.length})`} onPress={() => vm.go('drafts')} />
      )}
    </HtmlScreen>
  );
}

export function Drafts({ vm }: { vm: VM }) {
  const s = useHtmlStyles(),
    [excluded, setExcluded] = useState<number[]>([]),
    [expanded, setExpanded] = useState<number[]>([]),
    [index, setIndex] = useState(0);
  const included = vm.drafts.map((_, i) => i).filter((i) => !excluded.includes(i));
  const d = vm.drafts[index];
  if (vm.page === 'reasons')
    return (
      <HtmlScreen
        vm={vm}
        right={
          <Text variant="label" tone="tertiary">
            {h.step(index + 1, vm.drafts.length)}
          </Text>
        }
        back={index ? () => setIndex(index - 1) : vm.back}
        footer={
          d && (
            <Action
              vm={vm}
              label={index < vm.drafts.length - 1 ? copy.register.nextItem : c.preview}
              disabled={!validDraft(d)}
              run={() =>
                index < vm.drafts.length - 1
                  ? setIndex(index + 1)
                  : vm.finish(
                      vm.actions.preview(),
                      vm.drafts.some((v) => v.reasons.includes('EXTRA_DISCOUNT'))
                        ? 'discount'
                        : 'registrationPreview',
                    )
              }
            />
          )
        }
      >
        {d ? (
          <>
            <Product item={d} crop={d.crop} compact />
            <View style={s.titleBlock}>
              <Text variant="title">{copy.register.reasonTitle}</Text>
              <Text variant="htmlBody" tone="secondary">
                {copy.register.reasonBody}
              </Text>
            </View>
            <Row wrap gap={2}>
              {Object.entries(apkReasons).map(([code, label]) => (
                <Chip
                  key={code}
                  label={label}
                  selected={d.reasons.includes(code)}
                  onPress={() => {
                    const checked = !d.reasons.includes(code);
                    void vm.actions.draft(index, {
                      reasons: checked ? [...d.reasons, code] : d.reasons.filter((r) => r !== code),
                      needed: code === 'EXTRA_DISCOUNT' ? !checked : d.needed,
                    });
                  }}
                />
              ))}
            </Row>
            {d.reasons.includes('OTHER') && (
              <Field
                label={c.other}
                value={d.other}
                set={(other) => {
                  void vm.actions.draft(index, { other: other.slice(0, 300) });
                }}
              />
            )}
            {d.reasons.includes('DISCOUNT_LIMITED') && (
              <DateField
                label={c.deadline}
                value={d.deadline}
                min={seoulDate()}
                set={(deadline) => {
                  void vm.actions.draft(index, { deadline });
                }}
              />
            )}
            {object(vm.home.wallet).remaining_amount == null ? (
              <Card tone="brandSubtle" padding={4}>
                <Text variant="label">{copy.register.noBudget}</Text>
              </Card>
            ) : (
              <BalanceReminder
                bucketLabel={h.balanceBucket}
                limit={num(object(vm.home.wallet).free_spending_amount)}
                remaining={num(object(vm.home.wallet).remaining_amount)}
                afterPurchase={num(object(vm.home.wallet).remaining_amount) - num(d.price)}
              />
            )}

            <Row gap={2}>
              <Icon name="bell" size="sm" tone="tertiary" />
              <Stack flex={1}>
                <Text variant="caption" tone="tertiary">
                  {c.tomorrow}
                </Text>
              </Stack>
            </Row>
          </>
        ) : (
          <Text>{c.empty}</Text>
        )}
      </HtmlScreen>
    );
  if (vm.page === 'registrationPreview')
    return (
      <HtmlScreen
        vm={vm}
        footer={
          <Action
            vm={vm}
            label={c.start}
            disabled={!vm.drafts.length}
            run={() => vm.finish(vm.actions.register(), 'home')}
          />
        }
      >
        <View style={s.titleBlock}>
          <Text variant="title">{h.registrationPreview}</Text>
          <Text variant="htmlBody" tone="secondary">
            {h.previewBody}
          </Text>
        </View>
        {vm.drafts.map((draft, i) => (
          <Panel key={i}>
            <Product item={draft} crop={draft.crop} prominentPrice />
            <Badge
              tone="brand"
              label={apkRegistrationPeriod(num(rows(vm.registrationPreview.items)[i]?.duration_days))}
            />
          </Panel>
        ))}
        <Text variant="caption" tone="tertiary">
          {c.localRecords}
        </Text>
      </HtmlScreen>
    );
  return (
    <HtmlScreen
      vm={vm}
      footer={
        <Action
          vm={vm}
          label={copy.register.registerButton(included.length)}
          disabled={
            !included.length ||
            included.some((i) => !vm.drafts[i].name.trim() || !validMoney(vm.drafts[i].price))
          }
          run={() => vm.finish(vm.actions.selectDrafts(included), 'reasons')}
        />
      }
    >
      <Row gap={3}>
        <View style={s.receipt}>
          <View style={[s.receiptLine, s.receiptAccent]} />
          {[0, 1, 2, 3].map((n) => (
            <View key={n} style={s.receiptLine} />
          ))}
        </View>
        <Stack flex={1} gap={1}>
          <Text variant="title">{copy.register.foundTitle(vm.drafts.length)}</Text>
          <Text variant="label" tone="secondary">
            {copy.register.reviewBody}
          </Text>
        </Stack>
      </Row>
      {vm.drafts.map((draft, i) => (
        <View key={i} style={s.draft}>
          <Row gap={3}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityLabel={copy.register.include(draft.name)}
              accessibilityState={{ checked: !excluded.includes(i) }}
              onPress={() =>
                setExcluded(excluded.includes(i) ? excluded.filter((n) => n !== i) : [...excluded, i])
              }
            >
              <View style={[s.checkbox, !excluded.includes(i) && s.checked]}>
                {!excluded.includes(i) && <Icon name="check" size="sm" tone="inverse" />}
              </View>
            </Pressable>
            <Stack flex={1}>
              <Product item={draft} crop={draft.crop} prominentPrice />
            </Stack>
            <Button
              label={c.edit}
              variant="ghost"
              size="sm"
              onPress={() =>
                setExpanded(expanded.includes(i) ? expanded.filter((n) => n !== i) : [...expanded, i])
              }
            />
          </Row>
          <Row justify="space-between">
            <Pressable
              style={s.category}
              accessibilityRole="button"
              accessibilityLabel={`${draft.name} ${c.category}`}
              onPress={() =>
                setExpanded(expanded.includes(i) ? expanded.filter((n) => n !== i) : [...expanded, i])
              }
            >
              <Text variant="label">{apkCategories[draft.category]}</Text>
              <Icon name="chevronDown" size="sm" />
            </Pressable>
            <Text variant="caption" tone="tertiary">
              {h.predictedDays}
            </Text>
          </Row>
          {(expanded.includes(i) || !draft.name || !validMoney(draft.price)) && (
            <>
              <Field
                label={c.name}
                value={draft.name}
                set={(name) => {
                  void vm.actions.draft(i, { name: name.slice(0, 200) });
                }}
              />
              <Field
                label={c.price}
                value={draft.price}
                numeric
                set={(price) => {
                  void vm.actions.draft(i, { price });
                }}
              />
              <Row wrap gap={2}>
                {Object.entries(apkCategories).map(([code, label]) => (
                  <Chip
                    key={code}
                    label={label}
                    selected={draft.category === code}
                    onPress={() => {
                      void vm.actions.draft(i, { category: code });
                    }}
                  />
                ))}
              </Row>
            </>
          )}
        </View>
      ))}
      <Button
        label={copy.register.addRow}
        icon="add"
        variant="dashed"
        disabled={vm.busy || vm.drafts.length >= 20}
        onPress={() => {
          void vm.actions.addBlank();
        }}
      />
    </HtmlScreen>
  );
}
