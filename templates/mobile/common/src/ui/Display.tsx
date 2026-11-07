import { Ionicons } from '@expo/vector-icons';
import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, Image, Pressable, View, type DimensionValue } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { initials } from '__SCOPE__/shared';
import { useTheme } from '@/theme';
import { Button } from './Button';
import { Text } from './Text';

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const t = useTheme();
  const color = { neutral: t.colors.textMuted, brand: t.colors.brand, success: t.colors.success, warning: t.colors.warning, danger: t.colors.danger }[tone];
  return (
    <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: t.radius.full, backgroundColor: color + '22', borderColor: color + '55', borderWidth: 1 }}>
      <Text size="xs" weight="bold" color={tone === 'neutral' ? t.colors.text : color}>{label}</Text>
    </View>
  );
}

export function Avatar({ name, uri, size = 40 }: { name: string; uri?: string; size?: number }) {
  const t = useTheme();
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} accessibilityLabel={name} />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.colors.brand, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={name}>
      <Text weight="bold" color={t.colors.onBrand} style={{ fontSize: size * 0.38, lineHeight: size * 0.5 }}>{initials(name)}</Text>
    </View>
  );
}

/** A tappable row: icon, title, subtitle, and something on the right (chevron by default). */
export function ListItem({ title, subtitle, icon, right, onPress, danger }: { title: string; subtitle?: string; icon?: keyof typeof Ionicons.glyphMap; right?: ReactNode; onPress?: () => void; danger?: boolean }) {
  const t = useTheme();
  const color = danger ? t.colors.danger : t.colors.text;
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined}
      style={(s) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderRadius: t.radius.md, opacity: s.pressed ? 0.7 : 1 })}>
      {icon ? (
        <View style={{ width: 34, height: 34, borderRadius: t.radius.sm, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text weight="medium" color={color}>{title}</Text>
        {subtitle ? <Text size="sm" muted>{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={t.colors.textMuted} /> : null)}
    </Pressable>
  );
}

export function Loader({ label }: { label?: string }) {
  const t = useTheme();
  return (
    <View style={{ padding: t.spacing.xl, alignItems: 'center', gap: t.spacing.sm }}>
      <ActivityIndicator color={t.colors.brand} />
      {label ? <Text muted size="sm">{label}</Text> : null}
    </View>
  );
}

/** Grey placeholder that gently pulses while content loads. */
export function Skeleton({ width = '100%', height = 16, radius }: { width?: DimensionValue; height?: number; radius?: number }) {
  const t = useTheme();
  const o = useSharedValue(0.5);
  useEffect(() => { o.value = withRepeat(withTiming(1, { duration: 700 }), -1, true); }, [o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ width, height, borderRadius: radius ?? t.radius.sm, backgroundColor: t.colors.surfaceAlt }, style]} />;
}

export function EmptyState({ icon = 'sparkles-outline', title, message, action }: { icon?: keyof typeof Ionicons.glyphMap; title: string; message?: string; action?: { label: string; onPress: () => void } }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center', padding: t.spacing.xl, gap: t.spacing.sm }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={26} color={t.colors.brand} />
      </View>
      <Text weight="bold" size="lg" center>{title}</Text>
      {message ? <Text muted center>{message}</Text> : null}
      {action ? <Button title={action.label} onPress={action.onPress} style={{ marginTop: 8 }} /> : null}
    </View>
  );
}
