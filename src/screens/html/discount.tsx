import { useState } from 'react';
import { View } from 'react-native';
import { Card, Chip, Row, Stack, Switch, Text } from '@/components/ui';
import { CompactNumberInput } from '@/components/feature';
import { apkCopy as c, apkMoney as money } from '@/constants/apkCopy';
import { htmlCopy as h } from '@/constants/htmlCopy';
import { num, object, str, validMoney } from '@/lib/apkDomain';
import { HtmlScreen, Action, Panel, Product, useHtmlStyles, type VM } from './shared';

export function Discount({ vm }: { vm: VM }) {
  const s = useHtmlStyles();
  const [minimum, setMinimum] = useState(''),
    [value, setValue] = useState(''),
    [shipping, setShipping] = useState(''),
    [threshold, setThreshold] = useState(''),
    [unit, setUnit] = useState('PCT'),
    [free, setFree] = useState(false);
  const change = (setter: (v: string) => void) => (v: number | null) => {
    setter(v == null ? '' : String(v));
    vm.actions.clearDiscount();
  };
  const valid =
    [minimum, value, shipping].every((v) => validMoney(v, false)) &&
    (!free || validMoney(threshold, false)) &&
    (unit !== 'PCT' || Number(value) <= 100);
  const step = (n: number, title: string) => (
    <Row gap={2}>
      <View style={s.numbered}>
        <Text variant="label" tone="inverse" weight="700">
          {n}
        </Text>
      </View>
      <Stack flex={1}>
        <Text variant="heading">{title}</Text>
      </Stack>
    </Row>
  );
  const field = (label: string, val: string, set: (v: string) => void) => (
    <Row justify="space-between" gap={2}>
      <Stack flex={1}>
        <Text variant="label">{label}</Text>
      </Stack>
      <CompactNumberInput
        width={110}
        accessibilityLabel={label}
        value={val === '' ? null : Number(val)}
        onChangeValue={change(set)}
      />
      <Text variant="caption">{h.amountUnit}</Text>
    </Row>
  );
  return (
    <HtmlScreen
      vm={vm}
      title={c.compare}
      footer={
        vm.discountRule ? (
          <>
            <Action
              vm={vm}
              label={c.needed}
              disabled={!vm.drafts.some((d) => d.needed)}
              run={() => vm.finish(vm.actions.register('NEEDED'), 'home')}
            />
            <Action
              vm={vm}
              label={c.all}
              secondary
              run={() => vm.finish(vm.actions.register('ALL'), 'home')}
            />
          </>
        ) : undefined
      }
    >
      {step(1, h.discountStep1)}
      <Panel>
        {field(h.discountMin, minimum, setMinimum)}
        <Row justify="space-between">
          <Text variant="label">{h.discountAmount}</Text>
          <CompactNumberInput
            width={80}
            accessibilityLabel={c.discountValue}
            value={value === '' ? null : Number(value)}
            onChangeValue={change(setValue)}
          />
          <Row gap={1}>
            {['PCT', 'WON'].map((u) => (
              <Chip
                key={u}
                label={u === 'PCT' ? c.pct : c.won}
                selected={unit === u}
                onPress={() => {
                  setUnit(u);
                  vm.actions.clearDiscount();
                }}
              />
            ))}
          </Row>
        </Row>
        {field(h.discountShipping, shipping, setShipping)}
        <Row justify="space-between">
          <Text variant="label">{h.discountFree}</Text>
          <Switch
            accessibilityLabel={c.freeShipping}
            value={free}
            onChange={(v) => {
              setFree(v);
              vm.actions.clearDiscount();
            }}
          />
        </Row>
        {free && field(h.discountThreshold, threshold, setThreshold)}
      </Panel>
      {step(2, h.discountStep2)}
      <Panel>
        {vm.drafts.map((d, i) => (
          <Row key={i} gap={2}>
            <Stack flex={1}>
              <Product item={d} crop={d.crop} />
            </Stack>
            <Switch
              accessibilityLabel={d.name}
              value={d.needed}
              onChange={(needed) => {
                void vm.actions.draft(i, { needed });
              }}
            />
          </Row>
        ))}
      </Panel>
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
      {step(3, h.discountStep3)}
      {vm.discountRule ? (
        <Card tone={num(vm.discount.extra_spending) > 0 ? 'warning' : 'brandSubtle'}>
          <Stack gap={4}>
            <Text variant="title" tone={num(vm.discount.extra_spending) > 0 ? 'warning' : 'brand'}>
              {num(vm.discount.extra_spending) > 0 ? h.trapTitle : h.smartTitle}
            </Text>
            {num(vm.discount.extra_spending) > 0 && (
              <Text variant="htmlBody">{h.trapBody(money(vm.discount.extra_spending))}</Text>
            )}
            {['needed', 'all'].map((key) => {
              const q = object(vm.discount[key]);
              return (
                <Stack key={key} gap={1}>
                  <Row justify="space-between">
                    <Text variant="bodyStrong">{key === 'needed' ? h.neededQuote : h.allQuote}</Text>
                    <Text variant="heading">{money(q.total)}</Text>
                  </Row>
                  <Text variant="caption" tone="secondary">
                    {h.shippingSummary(money(q.subtotal), money(q.discount), money(q.shipping))}
                  </Text>
                </Stack>
              );
            })}
            {!!vm.discount.shipping_notice && (
              <Text variant="caption" tone="secondary">
                {str(vm.discount.shipping_notice)}
              </Text>
            )}
          </Stack>
        </Card>
      ) : (
        <Text variant="label" tone="tertiary">
          {h.discountPending}
        </Text>
      )}
    </HtmlScreen>
  );
}
