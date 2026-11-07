import { View } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// Test ads in development, your real unit id in release builds (EXPO_PUBLIC_ADMOB_BANNER_ID).
// Ads need a dev build (npm run android), not Expo Go.
const UNIT_ID = __DEV__ ? TestIds.ADAPTIVE_BANNER : process.env.EXPO_PUBLIC_ADMOB_BANNER_ID ?? TestIds.ADAPTIVE_BANNER;

export function Banner() {
  return (
    <View style={{ alignItems: 'center' }}>
      <BannerAd unitId={UNIT_ID} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
    </View>
  );
}
