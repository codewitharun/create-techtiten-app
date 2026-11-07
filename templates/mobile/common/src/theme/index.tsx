import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { theme as makeTheme, type Theme } from '__SCOPE__/theme';
import { useAppearance } from '@/state';

const ThemeContext = createContext<Theme>(makeTheme('dark'));

/** Light/dark from the user's choice in Settings, or the phone's setting when it's "system". */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const { appearance } = useAppearance();
  const mode = appearance === 'system' ? (system === 'light' ? 'light' : 'dark') : appearance;
  const value = useMemo(() => makeTheme(mode), [mode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
