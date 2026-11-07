import type { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UpdateGate } from '@/features/update/UpdateGate';
import { useNotificationsSetup } from '@/features/notifications';
import { Providers } from '@/state/Providers';
import { ThemeProvider } from '@/theme';
import { useAppFonts } from '@/theme/fonts';
import { OverlayProvider } from '@/ui';

function Setup({ children }: { children: ReactNode }) {
  useNotificationsSetup();
  return <UpdateGate>{children}</UpdateGate>;
}

/**
 * Everything the app needs around it: gestures, safe area, state + data cache, theme, fonts,
 * alerts/toasts, force-update check, notifications.
 * Reanimated/Worklets need no setup: babel-preset-expo adds their Babel plugin automatically.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const fontsLoaded = useAppFonts();
  if (!fontsLoaded) return null; // the splash screen stays up until fonts are ready
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Providers>
          <ThemeProvider>
            <OverlayProvider>
              <Setup>{children}</Setup>
            </OverlayProvider>
          </ThemeProvider>
        </Providers>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
