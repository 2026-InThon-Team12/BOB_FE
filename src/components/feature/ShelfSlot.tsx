import { Image, Pressable, View } from 'react-native';

import { Icon, Stack, Text } from '@/components/ui';
import { copy } from '@/constants/copy';
import { formatWon } from '@/lib/format';
import { makeStyles, useTheme } from '@/theme';

const SIZE = 92;

const useStyles = makeStyles((t) => ({
  slot: { width: SIZE, alignItems: 'center', gap: t.space[1] },
  box: {
    width: SIZE,
    height: SIZE,
    borderRadius: t.radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashed: { borderWidth: 2, borderStyle: 'dashed', borderColor: t.color.bg.surface },
  strip: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingVertical: t.space[1], alignItems: 'center' },
  image: { width: SIZE, height: SIZE },
}));

type Props =
  | { kind: 'active'; name: string; price: number; percent: string; onPress?: () => void }
  | { kind: 'achieved'; name: string; price: number; imageUri?: string; stamp: string; selected: boolean; onPress: () => void }
  | { kind: 'next'; onPress: () => void };

/** 진열장 한 칸 (명세서 4.9): 채우는 중 · 달성 · 다음 목표 */
export function ShelfSlot(props: Props) {
  const theme = useTheme();
  const styles = useStyles();

  if (props.kind === 'next') {
    return (
      <Pressable onPress={props.onPress} accessibilityRole="button" accessibilityLabel={copy.shelf.next} style={styles.slot}>
        <View style={[styles.box, styles.dashed]}>
          <Icon name="add" size="xl" />
        </View>
        <Text variant="label" weight="700">
          {copy.shelf.next}
        </Text>
        <Text variant="caption" tone="secondary">
          {copy.shelf.nextSub}
        </Text>
      </Pressable>
    );
  }

  if (props.kind === 'active') {
    return (
      <View style={styles.slot}>
        <View style={[styles.box, styles.dashed]}>
          <Text variant="title" tone="brand">
            {props.percent}
          </Text>
          <View style={[styles.strip, { backgroundColor: theme.color.brand.solid }]}>
            <Text variant="caption" weight="700" tone="inverse">
              {copy.shelf.filling}
            </Text>
          </View>
        </View>
        <Text variant="label" weight="700" numberOfLines={1}>
          {props.name}
        </Text>
        <Text variant="caption" weight="700">
          {formatWon(props.price)}
        </Text>
      </View>
    );
  }

  return (
    <Pressable onPress={props.onPress} accessibilityRole="button" accessibilityLabel={props.name} style={styles.slot}>
      <View
        style={[
          styles.box,
          { backgroundColor: theme.color.bg.surface, borderWidth: 2, borderColor: props.selected ? theme.color.brand.solid : 'transparent' },
        ]}
      >
        {props.imageUri ? (
          <Image source={{ uri: props.imageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <Text variant="caption" tone="tertiary">
            {copy.common.imagePlaceholder}
          </Text>
        )}
        <View style={[styles.strip, { backgroundColor: theme.color.shelf.stamp, alignItems: 'flex-end', paddingRight: theme.space[2] }]}>
          <Text variant="caption" weight="700" tone="inverse">
            {props.stamp}
          </Text>
        </View>
      </View>
      <Stack align="center">
        <Text variant="label" weight="700" numberOfLines={1}>
          {props.name}
        </Text>
        <Text variant="caption" weight="700">
          {formatWon(props.price)}
        </Text>
      </Stack>
    </Pressable>
  );
}
