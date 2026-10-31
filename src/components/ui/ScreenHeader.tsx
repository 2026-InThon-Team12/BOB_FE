import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { makeStyles, useTheme } from '@/theme';

import { Icon } from './Icon';
import { Text } from './Text';

type Props = {
  /** 가운데 제목 (없으면 뒤로가기만) */
  title?: string;
  /** 지정하면 왼쪽에 뒤로가기(또는 닫기) 버튼이 생긴다 */
  onBack?: () => void;
  backIcon?: 'back' | 'close';
  backLabel?: string;
  /** 오른쪽 영역 (예: "1 / 3", "목표 바꾸기") */
  right?: ReactNode;
};

const useStyles = makeStyles((t) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: t.space[3],
  },
  side: { width: 88, flexDirection: 'row', alignItems: 'center' },
  right: { justifyContent: 'flex-end', paddingRight: t.space[2] },
  title: { flex: 1, alignItems: 'center' },
  back: { padding: t.space[2] },
}));

/** 시안의 화면 상단: ‹ 가운데 제목 · 오른쪽 보조 */
export function ScreenHeader({ title, onBack, backIcon = 'back', backLabel, right }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.root}>
      <View style={styles.side}>
        {onBack && (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={backLabel}
            hitSlop={theme.layout.hitSlop}
            style={({ pressed }) => [styles.back, pressed && { opacity: theme.motion.pressedOpacity }]}
          >
            <Icon name={backIcon} size="lg" />
          </Pressable>
        )}
      </View>
      <View style={styles.title}>
        {title && (
          <Text variant="heading" accessibilityRole="header" numberOfLines={1}>
            {title}
          </Text>
        )}
      </View>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}
