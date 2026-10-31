import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { StyleSheet, useColorScheme, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

import {
  elevation,
  font,
  layout,
  motion,
  radius,
  space,
  themes,
  typography,
  type ColorTokens,
  type ThemeScheme,
} from './tokens';

export type Theme = {
  scheme: ThemeScheme;
  color: ColorTokens;
  space: typeof space;
  radius: typeof radius;
  typography: typeof typography;
  font: typeof font;
  elevation: typeof elevation;
  layout: typeof layout;
  motion: typeof motion;
};

function buildTheme(scheme: ThemeScheme): Theme {
  return {
    scheme,
    color: themes[scheme].color,
    space,
    radius,
    typography,
    font,
    elevation,
    layout,
    motion,
  };
}

const ThemeContext = createContext<Theme>(buildTheme('light'));

type Props = {
  children: ReactNode;
  /** 지정하지 않으면 시스템 설정을 따른다 (설정 화면에서 강제 지정할 때 사용) */
  scheme?: ThemeScheme;
};

export function ThemeProvider({ children, scheme }: Props) {
  const system = useColorScheme();
  const resolved: ThemeScheme = scheme ?? (system === 'dark' ? 'dark' : 'light');
  const theme = useMemo(() => buildTheme(resolved), [resolved]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/**
 * 테마를 받아 스타일을 만드는 훅을 생성한다.
 *
 * const useStyles = makeStyles((t) => ({ root: { padding: t.space[4] } }));
 * const styles = useStyles();
 */
type NamedStyles = Record<string, ViewStyle | TextStyle | ImageStyle>;

export function makeStyles<T extends NamedStyles>(factory: (theme: Theme) => T & NamedStyles) {
  return function useStyles(): T {
    const theme = useTheme();
    return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
  };
}
