import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '@/AppProviders';
import { useTheme } from '@/theme';

function Root() {
  const t = useTheme();
  return (
    <>
      <StatusBar style={t.mode === 'dark' ? 'light' : 'dark'} />
      {/* Every screen draws its own <Header> (src/ui/Header.tsx), so headers look the same everywhere. */}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.colors.background } }} />
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
