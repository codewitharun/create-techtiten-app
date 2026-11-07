// One theme for the phone app and the website. Change a color here and both update.
export type Mode = 'light' | 'dark';

// colors.ts is written by create-techtiten-app from the theme preset you picked (__THEME_LABEL__).
// Edit it freely: both the phone app and the website read it.
import { colors } from './colors';
export { colors };

export type ColorName = keyof (typeof colors)['light'];
export type Colors = Record<ColorName, string>;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 } as const;
export const fontSize = { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, xxl: 28, display: 36 } as const;
export const fontWeight = { regular: '400', medium: '500', bold: '700', black: '800' } as const;

export const theme = (mode: Mode) => ({ mode, colors: colors[mode] as Colors, spacing, radius, fontSize, fontWeight });
export type Theme = ReturnType<typeof theme>;

/** CSS custom properties for the web app: `--color-brand`, `--color-text`… */
export function cssVariables(mode: Mode): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(colors[mode])) out[`--color-${k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}`] = v;
  for (const [k, v] of Object.entries(radius)) out[`--radius-${k}`] = `${v}px`;
  return out;
}
