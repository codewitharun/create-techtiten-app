import type { ReactNode } from 'react';
import { ScrollView, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useBreakpoint } from './responsive';

/** Centers content with a max width on tablets/desktop, full width on phones. */
export function Container({ style, maxWidth = 720, ...rest }: ViewProps & { maxWidth?: number }) {
  return <View style={[{ width: '100%', maxWidth, alignSelf: 'center' }, style]} {...rest} />;
}

/** A page: themed background, padding, optional scrolling, responsive width. Put a <Header> above it. */
export function Screen({ children, scroll = true, padded = true, footer }: { children: ReactNode; scroll?: boolean; padded?: boolean; footer?: ReactNode }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { isWide } = useBreakpoint();
  const inner = (
    <Container style={{ gap: t.spacing.lg, padding: padded ? (isWide ? t.spacing.xl : t.spacing.lg) : 0, paddingBottom: t.spacing.xl + (footer ? 0 : insets.bottom) }}>{children}</Container>
  );
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      {scroll ? <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">{inner}</ScrollView> : <View style={{ flex: 1 }}>{inner}</View>}
      {footer ? <Container style={{ padding: t.spacing.lg, paddingBottom: t.spacing.lg + insets.bottom }}>{footer}</Container> : null}
    </View>
  );
}

export function Card({ style, ...rest }: ViewProps) {
  const t = useTheme();
  return <View style={[{ backgroundColor: t.colors.surface, borderColor: t.colors.border, borderWidth: 1, borderRadius: t.radius.lg, padding: t.spacing.lg, gap: t.spacing.sm }, style]} {...rest} />;
}

export function Row({ style, gap = 8, ...rest }: ViewProps & { gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap, flexWrap: 'wrap' }, style]} {...rest} />;
}

export function Divider() {
  const t = useTheme();
  return <View style={{ height: 1, backgroundColor: t.colors.border, marginVertical: t.spacing.xs }} />;
}
