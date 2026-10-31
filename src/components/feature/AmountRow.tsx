import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Row, Stack, Text } from '@/components/ui';
import { formatWon } from '@/lib/format';
import { makeStyles } from '@/theme';

type Props = {
  label: string;
  hint?: string;
  amount: number;
  /** 강조 행 (시안: "자유롭게 쓸 수 있는 돈" 파란 큰 숫자) */
  emphasis?: boolean;
  /** 오른쪽 끝 추가 요소 (예: 삭제 버튼) */
  trailing?: ReactNode;
  last?: boolean;
};

const useStyles = makeStyles((t) => ({
  row: {
    paddingVertical: t.space[3],
    borderBottomWidth: 1,
    borderBottomColor: t.color.border.default,
  },
  last: { borderBottomWidth: 0 },
}));

/** 읽기 전용 금액 한 줄 (지갑 "이번 달 돈 계획", "등록 안 하고 쓴 돈") */
export function AmountRow({ label, hint, amount, emphasis, trailing, last }: Props) {
  const styles = useStyles();
  return (
    <View style={[styles.row, last && styles.last]}>
      <Row gap={3}>
        <Stack flex={1} gap={1}>
          <Text variant="bodyStrong">{label}</Text>
          {hint && (
            <Text variant="caption" tone="tertiary">
              {hint}
            </Text>
          )}
        </Stack>
        <Text variant={emphasis ? 'heading' : 'bodyStrong'} tone={emphasis ? 'brand' : 'primary'}>
          {formatWon(amount)}
        </Text>
        {trailing}
      </Row>
    </View>
  );
}
