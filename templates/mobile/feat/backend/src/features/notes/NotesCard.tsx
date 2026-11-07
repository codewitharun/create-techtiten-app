import { useState } from 'react';
import { errorMessage, noteInputSchema, relativeDay } from '__SCOPE__/shared';
import { useApiMutation, useApiQuery } from '@/api/hooks';
import { Badge, Button, Card, Divider, IconButton, Input, ListItem, Row, Skeleton, Text, useAlert } from '@/ui';

/** Example of the full path: shared contract -> API module -> typed hooks. Replace with your feature. */
export function NotesCard() {
  const { confirm, toast } = useAlert();
  const health = useApiQuery('health');
  const notes = useApiQuery('notesList', { query: { limit: 20 } });
  const create = useApiMutation('notesCreate', { invalidates: ['notesList'] });
  const remove = useApiMutation('notesDelete', { invalidates: ['notesList'] });
  const [text, setText] = useState('');
  const [err, setErr] = useState<string>();

  async function add() {
    const check = noteInputSchema.safeParse({ text });
    if (!check.success) return setErr(check.error.issues[0]?.message);
    setErr(undefined);
    try { await create.mutateAsync({ body: check.data }); setText(''); toast('Note added', { type: 'success' }); }
    catch (e) { toast(errorMessage(e), { type: 'error' }); }
  }

  return (
    <Card>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text weight="bold">API demo: notes</Text>
        <Badge label={health.isLoading ? 'checking…' : health.data ? 'API online' : 'API offline'} tone={health.data ? 'success' : health.isLoading ? 'neutral' : 'danger'} />
      </Row>
      {health.error ? <Text size="sm" muted>{errorMessage(health.error)} Run `npm run dev` in the repo root.</Text> : null}
      <Input placeholder="Write a note" value={text} onChangeText={setText} error={err} onSubmitEditing={add} returnKeyType="done" />
      <Button title="Add note" icon="add" loading={create.isPending} onPress={add} disabled={!health.data} />
      <Divider />
      {notes.isLoading ? <Skeleton height={40} /> : null}
      {notes.data?.length === 0 ? <Text muted size="sm">No notes yet.</Text> : null}
      {notes.data?.map((n) => (
        <ListItem key={n.id} title={n.text} subtitle={relativeDay(n.createdAt)}
          right={<IconButton icon="trash-outline" label="Delete note" onPress={async () => { if (await confirm({ title: 'Delete note?', destructive: true, confirmText: 'Delete' })) await remove.mutateAsync({ params: { id: n.id } }); }} />} />
      ))}
    </Card>
  );
}
