import { Image, View } from 'react-native';

import { makeStyles, useTheme } from '@/theme';

import { Text } from './Text';

type Props = {
  uri?: string;
  size?: 'sm' | 'md';
  /** 사진이 없을 때 자리 표시 문구 (시안: "이미지") */
  placeholder?: string;
  accessibilityLabel?: string;
};

const useStyles = makeStyles((t) => ({
  base: {
    borderRadius: t.radius.md,
    backgroundColor: t.color.bg.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
}));

/** 물품·목표 사진. 없으면 회색 자리 표시 */
export function Thumbnail({ uri, size = 'md', placeholder, accessibilityLabel }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const px = theme.layout.thumbnail[size];
  return (
    <View style={[styles.base, { width: px, height: px }]} accessibilityLabel={accessibilityLabel}>
      {uri ? (
        <Image source={{ uri }} style={{ width: px, height: px }} resizeMode="cover" />
      ) : (
        placeholder && (
          <Text variant="caption" tone="tertiary">
            {placeholder}
          </Text>
        )
      )}
    </View>
  );
}
