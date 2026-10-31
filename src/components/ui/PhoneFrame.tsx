import type { ReactNode } from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';

import { makeStyles, useTheme } from '@/theme';

const useStyles = makeStyles((t) => ({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.color.frame.backdrop,
  },
  device: {
    width: t.layout.frameWidth,
    height: '100%',
    maxHeight: t.layout.frameMaxHeight,
    overflow: 'hidden',
    borderRadius: t.radius.xl,
    backgroundColor: t.color.bg.canvas,
    ...t.elevation.frame,
  },
  fill: { flex: 1 },
}));

/**
 * 웹 데모용 틀. 넓은 화면에서는 가운데에 폰 크기로만 보여주고,
 * 네이티브나 좁은 화면(모바일 브라우저)에서는 아무것도 하지 않는다.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  const styles = useStyles();
  const { layout } = useTheme();
  const { width } = useWindowDimensions();
  const framed = Platform.OS === 'web' && width >= layout.frameBreakpoint;

  if (!framed) return <View style={styles.fill}>{children}</View>;

  return (
    <View style={styles.backdrop}>
      <View style={styles.device}>{children}</View>
    </View>
  );
}
