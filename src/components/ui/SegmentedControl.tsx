import { Pressable, View } from 'react-native';

import { makeStyles, useTheme } from '@/theme';

import { Text } from './Text';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

const useStyles = makeStyles((t) => ({
  root: { flexDirection: 'row', padding: 3, borderRadius: t.radius.md, backgroundColor: t.color.bg.subtle },
  seg: { minWidth: 40, height: 36, paddingHorizontal: t.space[2], borderRadius: t.radius.sm, alignItems: 'center', justifyContent: 'center' },
}));

/** 명세서 SegmentedControl: `%` / `원` 2단, 바탕 회색, 선택 칸 흰색 */
export function SegmentedControl<T extends string>({ options, value, onChange, accessibilityLabel }: Props<T>) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.root} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={o.label}
            style={[styles.seg, { backgroundColor: on ? theme.color.bg.surface : 'transparent' }]}
          >
            <Text variant="label" weight="700" tone={on ? 'primary' : 'tertiary'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
