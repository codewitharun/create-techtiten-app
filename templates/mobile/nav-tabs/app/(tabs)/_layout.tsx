import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTheme } from '@/theme';
import { fonts } from '@/theme/fonts';

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: t.colors.background },
        headerTintColor: t.colors.text,
        headerTitleStyle: { fontFamily: fonts.bold },
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: t.colors.surface, borderTopColor: t.colors.border },
        tabBarActiveTintColor: t.colors.brand,
        tabBarInactiveTintColor: t.colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.medium },
        sceneStyle: { backgroundColor: t.colors.background },
      }}>
      <Tabs.Screen name="index" options={{ title: '__APP_NAME__', tabBarLabel: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color as string} size={size} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color, size }) => <Ionicons name="settings" color={color as string} size={size} /> }} />
    </Tabs>
  );
}
