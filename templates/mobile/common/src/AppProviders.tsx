import type { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Providers } from '@/state/Providers';
import { ThemeProvider } from '@/theme';
import { useAppFonts } from '@/theme/fonts';

/** Everything the app needs around it: gestures, safe area, state + query client, theme, fonts.
 *  Reanimated/Worklets need no setup: babel-preset-expo adds their Babel plugin automatically. */
export function AppProviders({ children }: { children: ReactNode }) {
  const fontsLoaded = useAppFonts();
  if (!fontsLoaded) return null; // the splash screen stays up until fonts are ready
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Providers>
          <ThemeProvider>{children}</ThemeProvider>
        </Providers>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
