import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from '@/api/client';

/**
 * Gets this device's Expo push token and saves it on the API (POST /push/register).
 * Needs your EAS project id: run `npx eas init` in apps/mobile (adds extra.eas.projectId),
 * or set EXPO_PUBLIC_EAS_PROJECT_ID. Push doesn't work in Expo Go on Android: use a dev build.
 */
export async function registerPushToken() {
  if (Platform.OS === 'web') return;
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
  if (!projectId) { if (__DEV__) console.info('[push] no EAS project id yet: run `npx eas init` in apps/mobile'); return; }
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  await api('pushRegister', { body: { token, platform: Platform.OS === 'ios' ? 'ios' : 'android' } });
}
