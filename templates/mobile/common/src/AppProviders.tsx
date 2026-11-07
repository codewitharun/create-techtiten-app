import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Providers } from '@/state/Providers';
import { ThemeProvider } from '@/theme';
import { useAppFonts } from '@/theme/fonts';

/** Everything the app needs around it: safe area, state + query client, theme, fonts. */
export function AppProviders({ children }: { children: ReactNode }) {
  const fontsLoaded = useAppFonts();
  if (!fontsLoaded) return null; // the splash screen stays up until fonts are ready
  return (
    <SafeAreaProvider>
      <Providers>
        <ThemeProvider>{children}</ThemeProvider>
      </Providers>
    </SafeAreaProvider>
  );
}
