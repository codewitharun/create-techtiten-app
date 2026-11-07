import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { Linking, Platform } from 'react-native';
import { app } from '__SCOPE__/config';

const KEY = 'review.v1';
type State = { happy: number; askedAt?: number };

/**
 * Call after a good moment (task done, payment settled, level cleared). After 3 of them, at most
 * once every 60 days, Google Play's / the App Store's own rating popup shows. The stores decide
 * whether it really appears, so never promise a reward for rating.
 */
export async function trackHappyMoment() {
  if (Platform.OS === 'web') return;
  try {
    const s: State = JSON.parse((await AsyncStorage.getItem(KEY)) ?? '{"happy":0}');
    s.happy += 1;
    const cooled = !s.askedAt || Date.now() - s.askedAt > 60 * 86_400_000;
    if (s.happy >= 3 && cooled && (await StoreReview.hasAction())) {
      s.askedAt = Date.now();
      s.happy = 0;
      await StoreReview.requestReview();
    }
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

/** "Rate us" button in Settings: opens the store page directly. */
export const openStorePage = () => Linking.openURL(app.storeUrl);
