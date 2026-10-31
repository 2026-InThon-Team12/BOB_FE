import { View, type ViewProps, type ViewStyle } from 'react-native';

import { useTheme, type SpaceKey } from '@/theme';

export type StackProps = ViewProps & {
  direction?: 'column' | 'row';
  gap?: SpaceKey;
  padding?: SpaceKey;
  paddingX?: SpaceKey;
  paddingY?: SpaceKey;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  wrap?: boolean;
  flex?: number;
};

/**
 * 화면 레이아웃용 기본 블록. 간격은 토큰 키로만 받는다.
 * 화면 코드에서 숫자 margin/padding을 쓰지 않도록 이 컴포넌트를 쓴다.
 */
export function Stack({
  direction = 'column',
  gap = 0,
  padding,
  paddingX,
  paddingY,
  align,
  justify,
  wrap,
  flex,
  style,
  ...rest
}: StackProps) {
  const { space } = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          flexDirection: direction,
          gap: space[gap],
          alignItems: align,
          justifyContent: justify,
          flexWrap: wrap ? 'wrap' : undefined,
          flex,
        },
        padding !== undefined && { padding: space[padding] },
        paddingX !== undefined && { paddingHorizontal: space[paddingX] },
        paddingY !== undefined && { paddingVertical: space[paddingY] },
        style,
      ]}
    />
  );
}

export function Row(props: Omit<StackProps, 'direction'>) {
  return <Stack align="center" {...props} direction="row" />;
}
