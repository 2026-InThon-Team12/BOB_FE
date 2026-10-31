import { BudgetFields } from '@/components/feature';
import { Button, Card, Screen, ScreenHeader, Text } from '@/components/ui';
import { copy } from '@/constants/copy';
import { goBack } from '@/lib/navigation';
import { useBudgetForm } from '@/features/budget/useBudgetForm';

/** 이번 달 돈 계획 입력·수정 (지갑에서 진입) */
export default function BudgetEditScreen() {
  const form = useBudgetForm();

  const save = () => {
    if (form.submit()) goBack('/wallet');
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      header={
        <ScreenHeader title={copy.budget.editTitle(form.month)} onBack={() => goBack('/wallet')} backLabel={copy.common.back} />
      }
      footer={<Button label={copy.budget.save} size="lg" fullWidth onPress={save} />}
    >
      {form.prefilledFrom && (
        <Card tone="brandSubtle" padding={4}>
          <Text variant="label" tone="brand">
            {copy.budget.prefilled(form.prefilledFrom)}
          </Text>
        </Card>
      )}
      <BudgetFields
        values={form.values}
        onChange={form.setValue}
        free={form.free}
        dailySaving={form.dailySaving}
        incomeError={form.errors.income}
      />
    </Screen>
  );
}
