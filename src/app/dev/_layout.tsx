import { Redirect, Stack } from 'expo-router';

import { env } from '@/config/env';
import { copy } from '@/constants/copy';
import { useTheme } from '@/theme';

/** 데모 모드가 아니면 /dev 아래 화면은 모두 홈으로 돌려보낸다 */
export default function DevLayout() {
  const theme = useTheme();
  if (!env.demo) return <Redirect href="/" />;

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: theme.color.bg.canvas },
        headerStyle: { backgroundColor: theme.color.bg.surface },
        headerTintColor: theme.color.text.primary,
        headerTitleStyle: { fontFamily: theme.font.family.bold, fontSize: theme.typography.heading.fontSize },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: copy.dev.title }} />
      <Stack.Screen name="ui" options={{ title: copy.dev.uiCatalog }} />
    </Stack>
  );
}
