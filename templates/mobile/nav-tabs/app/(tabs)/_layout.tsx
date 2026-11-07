import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTheme } from '@/theme';
import { fonts } from '@/theme/fonts';
import { useBreakpoint } from '@/ui';

export default function TabsLayout() {
  const t = useTheme();
  const { bp } = useBreakpoint();
  const desktop = bp === 'desktop';
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // screens draw their own <Header>
        // Desktop web: tabs become a sidebar on the left.
        tabBarPosition: desktop ? 'left' : 'bottom',
        tabBarVariant: desktop ? 'material' : 'uikit',
        tabBarLabelPosition: desktop ? 'beside-icon' : undefined,
        tabBarStyle: { backgroundColor: t.colors.surface, borderTopColor: t.colors.border, borderRightColor: t.colors.border },
        tabBarActiveTintColor: t.colors.brand,
        tabBarInactiveTintColor: t.colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.medium },
        sceneStyle: { backgroundColor: t.colors.background },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color as string} size={size} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color, size }) => <Ionicons name="settings" color={color as string} size={size} /> }} />
    </Tabs>
  );
}
