import { Card, Row, Stack, Text } from '@/components/ui';
import { copy } from '@/constants/copy';
import { formatWon } from '@/lib/format';

import { MoneyRow } from './MoneyRow';

type Field = 'income' | 'food' | 'living' | 'transport' | 'saving';

type Props = {
  values: Record<Field, number | null>;
  onChange: (field: Field, value: number | null) => void;
  /** 자유롭게 쓸 수 있는 돈 */
  free: number;
  dailySaving: number | null;
  incomeError?: boolean;
};

/** 시안 "이번 달 돈 계획" 입력 묶음 (온보딩·지갑 공용) */
export function BudgetFields({ values, onChange, free, dailySaving, incomeError }: Props) {
  return (
    <Stack gap={3}>
      <Card padding={5}>
        <MoneyRow
          label={copy.budget.income}
          value={values.income}
          onChangeValue={(v) => onChange('income', v)}
          error={incomeError ? copy.budget.incomeError : undefined}
          last
        />
      </Card>
      <Card padding={5}>
        <Text variant="label" tone="tertiary">
          {copy.budget.semiFixed}
        </Text>
        <MoneyRow
          label={copy.budget.food}
          hint={copy.budget.foodHint}
          value={values.food}
          onChangeValue={(v) => onChange('food', v)}
        />
        <MoneyRow
          label={copy.budget.living}
          hint={copy.budget.livingHint}
          value={values.living}
          onChangeValue={(v) => onChange('living', v)}
        />
        <MoneyRow label={copy.budget.transport} value={values.transport} onChangeValue={(v) => onChange('transport', v)} />
        <MoneyRow label={copy.budget.saving} value={values.saving} onChangeValue={(v) => onChange('saving', v)} last />
      </Card>
      <Card tone={free < 0 ? 'warning' : 'brandSubtle'} padding={5}>
        <Stack gap={1}>
          <Row justify="space-between">
            <Text variant="bodyStrong">{copy.budget.free}</Text>
            <Text variant="heading" tone={free < 0 ? 'warning' : 'brand'}>
              {formatWon(free)}
            </Text>
          </Row>
          {free < 0 ? (
            <Text variant="caption" tone="warning">
              {copy.budget.overWarning}
            </Text>
          ) : (
            dailySaving !== null && (
              <Text variant="caption" tone="secondary">
                {copy.budget.dailySaving(dailySaving)}
              </Text>
            )
          )}
        </Stack>
      </Card>
    </Stack>
  );
}
