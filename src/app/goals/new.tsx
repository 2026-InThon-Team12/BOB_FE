import { router, useLocalSearchParams } from 'expo-router';

import { GoalSetupForm } from '@/components/feature';
import { Button, Screen, ScreenHeader } from '@/components/ui';
import { copy } from '@/constants/copy';
import { useGoalSetup, type GoalSetupMode } from '@/features/goal/useGoalSetup';
import { goBack } from '@/lib/navigation';

const parseMode = (m: string | undefined): GoalSetupMode | undefined => (m === 'first' || m === 'change' ? m : undefined);

/**
 * 목표 정하기 (명세서 4.8-1) — GoalSetup(바꿀 때) · GoalSetupFirst(처음)
 * ?mode=first|change, 없으면 달성 전인 목표가 있을 때 "바꿀 때"
 */
export default function GoalSetupScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const setup = useGoalSetup(parseMode(params.mode));
  const isChange = setup.mode === 'change';

  const save = () => {
    if (setup.submit()) router.replace('/goal');
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      header={
        <ScreenHeader
          title={isChange ? copy.goalSetup.titleChange : copy.goalSetup.titleFirst}
          onBack={() => goBack('/goal')}
          backLabel={copy.common.back}
        />
      }
      footer={
        setup.ready ? (
          <Button label={isChange ? copy.goalSetup.ctaChange : copy.goalSetup.ctaFirst} size="lg" fullWidth onPress={save} />
        ) : (
          <Button label={copy.goalSetup.needInput} variant="secondary" size="lg" fullWidth disabled />
        )
      }
    >
      <GoalSetupForm form={setup} />
    </Screen>
  );
}
