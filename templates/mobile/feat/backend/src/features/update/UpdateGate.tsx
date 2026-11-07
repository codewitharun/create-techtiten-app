import Constants from 'expo-constants';
import { Linking, View } from 'react-native';
import type { ReactNode } from 'react';
import { compareVersions } from '__SCOPE__/shared';
import { useApiQuery } from '@/api/hooks';
import { Button, Text } from '@/ui';
import { useTheme } from '@/theme';

/**
 * Force update: asks the API for the minimum version (GET /app-config, set MIN_APP_VERSION on the
 * server). If this build is older, a full-screen "Update" page blocks the app.
 * If the API can't be reached, the app opens normally (never lock people out by mistake).
 */
export function UpdateGate({ children }: { children: ReactNode }) {
  const t = useTheme();
  const cfg = useApiQuery('appConfig', undefined, { staleTime: 30 * 60_000 });
  const current = Constants.expoConfig?.version ?? '0.0.0';
  if (!cfg.data || compareVersions(current, cfg.data.minVersion) >= 0) return <>{children}</>;
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
      <Text size="xxl" weight="black" center>Update needed</Text>
      <Text muted center>{cfg.data.message ?? `This version (${current}) is no longer supported. Please update to keep using the app.`}</Text>
      <Button title="Update now" icon="download-outline" size="lg" onPress={() => Linking.openURL(cfg.data!.storeUrl)} />
    </View>
  );
}
