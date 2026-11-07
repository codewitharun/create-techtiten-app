import { Link } from 'expo-router';
import { formatCurrency, splitEvenly, fromMinor, timeAgo } from '__SCOPE__/shared';
import { useHealth } from '@/api/client';
import { Banner } from '@/ads/Banner';
import { useTaps } from '@/state';
import { Button, Card, Screen, Text } from '@/ui';

const WEB_API = __WEB_ENABLED__;

export default function Home() {
  const { taps, addTap } = useTaps();
  const health = useHealth(WEB_API);
  const shares = splitEvenly(100000, 3).map((m) => formatCurrency(fromMinor(m)));

  return (
    <Screen>
      <Card>
        <Text size="xl" weight="black">Welcome to __APP_NAME__</Text>
        <Text muted>Edit app/index.tsx to start. Colors come from packages/theme, helpers from packages/shared.</Text>
      </Card>

      <Card>
        <Text weight="bold">State demo (__STATE__)</Text>
        <Text muted>Tapped {taps} times</Text>
        <Button title="Tap" onPress={addTap} />
      </Card>

      <Card>
        <Text weight="bold">Shared logic demo</Text>
        <Text muted>₹1,000 split 3 ways: {shares.join(' · ')}</Text>
      </Card>

      {WEB_API ? (
        <Card>
          <Text weight="bold">API demo (Next.js /api/health)</Text>
          <Text muted>
            {health.isLoading ? 'Checking…' : health.data ? `OK · ${timeAgo(health.data.time)}` : `Not reachable (${health.error?.message ?? 'start npm run web'})`}
          </Text>
        </Card>
      ) : null}

      <Link href="/settings" asChild>
        <Button title="Settings" variant="ghost" />
      </Link>
      <Banner />
    </Screen>
  );
}
