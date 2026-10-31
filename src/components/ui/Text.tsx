import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme, type Theme, type TypographyVariant } from '@/theme';

export type TextTone = keyof Theme['color']['text'];

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  tone?: TextTone;
  align?: 'left' | 'center' | 'right';
  /** 숫자처럼 굵기만 바꿔야 할 때 (기본은 variant의 굵기) */
  weight?: '400' | '500' | '600' | '700';
};

const familyByWeight = (theme: Theme, weight: string) => {
  const f = theme.font.family;
  if (weight === '700') return f.bold;
  if (weight === '600') return f.semibold;
  if (weight === '500') return f.medium;
  return f.regular;
};

export function Text({ variant = 'body', tone = 'primary', align, weight, style, ...rest }: TextProps) {
  const theme = useTheme();
  const { fontWeight: variantWeight, ...typo } = theme.typography[variant];
  const resolvedWeight = weight ?? variantWeight;
  const family = familyByWeight(theme, resolvedWeight);
  return (
    <RNText
      {...rest}
      style={[
        typo,
        // 커스텀 글꼴은 굵기마다 family가 따로 있어 fontWeight를 함께 주면 이중으로 굵어진다
        family ? { fontFamily: family } : { fontWeight: resolvedWeight },
        { color: theme.color.text[tone] },
        align && { textAlign: align },
        style,
      ]}
    />
  );
}
