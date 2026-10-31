import { Image, View } from 'react-native';

import { makeStyles } from '@/theme';

import { Text } from './Text';

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: t.space[2] },
  mascot: { width: 38, height: 32 },
  wordmark: { width: 56, height: 26, tintColor: t.color.text.primary },
}));

/** Original artwork from BOB_APP, shared by the Main header and welcome screen. */
export function Brand({ label, tagline }: { label: string; tagline?: string }) {
  const styles = useStyles();
  return (
    <View style={styles.row} accessible accessibilityLabel={label}>
      <Image source={require('../../../assets/brand/mascot.png')} style={styles.mascot} resizeMode="contain" />
      <Image source={require('../../../assets/brand/wordmark.png')} style={styles.wordmark} resizeMode="contain" />
      {tagline && <Text variant="label" tone="tertiary">{tagline}</Text>}
    </View>
  );
}
