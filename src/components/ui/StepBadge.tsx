import { View } from 'react-native';

import { makeStyles, useTheme } from '@/theme';

import { Text } from './Text';

/** 명세서 StepBadge: 22px 원 + 숫자, 흐름 안내용 */
export function StepBadge({ n, tone = 'ink' }: { n: number; tone?: 'ink' | 'warning' | 'brand' }) {
  const theme = useTheme();
  const styles = useStyles();
  const bg = tone === 'warning' ? theme.color.warning.pressed : tone === 'brand' ? theme.color.text.brand : theme.color.bg.inverse;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text variant="caption" weight="700" tone="inverse">
        {n}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  badge: { width: 22, height: 22, borderRadius: t.radius.pill, alignItems: 'center', justifyContent: 'center' },
}));
