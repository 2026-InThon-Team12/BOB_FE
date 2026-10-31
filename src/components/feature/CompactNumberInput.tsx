import { TextInput } from 'react-native';

import { formatDigits, parseWon } from '@/lib/format';
import { makeStyles, useTheme } from '@/theme';

type Props = {
  value: number | null;
  onChangeValue: (v: number | null) => void;
  accessibilityLabel: string;
  /** 시안: 금액 칸 74px · 할인 칸 60px */
  width: number;
};

const useStyles = makeStyles((t) => ({
  input: {
    height: 42,
    paddingHorizontal: t.space[2],
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderColor: t.color.border.default,
    backgroundColor: t.color.bg.subtle,
    textAlign: 'right',
    ...t.typography.bodyStrong,
    fontFamily: t.font.family.bold,
    color: t.color.text.primary,
  },
}));

/** 한 줄 조건 입력용 작은 숫자 칸 (숫자만, 천 단위 쉼표) */
export function CompactNumberInput({ value, onChangeValue, accessibilityLabel, width }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <TextInput
      value={formatDigits(value)}
      onChangeText={(t) => onChangeValue(parseWon(t))}
      keyboardType="number-pad"
      inputMode="numeric"
      accessibilityLabel={accessibilityLabel}
      placeholder="0"
      placeholderTextColor={theme.color.text.disabled}
      style={[styles.input, { width }]}
    />
  );
}
