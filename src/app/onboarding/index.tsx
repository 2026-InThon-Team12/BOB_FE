import { router } from 'expo-router';

import { Button, Screen, Stack, Text } from '@/components/ui';
import { env } from '@/config/env';
import { copy } from '@/constants/copy';

/** S01 소개 */
export default function WelcomeScreen() {
  return (
    <Screen
      scroll={false}
      edges={['top', 'bottom']}
      footer={
        <Stack gap={2}>
          <Button label={copy.onboarding.start} size="lg" fullWidth onPress={() => router.push('/onboarding/goal')} />
          {env.demo && (
            <Button label={copy.dev.entry} variant="ghost" icon="dev" onPress={() => router.push('/dev')} />
          )}
        </Stack>
      }
    >
      <Stack flex={1} justify="center" gap={5}>
        <Stack gap={1}>
          <Text variant="display">{copy.appName}</Text>
          <Text variant="label" tone="brand">
            {copy.onboarding.tagline}
          </Text>
        </Stack>
        <Text variant="title">{copy.onboarding.headline}</Text>
        <Text tone="secondary">{copy.onboarding.body}</Text>
      </Stack>
    </Screen>
  );
}
