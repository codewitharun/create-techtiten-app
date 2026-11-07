import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Platform, Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { Text } from './Text';

export type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

const PAD = { sm: [8, 12], md: [12, 16], lg: [16, 20] } as const;

export function Button({ title, variant = 'primary', size = 'md', icon, loading, fullWidth, disabled, onPress, style, ...rest }: ButtonProps) {
  const t = useTheme();
  const c = t.colors;
  const look = {
    primary: { bg: c.brand, fg: c.onBrand, border: c.brand },
    secondary: { bg: c.surfaceAlt, fg: c.text, border: c.surfaceAlt },
    ghost: { bg: 'transparent', fg: c.text, border: c.border },
    danger: { bg: c.danger, fg: '#FFFFFF', border: c.danger },
  }[variant];
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      disabled={off}
      onPress={(e) => { if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {}); onPress?.(e); }}
      style={(s) => [
        {
          backgroundColor: look.bg, borderColor: look.border, borderWidth: 1, borderRadius: t.radius.md,
          paddingVertical: PAD[size][0], paddingHorizontal: PAD[size][1],
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: off ? 0.55 : s.pressed ? 0.8 : (s as { hovered?: boolean }).hovered ? 0.9 : 1,
          alignSelf: fullWidth ? 'stretch' : undefined,
        },
        Platform.OS === 'web' && ({ cursor: off ? 'default' : 'pointer' } as ViewStyle),
        style,
      ]}
      {...rest}>
      {loading ? <ActivityIndicator color={look.fg} size="small" /> : icon ? <Ionicons name={icon} size={size === 'sm' ? 16 : 18} color={look.fg} /> : null}
      <View><Text weight="bold" size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md'} color={look.fg}>{title}</Text></View>
    </Pressable>
  );
}

/** Round icon-only button (headers, toolbars). */
export function IconButton({ icon, onPress, label, color, size = 22 }: { icon: keyof typeof Ionicons.glyphMap; onPress?: () => void; label: string; color?: string; size?: number }) {
  const t = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={8}
      style={(s) => ({ padding: 8, borderRadius: t.radius.full, backgroundColor: s.pressed || (s as { hovered?: boolean }).hovered ? t.colors.surfaceAlt : 'transparent' })}>
      <Ionicons name={icon} size={size} color={color ?? t.colors.text} />
    </Pressable>
  );
}
