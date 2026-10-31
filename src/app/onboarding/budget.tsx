import { router } from 'expo-router';

import { BudgetFields } from '@/components/feature';
import { Button, Screen, ScreenHeader, Stack, Text } from '@/components/ui';
import { copy } from '@/constants/copy';
import { goBack } from '@/lib/navigation';
import { useBudgetForm } from '@/features/budget/useBudgetForm';

/** S03 이번 달 돈 계획 */
export default function OnboardingBudgetScreen() {
  const form = useBudgetForm();

  const finish = () => {
    if (!form.submit()) return;
    router.push('/onboarding/goal');
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      header={
        <ScreenHeader
          onBack={() => goBack('/onboarding')}
          backLabel={copy.common.back}
          right={
            <Text variant="label" tone="tertiary">
              {copy.onboarding.step(1, 2)}
            </Text>
          }
        />
      }
      footer={<Button label={copy.onboarding.next} size="lg" fullWidth onPress={finish} />}
    >
      <Stack gap={2}>
        <Text variant="title">{copy.onboarding.budgetTitle}</Text>
        <Text tone="secondary">{copy.onboarding.budgetBody}</Text>
      </Stack>
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
