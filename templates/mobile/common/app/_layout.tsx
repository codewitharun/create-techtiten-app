import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Providers } from '@/state/Providers';
import { ThemeProvider, useTheme } from '@/theme';

function ThemedStack() {
  const t = useTheme();
  return (
    <>
      <StatusBar style={t.mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.colors.background },
          headerTintColor: t.colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: t.colors.background },
        }}>
        <Stack.Screen name="index" options={{ title: '__APP_NAME__' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Providers>
        <ThemeProvider>
          <ThemedStack />
        </ThemeProvider>
      </Providers>
    </SafeAreaProvider>
  );
}
