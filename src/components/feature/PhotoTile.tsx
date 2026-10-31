import { ActivityIndicator, Image, Pressable, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { makeStyles, useTheme } from '@/theme';

const SIZE = 64;

const useStyles = makeStyles((t) => ({
  tile: {
    width: SIZE,
    height: SIZE,
    borderRadius: t.radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: t.color.border.strong,
    backgroundColor: t.color.bg.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    gap: t.space[1],
    overflow: 'hidden',
  },
  image: { width: SIZE, height: SIZE },
}));

type Props = {
  uri?: string;
  loading?: boolean;
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
};

/** 사진 추가 칸 (목표 정하기): 점선 정사각형, 고르면 사진으로 바뀐다. 다시 누르면 바꾸기 */
export function PhotoTile({ uri, loading, label, accessibilityLabel, onPress }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
      <View style={styles.tile}>
        {loading ? (
          <ActivityIndicator color={theme.color.brand.solid} />
        ) : uri ? (
          <Image source={{ uri }} style={styles.image} />
        ) : (
          <>
            <Icon name="camera" size="sm" tone="secondary" />
            <Text variant="caption" tone="secondary">
              {label}
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
}
