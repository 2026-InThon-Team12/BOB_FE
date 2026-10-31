import { Pressable } from 'react-native';

import { makeStyles, useTheme } from '@/theme';

import { Icon } from './Icon';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  accessibilityLabel: string;
};

const useStyles = makeStyles((t) => ({
  box: {
    width: 26,
    height: 26,
    borderRadius: t.radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

/** 시안의 파란 체크박스 (인식 품목 포함 여부) */
export function Checkbox({ checked, onChange, accessibilityLabel }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={theme.layout.hitSlop}
      style={[
        styles.box,
        {
          backgroundColor: checked ? theme.color.brand.solid : theme.color.bg.surface,
          borderColor: checked ? theme.color.brand.solid : theme.color.border.strong,
        },
      ]}
    >
      {checked && <Icon name="check" size="sm" tone="inverse" />}
    </Pressable>
  );
}
