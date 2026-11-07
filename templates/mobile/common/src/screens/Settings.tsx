import Constants from 'expo-constants';
import { router } from 'expo-router';
import { View } from 'react-native';
import { NotificationsSettings } from '@/features/notifications';
import { openStorePage } from '@/lib/review';
import { useAppearance, type Appearance } from '@/state';
import { Button, Card, Divider, Header, ListItem, Screen, Text } from '@/ui';

const OPTIONS: Appearance[] = ['system', 'light', 'dark'];

export default function Settings() {
  const { appearance, setAppearance } = useAppearance();
  return (
    <>
      <Header title="Settings" />
      <Screen>
        <Card>
          <Text weight="bold">Appearance</Text>
          <Text muted size="sm">Saved on this device.</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {OPTIONS.map((o) => (
              <Button key={o} title={o[0].toUpperCase() + o.slice(1)} size="sm" variant={appearance === o ? 'primary' : 'ghost'} onPress={() => setAppearance(o)} style={{ flex: 1 }} />
            ))}
          </View>
        </Card>

        <NotificationsSettings />

        <Card>
          <ListItem icon="star-outline" title="Rate __APP_NAME__" subtitle="It helps a lot" onPress={openStorePage} />
          <Divider />
          <ListItem icon="shield-checkmark-outline" title="Privacy policy" onPress={() => router.push('/legal/privacy')} />
          <ListItem icon="document-text-outline" title="Terms of use" onPress={() => router.push('/legal/terms')} />
          <ListItem icon="help-buoy-outline" title="Support" onPress={() => router.push('/legal/support')} />
          <ListItem icon="trash-outline" title="Delete account" danger onPress={() => router.push('/legal/delete-account')} />
        </Card>
        <Text muted size="sm" center>Version {Constants.expoConfig?.version}</Text>
      </Screen>
    </>
  );
}
