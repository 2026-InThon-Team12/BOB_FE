import { router } from 'expo-router';

import { GoalSetupForm } from '@/components/feature';
import { Button, Screen, ScreenHeader, Text } from '@/components/ui';
import { copy } from '@/constants/copy';
import { useGoalSetup } from '@/features/goal/useGoalSetup';
import { goBack } from '@/lib/navigation';

/** S02 첫 목표 — 목표 정하기(처음, 명세서 4.8-1)와 같은 폼, 다음은 가계부 */
export default function OnboardingGoalScreen() {
  const setup = useGoalSetup('first');

  const next = () => {
    if (setup.submit()) router.push('/onboarding/budget');
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      header={
        <ScreenHeader
          title={copy.goalSetup.titleFirst}
          onBack={() => goBack('/onboarding')}
          backLabel={copy.common.back}
          right={
            <Text variant="label" tone="tertiary">
              {copy.onboarding.step(1, 2)}
            </Text>
          }
        />
      }
      footer={
        setup.ready ? (
          <Button label={copy.onboarding.next} size="lg" fullWidth onPress={next} />
        ) : (
          <Button label={copy.goalSetup.needInput} variant="secondary" size="lg" fullWidth disabled />
        )
      }
    >
      <GoalSetupForm form={setup} />
    </Screen>
  );
}
