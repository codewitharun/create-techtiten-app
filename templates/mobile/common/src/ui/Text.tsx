import { Text as RNText, type TextProps } from 'react-native';
import { useTheme } from '@/theme';
import { fontScale, fonts } from '@/theme/fonts';

type Size = keyof ReturnType<typeof useTheme>['fontSize'];
type Weight = keyof ReturnType<typeof useTheme>['fontWeight'];
export type AppTextProps = TextProps & { muted?: boolean; size?: Size; weight?: Weight; color?: string; center?: boolean };

/** Themed text. Custom fonts carry their weight in the family name; the system font uses fontWeight. */
export function Text({ style, muted, size = 'md', weight = 'regular', color, center, ...rest }: AppTextProps) {
  const t = useTheme();
  const fontSize = Math.round(t.fontSize[size] * fontScale);
  const family = fonts[weight];
  return (
    <RNText
      style={[
        { color: color ?? (muted ? t.colors.textMuted : t.colors.text), fontSize, lineHeight: Math.round(fontSize * (fontScale < 1 ? 1.6 : 1.35)) },
        family ? { fontFamily: family } : { fontWeight: t.fontWeight[weight] },
        center && { textAlign: 'center' },
        style,
      ]}
      {...rest}
    />
  );
}
