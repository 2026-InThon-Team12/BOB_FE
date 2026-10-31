import { Card, ProgressBar, Row, Stack, Text } from '@/components/ui';
import { copy } from '@/constants/copy';
import { formatWon } from '@/lib/format';

type Props = {
  /** 가계부 항목 이름 (예: 자유 소비) */
  bucketLabel: string;
  limit: number;
  remaining: number;
  /** 이 물건을 샀을 때 남는 돈 (음수면 잔액보다 비쌈) */
  afterPurchase: number;
};

/** 시안 "이번 달 자유 소비 잔액" 카드 (기능 7 리마인드) */
export function BalanceReminder({ bucketLabel, limit, remaining, afterPurchase }: Props) {
  const over = afterPurchase < 0;
  return (
    <Card tone={over ? 'warning' : 'brandSubtle'} padding={5}>
      <Stack gap={3}>
        <Row justify="space-between">
          <Text variant="label" tone={over ? 'warning' : 'brand'}>
            {copy.register.bucketBalance(bucketLabel)}
          </Text>
          <Text variant="bodyStrong" weight="700">
            {formatWon(remaining)}
          </Text>
        </Row>
        <ProgressBar value={limit > 0 ? Math.max(0, remaining) / limit : 0} tone={over ? 'warning' : 'brand'} size="sm" />
        <Text variant="label">
          {over ? copy.register.overBalance(-afterPurchase) : copy.register.withinBalance(afterPurchase)}
        </Text>
      </Stack>
    </Card>
  );
}
