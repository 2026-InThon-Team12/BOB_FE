import { useState, type ReactNode } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { makeStyles, useTheme } from '@/theme';

import { Text } from './Text';

type Props = Omit<TextInputProps, 'style'> & {
  label?: string;
  helper?: string;
  error?: string;
  /** 입력칸 왼쪽에 붙는 아이콘 등 */
  prefix?: ReactNode;
  /** 입력칸 오른쪽에 붙는 단위 (예: "원") */
  suffix?: string;
};

const useStyles = makeStyles((t) => ({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: t.space[4],
    borderRadius: t.radius.md,
    borderWidth: 1,
    backgroundColor: t.color.bg.surface,
    gap: t.space[2],
  },
  input: {
    flex: 1,
    ...t.typography.body,
    fontFamily: t.font.family.regular,
    color: t.color.text.primary,
    paddingVertical: t.space[3],
  },
  wrap: { gap: t.space[1] },
}));

export function Input({ label, helper, error, prefix, suffix, onFocus, onBlur, editable = true, ...rest }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? theme.color.danger.solid
    : focused
      ? theme.color.border.focus
      : theme.color.border.default;

  return (
    <View style={styles.wrap}>
      {label && (
        <Text variant="label" tone="secondary">
          {label}
        </Text>
      )}
      <View style={[styles.field, { borderColor }, !editable && { opacity: theme.motion.disabledOpacity }]}>
        {prefix}
        <TextInput
          {...rest}
          editable={editable}
          accessibilityLabel={label ?? rest.placeholder}
          placeholderTextColor={theme.color.text.tertiary}
          style={styles.input}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
        {suffix && (
          <Text variant="body" tone="secondary">
            {suffix}
          </Text>
        )}
      </View>
      {(error || helper) && (
        <Text variant="caption" tone={error ? 'danger' : 'tertiary'}>
          {error ?? helper}
        </Text>
      )}
    </View>
  );
}
