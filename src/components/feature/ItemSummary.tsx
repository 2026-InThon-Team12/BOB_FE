import { Card, Row, Stack, Text, Thumbnail } from '@/components/ui';
import { CATEGORY_LABELS } from '@/constants/categories';
import { copy } from '@/constants/copy';
import { formatWon } from '@/lib/format';
import type { CategoryId } from '@/types';

type Props = {
  name: string;
  price: number;
  category: CategoryId;
  imageUri?: string;
  /** 둘째 줄 끝에 붙는 설명 (예: "산 지 14일") */
  extra?: string;
};

/** 물품 요약 카드 (시안: 이유 고르기·결과·점검 화면 상단) */
export function ItemSummary({ name, price, category, imageUri, extra }: Props) {
  const meta = [CATEGORY_LABELS[category], formatWon(price), extra].filter(Boolean).join(' · ');
  return (
    <Card padding={4}>
      <Row gap={3}>
        <Thumbnail uri={imageUri} placeholder={copy.common.imagePlaceholder} />
        <Stack flex={1} gap={1}>
          <Text variant="heading" numberOfLines={1}>
            {name}
          </Text>
          <Text variant="label" tone="secondary">
            {meta}
          </Text>
        </Stack>
      </Row>
    </Card>
  );
}
