import { Badge, Card, Checkbox, Chip, Input, MoneyInput, Row, Stack, Text, TextLink, Thumbnail } from '@/components/ui';
import { CATEGORIES, CATEGORY_LABELS } from '@/constants/categories';
import { copy } from '@/constants/copy';
import { formatWon } from '@/lib/format';
import type { CategoryId } from '@/types';

type Props = {
  name: string;
  price: number | null;
  category: CategoryId | null;
  imageUri?: string;
  included: boolean;
  /** 가격으로 정한 시뮬레이션 기간 */
  days: number | null;
  aiPicked: boolean;
  suggesting: boolean;
  expanded: boolean;
  errors: { name: boolean; price: boolean };
  onToggleExpanded: () => void;
  onIncludedChange: (v: boolean) => void;
  onNameChange: (v: string) => void;
  onPriceChange: (v: number | null) => void;
  onCategoryChange: (v: CategoryId) => void;
  onRemove: () => void;
};

/** 시안 "N개 품목을 찾았어요"의 품목 한 줄 — 누르면 이름·가격·카테고리를 고칠 수 있다 */
export function DraftRowCard(p: Props) {
  const label = p.category ? CATEGORY_LABELS[p.category] : copy.register.pickCategory;
  const hasError = p.errors.name || p.errors.price;
  const expanded = p.expanded || hasError;

  return (
    <Card padding={4}>
      <Stack gap={3}>
        <Row gap={3}>
          <Checkbox
            checked={p.included}
            onChange={p.onIncludedChange}
            accessibilityLabel={copy.register.include(p.name)}
          />
          <Thumbnail uri={p.imageUri} size="sm" placeholder={copy.common.imagePlaceholder} />
          <Stack flex={1} gap={1}>
            <Text variant="bodyStrong" tone={p.name ? 'primary' : 'disabled'} numberOfLines={1}>
              {p.name || copy.register.namePlaceholder}
            </Text>
            <Text variant="bodyStrong" weight="700" tone={p.price ? 'primary' : 'disabled'}>
              {p.price ? formatWon(p.price) : copy.register.priceLabel}
            </Text>
          </Stack>
        </Row>
        <Row justify="space-between">
          <Chip
            label={p.suggesting ? copy.register.categoryLoading : label}
            icon={p.aiPicked ? 'ai' : undefined}
            trailingIcon={expanded ? undefined : 'chevronDown'}
            onPress={p.onToggleExpanded}
          />
          {p.days && <Badge label={copy.register.simulationDays(p.days)} tone="brand" />}
        </Row>

        {expanded && (
          <Stack gap={3}>
            <Input
              label={copy.register.nameLabel}
              placeholder={copy.register.namePlaceholder}
              value={p.name}
              onChangeText={p.onNameChange}
              error={p.errors.name ? copy.register.nameError : undefined}
            />
            <MoneyInput
              label={copy.register.priceLabel}
              placeholder="0"
              value={p.price}
              onChangeValue={p.onPriceChange}
              error={p.errors.price ? copy.register.priceError : undefined}
            />
            {p.aiPicked && p.category && (
              <Text variant="caption" tone="secondary">
                {copy.register.aiPicked(CATEGORY_LABELS[p.category])}
              </Text>
            )}
            <Row gap={2} wrap>
              {CATEGORIES.map((c) => (
                <Chip
                  key={c.id}
                  label={c.label}
                  selectedStyle="solid"
                  selected={p.category === c.id}
                  onPress={() => p.onCategoryChange(c.id)}
                />
              ))}
            </Row>
            <TextLink label={copy.register.removeRow} tone="tertiary" onPress={p.onRemove} />
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
