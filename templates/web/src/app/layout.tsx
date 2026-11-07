import type { Metadata } from 'next';
import { cssVariables } from '__SCOPE__/theme';
import { appFontClass } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: '__APP_NAME__',
  description: '__APP_NAME__ by Techtiten',
};

// Theme colors come from packages/theme (same as the phone app), as CSS variables.
const toCss = (vars: Record<string, string>) => Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';');
const themeCss = `:root{${toCss(cssVariables('light'))}}@media (prefers-color-scheme: dark){:root{${toCss(cssVariables('dark'))}}}`;

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`h-full antialiased ${appFontClass}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
