import { router, useSegments } from 'expo-router';
import { fromMinor, formatCompactIN, formatCurrency, splitEvenly } from '__SCOPE__/shared';
import { Banner } from '@/ads/Banner';
import { NotesCard } from '@/features/notes/NotesCard';
import { trackHappyMoment } from '@/lib/review';
import { useTaps } from '@/state';
import { Badge, Button, Card, Header, IconButton, Row, Screen, Text, useResponsive } from '@/ui';
import { View } from 'react-native';

export default function Home() {
  const { taps, addTap } = useTaps();
  const shares = splitEvenly(100000, 3).map((m) => formatCurrency(fromMinor(m)));
  const columns = useResponsive({ phone: 1, tablet: 2 });
  const inTabs = (useSegments() as string[])[0] === '(tabs)'; // tabs already have a Settings tab

  return (
    <>
      <Header title="__APP_NAME__" large back={false} right={inTabs ? undefined : <IconButton icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} />} />
      <Screen>
        <Card>
          <Badge label="create-techtiten-app" tone="brand" />
          <Text size="xl" weight="black">Welcome to __APP_NAME__</Text>
          <Text muted>Edit src/screens/Home.tsx to start. Colors come from packages/theme, helpers from packages/shared, components from src/ui.</Text>
          <Button title="See all components" icon="grid-outline" variant="secondary" onPress={() => router.push('/kit')} />
        </Card>

        <View style={{ flexDirection: columns > 1 ? 'row' : 'column', gap: 16 }}>
          <Card style={{ flex: 1 }}>
            <Text weight="bold">State demo (__STATE__)</Text>
            <Text muted>Tapped {taps} times</Text>
            <Button title="Tap" onPress={() => { addTap(); if ((taps + 1) % 10 === 0) trackHappyMoment(); }} />
          </Card>
          <Card style={{ flex: 1 }}>
            <Text weight="bold">Shared logic demo</Text>
            <Text muted>₹1,000 split 3 ways: {shares.join(' · ')}</Text>
            <Row><Badge label={`₹${formatCompactIN(250000)}`} /><Badge label={`₹${formatCompactIN(34000000)}`} /></Row>
          </Card>
        </View>

        <NotesCard />
        <Banner />
      </Screen>
    </>
  );
}
