import { router } from 'expo-router';

import { MethodOption } from '@/components/feature';
import { Card, Icon, Row, Screen, ScreenHeader, Stack, Text } from '@/components/ui';
import { copy } from '@/constants/copy';
import { useStartManual } from '@/features/register/useImport';
import { goBack } from '@/lib/navigation';

/** 등록 방법 선택 (시안 "무엇을 사고 싶나요?") */
export default function AddMethodScreen() {
  const startManual = useStartManual();

  return (
    <Screen
      edges={['top', 'bottom']}
      header={<ScreenHeader onBack={() => goBack('/')} backLabel={copy.common.back} />}
    >
      <Stack gap={2}>
        <Text variant="title">{copy.register.methodTitle}</Text>
        <Text tone="secondary">{copy.register.methodBody}</Text>
      </Stack>
      {/* 필수 경고 (명세서 4.2): 모든 등록 방법에 적용 */}
      <Card tone="alert" padding={4}>
        <Row gap={2}>
          <Icon name="warning" size="sm" tone="alert" />
          <Stack flex={1}>
            <Text variant="label" weight="700" tone="alert">
              {copy.register.sameShop}
            </Text>
          </Stack>
        </Row>
      </Card>
      <MethodOption
        icon="image"
        title={copy.register.screenshotTitle}
        body={copy.register.screenshotBody}
        badge={copy.register.recommended}
        highlighted
        onPress={() => router.push('/item/add/screenshot')}
      />
      <MethodOption
        icon="link"
        title={copy.register.linkTitle}
        body={copy.register.linkBody}
        onPress={() => router.push('/item/add/link')}
      />
      <MethodOption
        icon="pencil"
        title={copy.register.manualTitle}
        body={copy.register.manualBody}
        onPress={() => {
          startManual();
          router.push('/item/add/review');
        }}
      />

      <Text variant="label" tone="secondary">
        {copy.register.otherTitle}
      </Text>
      <Card onPress={() => router.push('/impulse')} accessibilityLabel={copy.register.otherImpulseTitle}>
        <Row gap={3}>
          <Stack flex={1} gap={1}>
            <Text variant="bodyStrong">{copy.register.otherImpulseTitle}</Text>
            <Text variant="caption" tone="secondary">
              {copy.register.otherImpulseBody}
            </Text>
          </Stack>
          <Icon name="chevronRight" tone="tertiary" />
        </Row>
      </Card>
    </Screen>
  );
}
