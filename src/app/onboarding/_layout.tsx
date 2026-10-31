import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

/** 온보딩 (S01 소개 → S02 목표 → S03 이번 달 돈 계획) */
export default function OnboardingLayout() {
  const theme = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.color.bg.canvas } }} />;
}
