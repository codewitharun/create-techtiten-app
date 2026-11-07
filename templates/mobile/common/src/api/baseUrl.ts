import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiPrefix, app } from '__SCOPE__/config';

/**
 * Where the API is, worked out automatically:
 *  - EXPO_PUBLIC_API_URL if you set it (apps/mobile/.env), else
 *  - release builds: https://<app.domains.api><prefix>
 *  - development:
 *      web build        -> same host as the page, API port
 *      phone/emulator   -> your computer's LAN IP (the one Expo's QR code uses), API port
 * So `npm run dev` + the app on your phone just works on the same Wi-Fi.
 */
export function apiBaseUrl(): string {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env) return env.replace(/\/$/, '');
  if (!__DEV__) return `https://${app.domains.api}${apiPrefix}`;
  const port = app.backend === 'next' ? app.ports.web : app.ports.api;
  if (Platform.OS === 'web' && typeof window !== 'undefined') return `${window.location.protocol}//${window.location.hostname}:${port}${apiPrefix}`;
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:${port}${apiPrefix}`;
  return `http://${Platform.OS === 'android' ? '10.0.2.2' : 'localhost'}:${port}${apiPrefix}`;
}
