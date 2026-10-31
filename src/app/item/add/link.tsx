import { router } from 'expo-router';

import { Button, Input, Screen, ScreenHeader, Stack, Text } from '@/components/ui';
import { copy } from '@/constants/copy';
import { useLinkImport } from '@/features/register/useImport';
import { goBack } from '@/lib/navigation';

/** 상품 링크 붙여넣기 (공유 시트 대신 — 웹 데모 대응) */
export default function LinkScreen() {
  const link = useLinkImport();

  const fetchLink = async () => {
    const result = await link.fetchLink();
    // 실패해도 링크만 남긴 빈 초안으로 직접 입력을 이어간다
    if (result !== 'canceled') router.replace('/item/add/review');
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      header={<ScreenHeader title={copy.register.linkScreenTitle} onBack={() => goBack('/item/add')} backLabel={copy.common.back} />}
      footer={
        <Button label={copy.register.linkFetch} size="lg" fullWidth loading={link.loading} onPress={fetchLink} />
      }
    >
      <Stack gap={2}>
        <Text tone="secondary">{copy.register.linkBody}</Text>
      </Stack>
      <Input
        label={copy.register.linkLabel}
        placeholder={copy.register.linkPlaceholder}
        value={link.url}
        onChangeText={link.setUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        inputMode="url"
        error={link.invalid ? copy.register.linkInvalid : undefined}
      />
    </Screen>
  );
}
