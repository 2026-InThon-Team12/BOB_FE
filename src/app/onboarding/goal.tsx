import { router } from 'expo-router';

import { GoalSetupForm } from '@/components/feature';
import { Button, Screen, ScreenHeader, Text } from '@/components/ui';
import { copy } from '@/constants/copy';
import { completeOnboarding } from '@/data';
import { useGoalSetup } from '@/features/goal/useGoalSetup';
import { goBack } from '@/lib/navigation';

/** 예산 입력 뒤 첫 목표를 만들고 온보딩을 마친다. */
export default function OnboardingGoalScreen() {
  const setup = useGoalSetup('first');

  const next = () => {
    if (!setup.submit()) return;
    completeOnboarding();
    router.dismissTo('/');
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      header={
        <ScreenHeader
          title={copy.goalSetup.titleFirst}
          onBack={() => goBack('/onboarding/budget')}
          backLabel={copy.common.back}
          right={
            <Text variant="label" tone="tertiary">
              {copy.onboarding.step(2, 2)}
            </Text>
          }
        />
      }
      footer={
        setup.ready ? (
          <Button label={copy.onboarding.finish} size="lg" fullWidth onPress={next} />
        ) : (
          <Button label={copy.goalSetup.needInput} variant="secondary" size="lg" fullWidth disabled />
        )
      }
    >
      <GoalSetupForm form={setup} />
    </Screen>
  );
}
