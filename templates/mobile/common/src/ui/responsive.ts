import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'phone' | 'tablet' | 'desktop';
export const BREAKPOINTS = { tablet: 768, desktop: 1024 } as const;

/** phone < 768 <= tablet < 1024 <= desktop. Works on phones, tablets and the web build. */
export function useBreakpoint(): { bp: Breakpoint; width: number; isPhone: boolean; isWide: boolean } {
  const { width } = useWindowDimensions();
  const bp: Breakpoint = width >= BREAKPOINTS.desktop ? 'desktop' : width >= BREAKPOINTS.tablet ? 'tablet' : 'phone';
  return { bp, width, isPhone: bp === 'phone', isWide: bp !== 'phone' };
}

/** Pick a value per breakpoint: responsive({ phone: 1, tablet: 2, desktop: 3 }) */
export function useResponsive<T>(v: { phone: T; tablet?: T; desktop?: T }): T {
  const { bp } = useBreakpoint();
  return bp === 'desktop' ? v.desktop ?? v.tablet ?? v.phone : bp === 'tablet' ? v.tablet ?? v.phone : v.phone;
}
