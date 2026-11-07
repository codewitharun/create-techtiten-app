import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '@/AppProviders';
import { useTheme } from '@/theme';

function Root() {
  const t = useTheme();
  return (
    <>
      <StatusBar style={t.mode === 'dark' ? 'light' : 'dark'} />
      {/* Tabs live in app/(tabs). Push full-screen pages (details, modals) on this stack. */}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.colors.background } }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <Root />
    </AppProviders>
  );
}
