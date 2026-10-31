import { TextInput, View } from 'react-native';

import { Stack, Text } from '@/components/ui';
import { copy } from '@/constants/copy';
import { formatDigits, parseWon } from '@/lib/format';
import { makeStyles, useTheme } from '@/theme';

type Props = {
  label: string;
  hint?: string;
  value: number | null;
  onChangeValue: (value: number | null) => void;
  error?: string;
  /** 마지막 행은 아래 구분선을 그리지 않는다 */
  last?: boolean;
};

const useStyles = makeStyles((t) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space[3],
    paddingVertical: t.space[3],
    borderBottomWidth: 1,
    borderBottomColor: t.color.border.default,
  },
  last: { borderBottomWidth: 0 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: t.space[1] },
  input: {
    ...t.typography.bodyStrong,
    fontFamily: t.font.family.bold,
    color: t.color.text.primary,
    textAlign: 'right',
    minWidth: 96,
    paddingVertical: t.space[1],
  },
}));

/** 시안 "이번 달 돈 계획"의 한 줄: 왼쪽 항목 · 오른쪽 금액 입력 */
export function MoneyRow({ label, hint, value, onChangeValue, error, last }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={[styles.row, last && styles.last]}>
      <Stack flex={1} gap={1}>
        <Text variant="bodyStrong">{label}</Text>
        {hint && (
          <Text variant="caption" tone="tertiary">
            {hint}
          </Text>
        )}
        {error && (
          <Text variant="caption" tone="danger">
            {error}
          </Text>
        )}
      </Stack>
      <View style={styles.inputWrap}>
        <TextInput
          value={formatDigits(value)}
          onChangeText={(text) => onChangeValue(parseWon(text))}
          keyboardType="number-pad"
          inputMode="numeric"
          placeholder="0"
          placeholderTextColor={theme.color.text.disabled}
          accessibilityLabel={label}
          style={styles.input}
        />
        <Text variant="body" tone="secondary">
          {copy.common.won}
        </Text>
      </View>
    </View>
  );
}
