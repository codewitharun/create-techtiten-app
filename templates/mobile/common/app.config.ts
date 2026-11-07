import type { ExpoConfig } from 'expo/config';
import app from '../../packages/config/src/app.json';
import base from './config/base.json';
import pluginNames from './config/plugins.json';

// Names, package id, scheme and domains come from packages/config/src/app.json (shared with the API and web).
// config/base.json = what this Expo SDK's own template ships (icons, splash, platform defaults).
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
  name: app.name,
  slug: app.slug,
  scheme: app.scheme,
  version: '1.0.0',
  userInterfaceStyle: 'automatic',
  ios: {
    ...sdkDefaults.ios,
    bundleIdentifier: app.packageId,
    buildNumber: String(buildNumber),
    // https deep links: https://<web domain>/... opens the app (needs apple-app-site-association on the site)
    associatedDomains: [`applinks:${app.domains.web}`],
  },
  android: {
    ...sdkDefaults.android,
    package: app.packageId,
    versionCode: buildNumber,
    // https deep links (App Links). The site must serve /.well-known/assetlinks.json (apps/web does).
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [{ scheme: 'https', host: app.domains.web }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  plugins,
  experiments: { ...sdkDefaults.experiments, typedRoutes: true },
};

export default config;
