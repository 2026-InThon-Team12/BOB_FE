import { Pressable, View } from 'react-native';

import { makeStyles, useTheme } from '@/theme';

type Props = {
  value: boolean;
  onChange: (value: boolean) => void;
  accessibilityLabel: string;
};

const useStyles = makeStyles((t) => ({
  hit: { width: 52, height: 44, alignItems: 'center', justifyContent: 'center' },
  track: { width: 46, height: 28, borderRadius: t.radius.pill, justifyContent: 'center' },
  knob: { width: 22, height: 22, borderRadius: t.radius.pill, backgroundColor: t.color.bg.surface, ...t.elevation.raised },
}));

/** 명세서 Switch: 46×28 트랙(on buy / off 회색), 22px 노브, 터치 영역 52×44 */
export function Switch({ value, onChange, accessibilityLabel }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      style={styles.hit}
    >
      <View
        style={[
          styles.track,
          { backgroundColor: value ? theme.color.brand.solid : theme.color.switchOff, paddingLeft: value ? 21 : 3 },
        ]}
      >
        <View style={styles.knob} />
      </View>
    </Pressable>
  );
}
