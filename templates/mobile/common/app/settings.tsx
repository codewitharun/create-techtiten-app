import { View } from 'react-native';
import { useAppearance, type Appearance } from '@/state';
import { Button, Card, Screen, Text } from '@/ui';

const OPTIONS: Appearance[] = ['system', 'light', 'dark'];

export default function Settings() {
  const { appearance, setAppearance } = useAppearance();
  return (
    <Screen>
      <Card>
        <Text weight="bold">Appearance</Text>
        <Text muted>Saved on this phone.</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {OPTIONS.map((o) => (
            <Button key={o} title={o} variant={appearance === o ? 'primary' : 'ghost'} onPress={() => setAppearance(o)} style={{ flex: 1 }} />
          ))}
        </View>
      </Card>
    </Screen>
  );
}
