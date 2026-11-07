import { Pressable, Text as RNText, View, type PressableProps, type TextProps, type ViewProps } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import { fontScale, fonts } from '@/theme/fonts';

export function Screen({ style, ...rest }: ViewProps) {
  const t = useTheme();
  return <View style={[{ flex: 1, backgroundColor: t.colors.background, padding: t.spacing.lg, gap: t.spacing.lg }, style]} {...rest} />;
}

export function Card({ style, ...rest }: ViewProps) {
  const t = useTheme();
  return <View style={[{ backgroundColor: t.colors.surface, borderColor: t.colors.border, borderWidth: 1, borderRadius: t.radius.lg, padding: t.spacing.lg, gap: t.spacing.sm }, style]} {...rest} />;
}

export function Text({ style, muted, size = 'md', weight = 'regular', ...rest }: TextProps & { muted?: boolean; size?: keyof ReturnType<typeof useTheme>['fontSize']; weight?: keyof ReturnType<typeof useTheme>['fontWeight'] }) {
  const t = useTheme();
  // Custom fonts carry their weight in the family name (fonts.bold…); the system font uses fontWeight.
  const family = fonts[weight];
  const fontSize = Math.round(t.fontSize[size] * fontScale);
  return <RNText style={[{ color: muted ? t.colors.textMuted : t.colors.text, fontSize, lineHeight: Math.round(fontSize * (fontScale < 1 ? 1.6 : 1.35)) }, family ? { fontFamily: family } : { fontWeight: t.fontWeight[weight] }, style]} {...rest} />;
}

export function Button({ title, variant = 'primary', onPress, style, ...rest }: PressableProps & { title: string; variant?: 'primary' | 'ghost' }) {
  const t = useTheme();
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={(e) => { Haptics.selectionAsync().catch(() => {}); onPress?.(e); }}
      style={(state) => [{
        backgroundColor: primary ? t.colors.brand : 'transparent',
        borderColor: primary ? t.colors.brand : t.colors.border,
        borderWidth: 1, borderRadius: t.radius.md, paddingVertical: t.spacing.md, paddingHorizontal: t.spacing.lg,
        alignItems: 'center', opacity: state.pressed ? 0.8 : 1,
      }, typeof style === 'function' ? style(state) : style]}
      {...rest}>
      <RNText style={[{ color: primary ? t.colors.onBrand : t.colors.text, fontSize: Math.round(t.fontSize.md * fontScale) }, fonts.bold ? { fontFamily: fonts.bold } : { fontWeight: t.fontWeight.bold }]}>{title}</RNText>
    </Pressable>
  );
}
