import { Pressable } from 'react-native';

import { makeStyles, useTheme, type Theme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Text, type TextTone } from './Text';

/**
 * 선택 표시 방식 (시안에 세 가지가 있다)
 * - tint: 연한 파랑 + 체크 (구매 이유 복수 선택)
 * - solid: 파란 바탕 + 흰 글자 (카테고리 단일 선택)
 * - inverse: 검은 바탕 + 흰 글자 (참기 자주 쓰는 항목)
 */
export type ChipSelectedStyle = 'tint' | 'solid' | 'inverse';

type Props = {
  label: string;
  selected?: boolean;
  selectedStyle?: ChipSelectedStyle;
  onPress?: () => void;
  icon?: IconName;
  /** 오른쪽 아이콘 (예: 카테고리 칩의 ⌄) */
  trailingIcon?: IconName;
  /** 점선 테두리 ("직접 입력") */
  dashed?: boolean;
  disabled?: boolean;
};

const useStyles = makeStyles((t) => ({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space[1],
    // 명세서 ToggleChip: 높이 ≥ 44, radius 12
    minHeight: 44,
    paddingHorizontal: t.space[4],
    borderRadius: t.radius.md,
    borderWidth: 1,
  },
}));

const selectedColors = (t: Theme, style: ChipSelectedStyle): { bg: string; border: string; text: TextTone } => {
  switch (style) {
    case 'tint':
      return { bg: t.color.brand.subtle, border: t.color.brand.solid, text: 'brand' };
    case 'solid':
      return { bg: t.color.brand.solid, border: t.color.brand.solid, text: 'inverse' };
    case 'inverse':
      return { bg: t.color.bg.inverse, border: t.color.bg.inverse, text: 'inverse' };
  }
};

export function Chip({
  label,
  selected = false,
  selectedStyle = 'tint',
  onPress,
  icon,
  trailingIcon,
  dashed,
  disabled,
}: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const on = selectedColors(theme, selectedStyle);
  const colors = selected
    ? on
    : { bg: theme.color.bg.surface, border: theme.color.border.default, text: 'primary' as TextTone };
  const leading: IconName | undefined = icon ?? (selected && selectedStyle === 'tint' ? 'check' : undefined);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      accessibilityRole="togglebutton"
      accessibilityState={{ selected, checked: selected, disabled }}
      accessibilityLabel={label}
      hitSlop={theme.layout.hitSlop}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: colors.bg, borderColor: colors.border, borderStyle: dashed ? 'dashed' : 'solid' },
        pressed && { opacity: theme.motion.pressedOpacity },
        disabled && { opacity: theme.motion.disabledOpacity },
      ]}
    >
      {leading && <Icon name={leading} size="sm" tone={colors.text} />}
      <Text variant="label" tone={dashed && !selected ? 'tertiary' : colors.text}>
        {label}
      </Text>
      {trailingIcon && <Icon name={trailingIcon} size="sm" tone="tertiary" />}
    </Pressable>
  );
}
