import { Button, Input, MoneyInput, Screen, ScreenHeader, Text } from '@/components/ui';
import { copy } from '@/constants/copy';
import { goBack } from '@/lib/navigation';
import { useExpenseForm } from '@/features/budget/useExpenseForm';

/** 등록 안 하고 쓴 돈 기록 (지갑에서 진입) */
export default function NewExpenseScreen() {
  const form = useExpenseForm();

  const save = () => {
    if (form.submit()) goBack('/wallet');
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      header={<ScreenHeader title={copy.expense.title} onBack={() => goBack('/wallet')} backLabel={copy.common.back} />}
      footer={<Button label={copy.expense.save} size="lg" fullWidth onPress={save} />}
    >
      <Text tone="secondary">{copy.expense.body}</Text>
      <Input
        label={copy.expense.labelLabel}
        placeholder={copy.expense.labelPlaceholder}
        value={form.label}
        onChangeText={form.setLabel}
        error={form.errors.label ? copy.expense.labelError : undefined}
      />
      <MoneyInput
        label={copy.expense.amountLabel}
        placeholder="0"
        value={form.amount}
        onChangeValue={form.setAmount}
        error={form.errors.amount ? copy.expense.amountError : undefined}
      />
    </Screen>
  );
}
