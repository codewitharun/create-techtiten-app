import { revalidatePath } from 'next/cache';
import { pushService } from '@/server/modules/push/push.service';

// Send a push notification to every device that turned notifications on.
async function send(form: FormData) {
  'use server';
  const title = String(form.get('title') ?? '').trim();
  const body = String(form.get('body') ?? '').trim();
  if (!title || !body) return;
  await pushService.sendToAll({ title, body });
  revalidatePath('/admin');
}

export function PushCard() {
  return (
    <form action={send} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <h2 className="font-bold">Send a notification</h2>
      <input name="title" required maxLength={80} placeholder="Title" className="rounded-xl border border-border bg-background px-4 py-2" />
      <textarea name="body" required maxLength={240} rows={2} placeholder="Message" className="rounded-xl border border-border bg-background px-4 py-2" />
      <button className="w-fit rounded-xl bg-brand px-5 py-2 font-bold text-on-brand">Send to everyone</button>
    </form>
  );
}
