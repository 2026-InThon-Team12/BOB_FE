import { router } from 'expo-router';
import { ActivityIndicator } from 'react-native';

import { Button, Card, Icon, Screen, ScreenHeader, Stack, Text, Thumbnail } from '@/components/ui';
import { copy } from '@/constants/copy';
import { useScreenshotImport, useStartManual } from '@/features/register/useImport';
import { goBack } from '@/lib/navigation';
import { useTheme } from '@/theme';

/** 장바구니 스크린샷 → AI 인식 (기능 3) */
export default function ScreenshotScreen() {
  const theme = useTheme();
  const importer = useScreenshotImport();
  const startManual = useStartManual();

  const pick = async () => {
    if ((await importer.pickAndAnalyze()) === 'done') router.replace('/item/add/review');
  };
  const manual = () => {
    startManual();
    router.replace('/item/add/review');
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      header={<ScreenHeader onBack={() => goBack('/item/add')} backLabel={copy.common.back} />}
      footer={
        !importer.analyzing && (
          <Stack gap={2}>
            <Button
              label={importer.failed ? copy.register.retry : copy.register.pickButton}
              icon="image"
              size="lg"
              fullWidth
              onPress={pick}
            />
            {importer.failed && (
              <Button label={copy.register.toManual} variant="ghost" fullWidth onPress={manual} />
            )}
          </Stack>
        )
      }
    >
      {importer.analyzing ? (
        <Card>
          <Stack align="center" gap={4} paddingY={8}>
            <Thumbnail uri={importer.image?.uri} />
            <ActivityIndicator color={theme.color.brand.solid} />
            <Stack align="center" gap={1}>
              <Text variant="heading">{copy.register.analyzing}</Text>
              <Text variant="label" tone="secondary" align="center">
                {copy.register.analyzingBody}
              </Text>
            </Stack>
          </Stack>
        </Card>
      ) : importer.failed ? (
        <Card tone="warning">
          <Stack gap={2}>
            <Icon name="warning" tone="warning" />
            <Text variant="heading">{importer.empty ? copy.register.analyzeEmpty : copy.register.analyzeFailed}</Text>
            <Text variant="label" tone="secondary">
              {importer.empty
                ? copy.register.analyzeEmptyBody(importer.warnings, importer.analysisMethod)
                : copy.register.analyzeFailedBody}
            </Text>
          </Stack>
        </Card>
      ) : (
        <Stack gap={2}>
          <Text variant="title">{copy.register.pickTitle}</Text>
          <Text tone="secondary">{copy.register.pickBody}</Text>
        </Stack>
      )}
    </Screen>
  );
}
