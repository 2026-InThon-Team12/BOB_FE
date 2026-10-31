import {
  IBMPlexSansKR_400Regular,
  IBMPlexSansKR_500Medium,
  IBMPlexSansKR_600SemiBold,
  IBMPlexSansKR_700Bold,
  useFonts,
} from '@expo-google-fonts/ibm-plex-sans-kr';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Startup } from '@/components/feature/Startup';
import { policy } from '@/config/policy';
import { PhoneFrame, ToastProvider } from '@/components/ui';
import { useHydrated, useSettings } from '@/data';
import { useReminderSync } from '@/features/simulation/useReminderSync';
import { createQueryClient } from '@/lib/queryClient';
import { ThemeProvider, useTheme } from '@/theme';

// 시안 글꼴: IBM Plex Sans KR. 글꼴을 바꾸면 여기와 theme/tokens.ts의 font.family를 함께 고친다.
const FONTS = { IBMPlexSansKR_400Regular, IBMPlexSansKR_500Medium, IBMPlexSansKR_600SemiBold, IBMPlexSansKR_700Bold };

function NotificationSync() {useReminderSync();return null;}

function RootNavigator() {
  const theme = useTheme();
  const hydrated = useHydrated();
  // 글꼴을 못 불러와도(오프라인 등) 시스템 글꼴로 계속 진행한다
  const [fontsLoaded, fontError] = useFonts(FONTS);
  const [startup, setStartup] = useState(true);
  useEffect(() => {const timer=setTimeout(() => setStartup(false), policy.startupMs);return () => clearTimeout(timer);}, []);
  const ready = hydrated && (fontsLoaded || !!fontError);

  return (
    <PhoneFrame>
      <ToastProvider>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      {/* 저장 데이터·글꼴을 불러오기 전에는 화면을 그리지 않는다 (빈 데이터·글꼴 바뀜이 잠깐 보이는 것 방지) */}
      {ready && (
        <Stack
          screenOptions={{
            // 화면마다 시안의 ScreenHeader를 쓴다 (개발자 도구만 자체 헤더)
            headerShown: false,
            contentStyle: { backgroundColor: theme.color.bg.canvas },
            headerStyle: { backgroundColor: theme.color.bg.surface },
            headerTintColor: theme.color.text.primary,
          headerTitleStyle: { fontFamily: theme.font.family.bold, fontSize: theme.typography.heading.fontSize },
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="dev" />
        </Stack>
      )}
      {ready && <NotificationSync />}
      {(startup || !ready) && <Startup/>}
      </ToastProvider>
    </PhoneFrame>
  );
}

function ThemedApp() {
  const { themeScheme } = useSettings();
  return (
    <ThemeProvider scheme={themeScheme ?? 'light'}>
      <RootNavigator />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemedApp />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
