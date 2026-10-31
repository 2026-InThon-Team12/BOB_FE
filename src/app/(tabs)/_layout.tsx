import { Redirect, Tabs } from 'expo-router';

import { Icon, type IconName } from '@/components/ui';
import { copy } from '@/constants/copy';
import { useSettings } from '@/data';
import { useTheme } from '@/theme';

// 시안: 홈 · 목표(즉석 개입 포함) · 리포트 · 지갑(가계부)
const tabs: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: copy.tabs.home, icon: 'home' },
  { name: 'goal', title: copy.tabs.goal, icon: 'goal' },
  { name: 'report', title: copy.tabs.report, icon: 'report' },
  { name: 'wallet', title: copy.tabs.wallet, icon: 'wallet' },
];

export default function TabsLayout() {
  const theme = useTheme();
  const { onboarded } = useSettings();
  // 첫 실행이면 온보딩부터 (데이터를 모두 지워도 여기로 돌아온다)
  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.color.brand.solid,
        tabBarInactiveTintColor: theme.color.text.tertiary,
        tabBarLabelStyle: { fontFamily: theme.font.family.medium },
        tabBarStyle: {
          backgroundColor: theme.color.bg.surface,
          borderTopColor: theme.color.border.default,
        },
        sceneStyle: { backgroundColor: theme.color.bg.canvas },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => (
              <Icon name={tab.icon} color={typeof color === 'string' ? color : undefined} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
