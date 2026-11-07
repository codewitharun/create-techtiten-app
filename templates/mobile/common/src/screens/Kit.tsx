import { useState } from 'react';
import { emailSchema, firstError, upiIdSchema } from '__SCOPE__/shared';
import {
  Avatar, Badge, Button, Card, Divider, EmptyState, Header, IconButton, Input, ListItem, Loader, Row, Screen, Sheet, Skeleton, Switch, Text, useAlert, useBreakpoint,
} from '@/ui';

/** Every component in src/ui, live. Use it as a reference, then delete it (and app/kit.tsx). */
export default function Kit() {
  const { alert, confirm, toast } = useAlert();
  const { bp, width } = useBreakpoint();
  const [sheet, setSheet] = useState(false);
  const [on, setOn] = useState(true);
  const [email, setEmail] = useState('');
  const [upi, setUpi] = useState('');

  return (
    <>
      <Header title="Components" subtitle={`src/ui · ${bp} (${Math.round(width)}px)`} right={<IconButton icon="information-circle-outline" label="Info" onPress={() => toast('Every component uses your theme and font')} />} />
      <Screen>
        <Card>
          <Text weight="bold">Alerts</Text>
          <Row>
            <Button size="sm" title="Success" onPress={() => alert({ type: 'success', title: 'Saved!', message: 'Your changes are live.' })} />
            <Button size="sm" title="Error" variant="danger" onPress={() => alert({ type: 'error', title: 'Payment failed', message: 'Your bank declined it. Try again.' })} />
            <Button size="sm" title="Confirm" variant="secondary" onPress={async () => toast((await confirm({ title: 'Delete group?', message: 'This removes it for everyone.', destructive: true, confirmText: 'Delete' })) ? 'Deleted' : 'Kept', { type: 'info' })} />
            <Button size="sm" title="Toast" variant="ghost" onPress={() => toast('Copied to clipboard', { type: 'success' })} />
          </Row>
        </Card>

        <Card>
          <Text weight="bold">Buttons</Text>
          <Row>
            <Button size="sm" title="Primary" />
            <Button size="sm" title="Secondary" variant="secondary" />
            <Button size="sm" title="Ghost" variant="ghost" />
            <Button size="sm" title="Danger" variant="danger" icon="trash-outline" />
            <Button size="sm" title="Loading" loading />
          </Row>
          <Button title="Open bottom sheet" icon="chevron-up" variant="secondary" fullWidth onPress={() => setSheet(true)} />
        </Card>

        <Card>
          <Text weight="bold">Inputs (shared zod rules)</Text>
          <Input label="Email" icon="mail-outline" placeholder="you@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" error={email ? firstError(emailSchema.safeParse(email)) : undefined} />
          <Input label="UPI id" icon="wallet-outline" placeholder="name@bank" value={upi} onChangeText={setUpi} autoCapitalize="none" hint="Checked with upiIdSchema" error={upi ? firstError(upiIdSchema.safeParse(upi)) : undefined} />
          <Input label="Password" icon="lock-closed-outline" secureTextEntry placeholder="••••••••" />
          <Switch label="Daily reminder" description="A nudge at 8 pm" value={on} onValueChange={setOn} />
        </Card>

        <Card>
          <Text weight="bold">Display</Text>
          <Row><Badge label="Neutral" /><Badge label="Brand" tone="brand" /><Badge label="Paid" tone="success" /><Badge label="Due" tone="warning" /><Badge label="Failed" tone="danger" /></Row>
          <Divider />
          <ListItem icon="person-outline" title="List item" subtitle="With icon, subtitle and chevron" onPress={() => {}} />
          <ListItem title="Arun Kumar" subtitle="Avatar from initials" right={<Avatar name="Arun Kumar" />} />
          <Divider />
          <Skeleton width="70%" /><Skeleton width="40%" />
          <Loader label="Loading…" />
          <EmptyState title="Nothing here yet" message="Empty states guide people to the next step." action={{ label: 'Add first item', onPress: () => toast('Tapped') }} />
        </Card>
      </Screen>

      <Sheet visible={sheet} onClose={() => setSheet(false)} title="Bottom sheet">
        <Text muted>Slides up on phones, centered on wide screens. Tap outside to close.</Text>
        <Button title="Done" onPress={() => setSheet(false)} />
      </Sheet>
    </>
  );
}
