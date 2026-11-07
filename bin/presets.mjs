// Theme presets and fonts. Add one here and it shows up in the prompts and in --help.

const neutrals = {
  cool: {
    light: { background: '#F7F8FA', surface: '#FFFFFF', surfaceAlt: '#EEF0F3', border: '#E2E5EA', text: '#0B0D12', textMuted: '#5B6270' },
    dark: { background: '#0B0B12', surface: '#15151F', surfaceAlt: '#1D1D2A', border: '#2A2A38', text: '#ECEDF2', textMuted: '#9A9CAB' },
  },
  navy: {
    light: { background: '#F5F8FC', surface: '#FFFFFF', surfaceAlt: '#EAF0F8', border: '#DCE4EF', text: '#0A1324', textMuted: '#55627A' },
    dark: { background: '#0A1020', surface: '#121A2E', surfaceAlt: '#1A2440', border: '#26314F', text: '#E8EEF8', textMuted: '#93A0BA' },
  },
  warm: {
    light: { background: '#FBF8F5', surface: '#FFFFFF', surfaceAlt: '#F4EEE8', border: '#EADFD5', text: '#1A120D', textMuted: '#6E6058' },
    dark: { background: '#140F0C', surface: '#1E1713', surfaceAlt: '#2A201A', border: '#3A2D25', text: '#F3ECE6', textMuted: '#AE9F95' },
  },
  plum: {
    light: { background: '#F8F7FC', surface: '#FFFFFF', surfaceAlt: '#EFECF9', border: '#E1DCF2', text: '#120E22', textMuted: '#5E5875' },
    dark: { background: '#0E0B1A', surface: '#171328', surfaceAlt: '#211B37', border: '#2E2649', text: '#EEEAFB', textMuted: '#A29BBF' },
  },
  lcd: {
    light: { background: '#C7D3A6', surface: '#BCC994', surfaceAlt: '#AFBD86', border: '#8F9D68', text: '#1E2A14', textMuted: '#4A5832' },
    dark: { background: '#10160C', surface: '#182012', surfaceAlt: '#212B19', border: '#33402A', text: '#B8E07A', textMuted: '#7E9A57' },
  },
};

const fixed = { danger: '#E5484D', warning: '#E9A049', success: '#2EAD5B' };

// brand per mode: [brand, brandStrong, onBrand]
export const THEMES = {
  techtiten: { label: 'Techtiten', hint: 'mint green + purple (FitPrep / EzySplit feel)', neutral: 'cool', light: ['#00A372', '#008A60', '#FFFFFF'], dark: ['#00C389', '#00A372', '#04110C'], accent: '#7C5CFF' },
  ocean: { label: 'Ocean', hint: 'calm blue, trusted (finance, productivity)', neutral: 'navy', light: ['#2F6FED', '#1F57C8', '#FFFFFF'], dark: ['#4D8DFF', '#2F6FED', '#06122A'], accent: '#00B8D9' },
  sunset: { label: 'Sunset', hint: 'orange + pink, energetic (food, fitness)', neutral: 'warm', light: ['#F2552C', '#D4401B', '#FFFFFF'], dark: ['#FF6B4A', '#F2552C', '#1A0B06'], accent: '#FF4F8B' },
  royal: { label: 'Royal', hint: 'violet, premium (education, lifestyle)', neutral: 'plum', light: ['#6A4CF0', '#5435D6', '#FFFFFF'], dark: ['#8B70FF', '#6A4CF0', '#0E0820'], accent: '#FF5CA8' },
  mono: { label: 'Mono', hint: 'black & white, minimal (tools, portfolio)', neutral: 'cool', light: ['#111317', '#000000', '#FFFFFF'], dark: ['#F2F3F5', '#FFFFFF', '#0B0B12'], accent: '#7A808C' },
  retro: { label: 'Retro LCD', hint: 'old-phone green screen (games, nostalgia)', neutral: 'lcd', light: ['#2F3B1E', '#1E2A14', '#C7D3A6'], dark: ['#9BD14A', '#B8E07A', '#10160C'], accent: '#5E7A2E' },
};

// Mobile: @expo-google-fonts/<pkg> exports; web: next/font/google import name + options.
export const FONTS = {
  system: { label: 'System', hint: 'San Francisco / Roboto, nothing to load' },
  inter: { label: 'Inter', hint: 'clean UI font', pkg: '@expo-google-fonts/inter', weights: { regular: 'Inter_400Regular', medium: 'Inter_500Medium', bold: 'Inter_700Bold', black: 'Inter_800ExtraBold' }, next: 'Inter', nextWeights: null },
  poppins: { label: 'Poppins', hint: 'round and friendly (consumer apps)', pkg: '@expo-google-fonts/poppins', weights: { regular: 'Poppins_400Regular', medium: 'Poppins_500Medium', bold: 'Poppins_700Bold', black: 'Poppins_800ExtraBold' }, next: 'Poppins', nextWeights: ['400', '500', '700', '800'] },
  'space-grotesk': { label: 'Space Grotesk', hint: 'techy, modern', pkg: '@expo-google-fonts/space-grotesk', weights: { regular: 'SpaceGrotesk_400Regular', medium: 'SpaceGrotesk_500Medium', bold: 'SpaceGrotesk_700Bold', black: 'SpaceGrotesk_700Bold' }, next: 'Space_Grotesk', nextWeights: null },
  pixel: { label: 'Press Start 2P', hint: 'pixel/8-bit (retro games)', pkg: '@expo-google-fonts/press-start-2p', weights: { regular: 'PressStart2P_400Regular', medium: 'PressStart2P_400Regular', bold: 'PressStart2P_400Regular', black: 'PressStart2P_400Regular' }, next: 'Press_Start_2P', nextWeights: ['400'] },
};

const hex = (h) => h.replace('#', '').padEnd(6, '0').slice(0, 6);
const toRgb = (h) => [0, 2, 4].map((i) => parseInt(hex(h).slice(i, i + 2), 16));
const toHex = (rgb) => '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const shade = (h, f) => toHex(toRgb(h).map((v) => (f < 0 ? v * (1 + f) : v + (255 - v) * f)));
const luminance = (h) => { const [r, g, b] = toRgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const isHex = (v) => /^#?[0-9a-fA-F]{6}$/.test(v ?? '');

/** { light: {...}, dark: {...} } colors for packages/theme. `brand` (#RRGGBB) overrides the preset's brand. */
export function buildColors(themeKey, brand) {
  const t = THEMES[themeKey];
  const out = {};
  for (const mode of ['light', 'dark']) {
    let [b, strong, on] = t[mode];
    if (brand) {
      b = '#' + hex(brand).toUpperCase();
      strong = shade(b, mode === 'light' ? -0.15 : 0.15);
      on = luminance(b) > 0.45 ? '#0B0D12' : '#FFFFFF';
    }
    out[mode] = { ...neutrals[t.neutral][mode], brand: b, brandStrong: strong, onBrand: on, accent: t.accent, ...fixed };
  }
  return out;
}
