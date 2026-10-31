import { Card, ProgressBar, Row, Stack, Text, Thumbnail } from '@/components/ui';
import { copy } from '@/constants/copy';
import { formatMonthDay, formatWon } from '@/lib/format';

type Props = {
  name: string;
  price: number;
  imageUri?: string;
  saved: number;
  /** 0 ~ 1 */
  ratio: number;
  /** 예상 달성일 날짜 키 (모르면 null) */
  eta: string | null;
  dailySaving: number | null;
};

/** 목표 카드 (시안: 목표 탭 상단) */
export function GoalCard({ name, price, imageUri, saved, ratio, eta, dailySaving }: Props) {
  return (
    <Card>
      <Stack gap={4}>
        <Row gap={4}>
          <Thumbnail uri={imageUri} placeholder={copy.common.imagePlaceholder} />
          <Stack flex={1} gap={1}>
            <Text variant="heading" numberOfLines={1}>
              {name}
            </Text>
            <Text variant="label" tone="secondary">
              {formatWon(price)}
            </Text>
          </Stack>
          <Text variant="display" tone="brand">
            {copy.goal.percent(ratio)}
          </Text>
        </Row>
        <ProgressBar value={ratio} accessibilityLabel={`${name} ${copy.goal.percent(ratio)}`} />
        <Row justify="space-between">
          <Text variant="label" tone="secondary">
            {copy.goal.savedLabel}{' '}
            <Text variant="label" weight="700">
              {formatWon(saved)}
            </Text>
          </Text>
          {eta && (
            <Text variant="label" tone="secondary">
              {copy.goal.etaLabel}{' '}
              <Text variant="label" weight="700">
                {formatMonthDay(eta)}
              </Text>
            </Text>
          )}
        </Row>
        <Text variant="caption" tone="tertiary">
          {dailySaving ? copy.goal.dailySaving(dailySaving) : copy.goal.etaUnknown}
        </Text>
      </Stack>
    </Card>
  );
}
