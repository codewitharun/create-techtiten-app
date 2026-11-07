import type { ExpoConfig } from 'expo/config';
import base from './config/base.json';
import pluginNames from './config/plugins.json';

// config/base.json = what this Expo SDK's own template ships (icons, splash, platform defaults),
// saved by create-techtiten-app. Our settings go on top, so new SDK defaults are never lost.
// config/plugins.json = config plugins of the installed packages.

// versionCode/buildNumber come from CI (BUILD_NUMBER = GitHub run number): every Play upload is higher.
const buildNumber = Number(process.env.BUILD_NUMBER ?? 1);

// AdMob app ids: Google's TEST ids unless ADMOB_ANDROID_APP_ID / ADMOB_IOS_APP_ID are set (CI or .env).
const pluginOptions: Record<string, object> = {
  'react-native-google-mobile-ads': {
    androidAppId: process.env.ADMOB_ANDROID_APP_ID ?? 'ca-app-pub-3940256099942544~3347511713',
    iosAppId: process.env.ADMOB_IOS_APP_ID ?? 'ca-app-pub-3940256099942544~1458002511',
  },
};
const plugins: ExpoConfig['plugins'] = (pluginNames as string[]).map((name) => (pluginOptions[name] ? [name, pluginOptions[name]] : name));

const sdkDefaults = base as Partial<ExpoConfig>;

const config: ExpoConfig = {
  ...sdkDefaults,
  name: '__APP_NAME__',
  slug: '__APP_SLUG__',
  scheme: '__APP_SLUG__',
  version: '1.0.0',
  userInterfaceStyle: 'automatic',
  ios: { ...sdkDefaults.ios, bundleIdentifier: '__PACKAGE_ID__', buildNumber: String(buildNumber) },
  android: { ...sdkDefaults.android, package: '__PACKAGE_ID__', versionCode: buildNumber },
  plugins,
  experiments: { ...sdkDefaults.experiments, typedRoutes: true },
};

export default config;
