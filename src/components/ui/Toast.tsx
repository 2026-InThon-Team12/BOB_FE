import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { makeStyles, useTheme } from '@/theme';

import { Text } from './Text';

type ToastAction = { label: string; onPress: () => void };
type ToastState = { message: string; action?: ToastAction } | null;
type ShowToast = (message: string, action?: ToastAction) => void;

const ToastContext = createContext<ShowToast>(() => {});

const DURATION_MS = 2800;

const useStyles = makeStyles((t) => ({
  wrap: {
    position: 'absolute',
    left: t.space[5],
    right: t.space[5],
    bottom: t.space[12] * 2,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space[3],
    paddingHorizontal: t.space[4],
    paddingVertical: t.space[3],
    borderRadius: t.radius.md + 2,
    backgroundColor: t.color.bg.inverse,
    ...t.elevation.raised,
  },
}));

/** 명세서 Toast: ink 바탕 흰 글씨, radius 14, 선택적 우측 링크. 화면 어디서나 useToast()로 띄운다 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const styles = useStyles();
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback<ShowToast>((message, action) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, action });
    timer.current = setTimeout(() => setToast(null), DURATION_MS);
  }, []);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <View style={styles.wrap} pointerEvents="box-none" accessibilityLiveRegion="polite">
          <View style={styles.toast}>
            <Text variant="label" tone="inverse">
              {toast.message}
            </Text>
            {toast.action && (
              <Pressable
                onPress={() => {
                  setToast(null);
                  toast.action?.onPress();
                }}
                accessibilityRole="button"
                hitSlop={theme.layout.hitSlop}
              >
                <Text variant="label" weight="700" tone="highlightOnInverse">
                  {toast.action.label}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
