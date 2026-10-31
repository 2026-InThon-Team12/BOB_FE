import { ActivityIndicator, Pressable, View } from 'react-native';

import { makeStyles, useTheme, type Theme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Text, type TextTone } from './Text';

/**
 * 시안 기준:
 * - primary: 파란 큰 버튼 ("다음 품목", "Buy")
 * - bye: 주황 버튼 ("Bye 안 살래요")
 * - secondary: 흰 바탕 + 테두리 ("원래 필요했어요")
 * - onBrand: 파란 카드 위 흰 버튼 ("1분 만에 답하기")
 * - ghost: 글자만 ("그래도 살래요", "다음 목표 정하기")
 */
export type ButtonVariant = 'primary' | 'bye' | 'secondary' | 'onBrand' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

type Props = {
  label: string;
  /** 두 줄 버튼의 작은 둘째 줄 (예: Buy / 살게요) */
  sublabel?: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  accessibilityHint?: string;
};

const variantColors = (t: Theme, variant: ButtonVariant, pressed: boolean) => {
  switch (variant) {
    case 'primary':
      return { bg: pressed ? t.color.brand.pressed : t.color.brand.solid, border: 'transparent' };
    case 'bye':
    case 'danger':
      return { bg: pressed ? t.color.warning.pressed : t.color.warning.solid, border: 'transparent' };
    case 'secondary':
      return { bg: pressed ? t.color.bg.subtle : t.color.bg.surface, border: t.color.border.default };
    case 'onBrand':
      return { bg: pressed ? t.color.brand.subtle : t.color.bg.surface, border: 'transparent' };
    case 'ghost':
      return { bg: pressed ? t.color.bg.subtle : 'transparent', border: 'transparent' };
  }
};

const labelTone: Record<ButtonVariant, TextTone> = {
  primary: 'inverse',
  bye: 'inverse',
  danger: 'inverse',
  secondary: 'primary',
  onBrand: 'brand',
  ghost: 'secondary',
};

const useStyles = makeStyles((t) => ({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: t.radius.lg,
    borderWidth: 1,
  },
  md: { minHeight: 48, paddingHorizontal: t.space[4] },
  lg: { minHeight: 56, paddingHorizontal: t.space[5] },
  twoLine: { minHeight: 64, paddingVertical: t.space[2] },
  content: { flexDirection: 'row', alignItems: 'center', gap: t.space[2] },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: t.motion.disabledOpacity },
}));

export function Button({
  label,
  sublabel,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled,
  loading,
  fullWidth,
  accessibilityHint,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const tone = labelTone[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={sublabel ? `${label} ${sublabel}` : label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => {
        const c = variantColors(theme, variant, pressed);
        return [
          styles.base,
          styles[size],
          sublabel && styles.twoLine,
          { backgroundColor: c.bg, borderColor: c.border },
          fullWidth && styles.fullWidth,
          inactive && styles.disabled,
        ];
      }}
    >
      {loading ? (
        <ActivityIndicator color={theme.color.text[tone]} />
      ) : (
        <>
          <View style={styles.content}>
            {icon && <Icon name={icon} size="sm" tone={tone} />}
            <Text variant={size === 'lg' || sublabel ? 'heading' : 'bodyStrong'} tone={tone}>
              {label}
            </Text>
          </View>
          {sublabel && (
            <Text variant="caption" tone={tone}>
              {sublabel}
            </Text>
          )}
        </>
      )}
    </Pressable>
  );
}
