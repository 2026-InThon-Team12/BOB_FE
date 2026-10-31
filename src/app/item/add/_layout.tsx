import { Stack } from 'expo-router';

import { AddFlowProvider } from '@/features/register/AddFlowContext';
import { useTheme } from '@/theme';

/** 물품 등록 흐름 (기능 3·6): 방법 선택 → 스크린샷 | 링크 | 직접 입력 → 확인 → 이유 고르기 */
export default function AddItemLayout() {
  const theme = useTheme();
  return (
    <AddFlowProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.color.bg.canvas } }} />
    </AddFlowProvider>
  );
}
