import { router } from 'expo-router';

import { Button, Card, Icon, Row, Screen, Stack, Text } from '@/components/ui';
import { copy } from '@/constants/copy';
import {
  loadDemoSeed,
  resetAllData,
  resetClock,
  shiftClock,
  useAnswers,
  useItems,
  useSettings,
  useToday,
} from '@/data';

const SHIFTS = [1, 7, 14];

export default function DevScreen() {
  const today = useToday();
  const { clockOffsetDays } = useSettings();
  const items = useItems();
  const answers = useAnswers();

  return (
    <Screen subtitle={copy.dev.subtitle} edges={['bottom']}>
      <Card>
        <Stack gap={3}>
          <Row gap={2}>
            <Icon name="clock" tone="brand" />
            <Text variant="bodyStrong">{copy.dev.clockTitle}</Text>
          </Row>
          <Text tone="secondary">{copy.dev.clockStatus(today, clockOffsetDays)}</Text>
          <Row gap={2} wrap>
            {SHIFTS.map((d) => (
              <Button key={d} label={`+${d}일`} variant="secondary" onPress={() => shiftClock(d)} />
            ))}
            <Button label={copy.dev.clockReset} variant="ghost" onPress={resetClock} disabled={clockOffsetDays === 0} />
          </Row>
        </Stack>
      </Card>

      <Card>
        <Stack gap={3}>
          <Row gap={2}>
            <Icon name="sparkles" tone="brand" />
            <Text variant="bodyStrong">{copy.dev.dataTitle}</Text>
          </Row>
          <Text tone="secondary">{copy.dev.dataStatus(items.length, answers.length)}</Text>
          <Button label={copy.dev.seed} onPress={loadDemoSeed} />
          <Text variant="caption" tone="tertiary">
            {copy.dev.seedHint}
          </Text>
          <Button label={copy.dev.reset} variant="danger" onPress={resetAllData} />
        </Stack>
      </Card>

      <Card onPress={() => router.push('/dev/ui')} accessibilityLabel={copy.dev.uiCatalog}>
        <Row gap={3}>
          <Icon name="palette" tone="brand" />
          <Stack flex={1} gap={1}>
            <Text variant="bodyStrong">{copy.dev.uiCatalog}</Text>
            <Text variant="caption" tone="secondary">
              {copy.dev.uiCatalogDescription}
            </Text>
          </Stack>
          <Icon name="chevronRight" tone="tertiary" />
        </Row>
      </Card>
    </Screen>
  );
}
