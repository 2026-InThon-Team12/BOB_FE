import type { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { makeStyles } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  closeLabel: string;
};

const useStyles = makeStyles((t) => ({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: t.color.overlay },
  sheet: {
    padding: t.space[5],
    paddingBottom: t.space[8],
    borderTopLeftRadius: t.radius.xxl,
    borderTopRightRadius: t.radius.xxl,
    backgroundColor: t.color.bg.surface,
    gap: t.space[4],
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: t.radius.pill, backgroundColor: t.color.border.default },
}));

/** 아래에서 올라오는 시트 (진열장 상세). 바깥을 누르면 닫힌다 */
export function BottomSheet({ visible, onClose, children, closeLabel }: Props) {
  const styles = useStyles();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel={closeLabel}>
        {/* 시트 안쪽을 눌러도 닫히지 않게 */}
        <Pressable style={styles.sheet} onPress={() => {}} accessible={false}>
          <View style={styles.handle} />
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
