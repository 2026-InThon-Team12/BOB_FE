import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { CompactNumberInput } from '@/components/feature';
import {
  Button,
  Card,
  Icon,
  Input,
  MoneyInput,
  Row,
  Screen,
  ScreenHeader,
  SegmentedControl,
  Stack,
  StepBadge,
  Switch,
  Text,
  TextLink,
  Thumbnail,
  useToast,
} from '@/components/ui';
import { copy } from '@/constants/copy';
import { useDiscountTrap } from '@/features/discount/useDiscountTrap';
import { formatWon } from '@/lib/format';
import { goBack } from '@/lib/navigation';
import { makeStyles } from '@/theme';

const useStyles = makeStyles((t) => ({
  lineDivider: { height: 1, backgroundColor: t.color.border.default },
  inner: { padding: t.space[4], borderRadius: t.radius.md, backgroundColor: t.color.bg.surface, gap: t.space[2] },
  half: { flex: 1 },
}));

/** 할인 함정 확인 (기능 5, 명세서 4.11) */
export default function DiscountTrapScreen() {
  const styles = useStyles();
  const toast = useToast();
  const { batch } = useLocalSearchParams<{ batch?: string }>();
  const trap = useDiscountTrap(batch);
  const { check } = trap;
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState<number | null>(null);

  const home = () => router.dismissTo('/');
  const keepNeeded = () => {
    const n = trap.keepNeededOnly();
    if (n > 0) toast(copy.trap.keptNeeded(n));
    home();
  };
  const addLine = () => {
    if (!newName.trim() || !newPrice) return;
    trap.addManualLine(newName.trim(), newPrice);
    setNewName('');
    setNewPrice(null);
  };

  const hasLines = trap.lines.length > 0;
  const isTrap = check.verdict === 'trap';

  return (
    <Screen
      edges={['top', 'bottom']}
      header={<ScreenHeader title={copy.trap.title} onBack={() => goBack('/')} backLabel={copy.common.back} />}
    >
      {/* 1단계: 할인 조건 */}
      <Card padding={4}>
        <Stack gap={3}>
          <Row gap={2}>
            <StepBadge n={1} />
            <Text variant="label" weight="700">
              {copy.trap.step1}
            </Text>
          </Row>
          <Row gap={2} wrap>
            <CompactNumberInput
              value={trap.minAmount}
              onChangeValue={trap.setMinAmount}
              accessibilityLabel={copy.trap.minLabel}
              width={84}
            />
            <Text variant="label">{copy.trap.minSuffix}</Text>
            <CompactNumberInput value={trap.value} onChangeValue={trap.setValue} accessibilityLabel={copy.trap.valueLabel} width={64} />
            <SegmentedControl
              accessibilityLabel={copy.trap.unitLabel}
              value={trap.unit}
              onChange={trap.setUnit}
              options={[
                { value: 'pct', label: copy.trap.unitPct },
                { value: 'won', label: copy.trap.unitWon },
              ]}
            />
            <Text variant="label">{copy.trap.discountSuffix}</Text>
          </Row>
          <View style={styles.lineDivider} />
          {/* 무료배송 (명세서 4.11): 켜면 기준 금액, 끄면 배송비 */}
          <Row justify="space-between">
            <Text variant="label" weight="600">
              {copy.trap.freeShipLabel}
            </Text>
            <Switch value={trap.freeShipOn} onChange={trap.setFreeShipOn} accessibilityLabel={copy.trap.freeShipLabel} />
          </Row>
          {trap.freeShipOn ? (
            <Row gap={2}>
              <CompactNumberInput
                value={trap.freeMin}
                onChangeValue={trap.setFreeMin}
                accessibilityLabel={copy.trap.freeShipMinLabel}
                width={84}
              />
              <Text variant="label">{copy.trap.freeShipSuffix}</Text>
            </Row>
          ) : (
            <Row gap={2}>
              <Text variant="label">{copy.trap.shipFeePrefix}</Text>
              <CompactNumberInput value={trap.fee} onChangeValue={trap.setFee} accessibilityLabel={copy.trap.shipFeeLabel} width={84} />
              <Text variant="label">{copy.common.won}</Text>
            </Row>
          )}
        </Stack>
      </Card>

      {/* 2단계: 할인 없이도 살 물건 */}
      <Card padding={4}>
        <Stack gap={2}>
          <Row gap={2}>
            <StepBadge n={2} />
            <Text variant="label" weight="700">
              {copy.trap.step2}
            </Text>
          </Row>
          {trap.lines.map((l, i) => (
            <View key={l.key}>
              {i > 0 && <View style={styles.lineDivider} />}
              <Row gap={3}>
                <Thumbnail uri={l.imageUri} size="sm" placeholder={copy.common.imagePlaceholder} />
                <Stack flex={1} gap={1}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {l.name}
                  </Text>
                  <Text variant="caption" tone="secondary">
                    {`${formatWon(l.price)} · `}
                    <Text variant="caption" weight="600" tone={l.addedForDiscount ? 'warning' : 'secondary'}>
                      {l.addedForDiscount ? copy.trap.tagAdded : copy.trap.tagPlanned}
                    </Text>
                  </Text>
                </Stack>
                <Switch value={l.on} onChange={() => trap.toggle(l.key)} accessibilityLabel={copy.trap.toggle(l.name)} />
              </Row>
              {!trap.fromBatch && (
                <TextLink label={copy.trap.removeLine} tone="tertiary" onPress={() => trap.removeManualLine(l.key)} />
              )}
            </View>
          ))}
          {!trap.fromBatch && (
            <Stack gap={2}>
              {!hasLines && (
                <Text variant="caption" tone="tertiary">
                  {copy.trap.emptyLines}
                </Text>
              )}
              <Row gap={2} align="flex-end">
                <View style={styles.half}>
                  <Input label={copy.trap.lineName} value={newName} onChangeText={setNewName} />
                </View>
                <View style={styles.half}>
                  <MoneyInput label={copy.trap.linePrice} placeholder="0" value={newPrice} onChangeValue={setNewPrice} />
                </View>
              </Row>
              <TextLink label={copy.trap.addLine} icon="add" onPress={addLine} />
            </Stack>
          )}
        </Stack>
      </Card>

      {/* 3단계: 결과 */}
      {hasLines && (
        <Card tone={isTrap ? 'warning' : 'brandSubtle'}>
          <Stack gap={3}>
            <Row gap={2}>
              <StepBadge n={3} tone={isTrap ? 'warning' : 'brand'} />
              <Text variant="label" weight="700" tone={isTrap ? 'warning' : 'brand'}>
                {isTrap ? copy.trap.trapLabel : copy.trap.smartLabel}
              </Text>
            </Row>
            <Text variant="title">
              {isTrap ? copy.trap.trapTitle : copy.trap.smartTitle}
              <Text variant="title" tone={isTrap ? 'warning' : 'brand'}>
                {formatWon(isTrap ? check.extra : check.saved)}
              </Text>
              {isTrap ? copy.trap.trapTitleSuffix : copy.trap.smartTitleSuffix}
            </Text>
            <View style={styles.inner}>
              <Stack gap={1}>
                <Row justify="space-between">
                  <Text variant="label" tone="secondary">
                    {isTrap ? copy.trap.needOnly : copy.trap.noDiscount}
                  </Text>
                  <Text variant="bodyStrong">{formatWon(isTrap ? check.payNeeded : check.noDiscountPay)}</Text>
                </Row>
                <Text variant="caption" tone="tertiary">
                  {copy.trap.breakdown(isTrap ? check.breakdown.needed : check.breakdown.noDiscount)}
                </Text>
              </Stack>
              <Stack gap={1}>
                <Row justify="space-between">
                  <Text variant="label" tone="secondary">
                    {isTrap ? copy.trap.buyAll : copy.trap.nowPay}
                  </Text>
                  <Text variant="bodyStrong" tone={isTrap ? 'warning' : 'brand'}>
                    {formatWon(check.payAll)}
                  </Text>
                </Row>
                <Text variant="caption" tone="tertiary">
                  {copy.trap.breakdown(check.breakdown.all)}
                </Text>
              </Stack>
            </View>
          </Stack>
        </Card>
      )}

      {/* 무료배송 안내는 스위치가 켜져 있을 때만 */}
      {hasLines && trap.freeShipOn && (
        <Row gap={2} align="flex-start">
          <Icon name="shipping" size="sm" tone="secondary" />
          <Stack flex={1}>
            <Text variant="caption" tone="secondary">
              {check.freeShipping
                ? copy.trap.freeShip(check.freeShipping.remaining, trap.shipFee, check.freeShipping.savedByPayingShip)
                : copy.trap.freeShipDone}
            </Text>
          </Stack>
        </Row>
      )}

      {hasLines &&
        (isTrap ? (
          <Stack gap={2}>
            <Button label={copy.trap.ctaTrap(check.payNeeded)} size="lg" fullWidth onPress={keepNeeded} />
            <Button label={copy.trap.ctaAll} variant="ghost" fullWidth onPress={home} />
          </Stack>
        ) : (
          <Button label={copy.trap.ctaSmart} size="lg" fullWidth onPress={home} />
        ))}
    </Screen>
  );
}
