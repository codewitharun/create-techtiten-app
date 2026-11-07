import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState, type ComponentRef } from 'react';
import { Pressable, Switch as RNSwitch, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme';
import { fontScale, fonts } from '@/theme/fonts';
import { Text } from './Text';

export type InputProps = TextInputProps & { label?: string; error?: string; hint?: string; icon?: keyof typeof Ionicons.glyphMap };

/** Text field with label, error, hint and an optional icon. secureTextEntry gets a show/hide eye. */
export const Input = forwardRef<ComponentRef<typeof TextInput>, InputProps>(function Input({ label, error, hint, icon, secureTextEntry, style, onFocus, onBlur, ...rest }, ref) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secureTextEntry);
  const border = error ? t.colors.danger : focused ? t.colors.brand : t.colors.border;
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text size="sm" weight="medium">{label}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.colors.surface, borderColor: border, borderWidth: 1, borderRadius: t.radius.md, paddingHorizontal: 12 }}>
        {icon ? <Ionicons name={icon} size={18} color={t.colors.textMuted} /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={t.colors.textMuted}
          secureTextEntry={hidden}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          style={[{ flex: 1, color: t.colors.text, fontSize: Math.round(t.fontSize.md * fontScale), paddingVertical: 12, fontFamily: fonts.regular }, { outlineStyle: 'none' } as object, style]}
          {...rest}
        />
        {secureTextEntry ? (
          <Pressable onPress={() => setHidden((h) => !h)} accessibilityLabel={hidden ? 'Show password' : 'Hide password'} hitSlop={8}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={18} color={t.colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text size="sm" color={t.colors.danger}>{error}</Text> : hint ? <Text size="sm" muted>{hint}</Text> : null}
    </View>
  );
});

export function Switch({ value, onValueChange, label, description }: { value: boolean; onValueChange: (v: boolean) => void; label: string; description?: string }) {
  const t = useTheme();
  return (
    <Pressable onPress={() => onValueChange(!value)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }} accessibilityRole="switch" accessibilityState={{ checked: value }}>
      <View style={{ flex: 1 }}>
        <Text weight="medium">{label}</Text>
        {description ? <Text size="sm" muted>{description}</Text> : null}
      </View>
      <RNSwitch value={value} onValueChange={onValueChange} trackColor={{ true: t.colors.brand, false: t.colors.border }} thumbColor="#FFFFFF" />
    </Pressable>
  );
}
