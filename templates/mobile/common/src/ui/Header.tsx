import { router, useNavigation, useSegments } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { IconButton } from './Button';
import { Container } from './Layout';
import { Text } from './Text';

/**
 * Custom header used on every screen (the navigator's own header is turned off), so it looks
 * the same on Android, iOS and the web, with your font and colors.
 * Shows a back arrow when there's a screen to go back to (never on a tab's own screen).
 */
export function Header({ title, subtitle, right, back, large }: { title: string; subtitle?: string; right?: ReactNode; back?: boolean; large?: boolean }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const segments = useSegments() as string[];
  const isTabRoot = segments[0] === '(tabs)' && segments.length <= 2; // a tab's own screen
  const showBack = back ?? (!isTabRoot && nav.canGoBack());
  return (
    <View style={{ backgroundColor: t.colors.background, paddingTop: insets.top, borderBottomColor: t.colors.border, borderBottomWidth: large ? 0 : 1 }}>
      <Container style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: t.spacing.sm, paddingVertical: t.spacing.sm, minHeight: 52 }}>
        {showBack ? <IconButton icon="arrow-back" label="Back" onPress={() => router.back()} /> : <View style={{ width: t.spacing.sm }} />}
        <View style={{ flex: 1 }}>
          <Text size={large ? 'xxl' : 'lg'} weight={large ? 'black' : 'bold'} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text size="sm" muted numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        {right ? <View style={{ flexDirection: 'row', alignItems: 'center' }}>{right}</View> : null}
      </Container>
    </View>
  );
}
