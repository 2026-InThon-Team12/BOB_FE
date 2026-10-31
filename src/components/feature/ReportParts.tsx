/** 구매 후 점검 · 리포트 화면 조각 (시안 기준) */
import { View } from 'react-native';

import { Card, ProgressBar, Row, Stack, Text, type ProgressTone, type TextTone } from '@/components/ui';
import { makeStyles } from '@/theme';

/** 점검 답 고르기 카드 (시안: "가끔 · 1–4일") */
export function BucketOption(props: { label: string; range: string; selected: boolean; onPress: () => void }) {
  return (
    <Card
      tone={props.selected ? 'brandSubtle' : 'default'}
      selected={props.selected}
      padding={4}
      onPress={props.onPress}
      accessibilityLabel={`${props.label} ${props.range}`}
    >
      <Stack gap={1}>
        <Text variant="bodyStrong" tone={props.selected ? 'brand' : 'primary'}>
          {props.label}
        </Text>
        <Text variant="caption" tone={props.selected ? 'brand' : 'tertiary'}>
          {props.range}
        </Text>
      </Stack>
    </Card>
  );
}

/** 라벨 + 오른쪽 값 + 막대 한 줄 (시안: "사기 전 예측 · 14일 중 11일") */
export function BarRow(props: {
  label?: string;
  value: string;
  ratio: number;
  tone?: ProgressTone;
  valueTone?: TextTone;
  strong?: boolean;
}) {
  return (
    <Stack gap={1}>
      <Row justify={props.label ? 'space-between' : 'flex-end'}>
        {props.label && (
          <Text variant="label" tone="secondary">
            {props.label}
          </Text>
        )}
        <Text variant="label" weight={props.strong ? '700' : '500'} tone={props.valueTone ?? 'primary'}>
          {props.value}
        </Text>
      </Row>
      <ProgressBar value={props.ratio} tone={props.tone ?? 'brand'} />
    </Stack>
  );
}

/** 리포트 상단 숫자 타일 (시안: 등록 12개 · Bye 한 물건 7개 · 지킨 돈 51.2만) */
export function StatTile(props: { label: string; value: string; tone?: TextTone }) {
  return (
    <Stack flex={1}>
      <Card padding={4}>
        <Stack gap={2}>
          <Text variant="caption" tone="secondary">
            {props.label}
          </Text>
          <Text variant="heading" tone={props.tone ?? 'primary'} numberOfLines={1}>
            {props.value}
          </Text>
        </Stack>
      </Card>
    </Stack>
  );
}

const useRateStyles = makeStyles((t) => ({
  label: { width: 120 },
  bar: { flex: 1 },
  rate: { width: 44, alignItems: 'flex-end' },
  gap: { gap: t.space[3] },
}));

/** 구매 이유별 포기율 한 줄 (시안: "할인·한정 판매 ▬▬▬ 78%") */
export function RateRow(props: { label: string; rate: number; rateText: string; highlight?: boolean }) {
  const styles = useRateStyles();
  return (
    <Row style={styles.gap}>
      <View style={styles.label}>
        <Text variant="label" weight={props.highlight ? '700' : '400'} numberOfLines={1}>
          {props.label}
        </Text>
      </View>
      <View style={styles.bar}>
        <ProgressBar value={props.rate} tone={props.highlight ? 'warning' : 'brand'} size="sm" />
      </View>
      <View style={styles.rate}>
        <Text variant="label" weight="700">
          {props.rateText}
        </Text>
      </View>
    </Row>
  );
}
