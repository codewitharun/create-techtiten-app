// Notifications: a daily local reminder (works offline, no server) and, when the project has an API,
// push notifications sent from the admin panel / POST /admin/push/send.
// (Web: index.web.tsx, browsers don't support these.) Push on Android needs FCM set up once: https://docs.expo.dev/push-notifications/fcm-credentials/
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Card, Switch, Text, useAlert } from '@/ui';
import { registerPushToken } from './push';

const REMINDER_ID = 'daily-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

/** Asks for permission (once). Returns true if notifications are allowed. */
export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** Daily reminder at hour:minute (local time). Replaces any earlier one. */
export async function scheduleDailyReminder(hour = 20, minute = 0, content = { title: 'Time for a quick check-in', body: 'Open the app and keep your streak going.' }) {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: { ...content, data: { url: '/' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
}

export const cancelDailyReminder = () => Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => {});

/** Runs once at startup: Android channel, push token refresh, and opening `data.url` when a notification is tapped. */
export function useNotificationsSetup() {
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (Platform.OS === 'android') Notifications.setNotificationChannelAsync('default', { name: 'General', importance: Notifications.AndroidImportance.DEFAULT });
    Notifications.getPermissionsAsync().then((p) => { if (p.granted) registerPushToken().catch(() => {}); });
  }, []);
  useEffect(() => {
    const url = response?.notification.request.content.data?.url;
    if (typeof url === 'string' && url.startsWith('/')) router.push(url as never);
  }, [response]);
}

/** Settings card: one switch for the daily reminder (asks for permission the first time). */
export function NotificationsSettings() {
  const { toast } = useAlert();
  const [on, setOn] = useState(false);

  useEffect(() => {
    Notifications.getAllScheduledNotificationsAsync().then((list) => setOn(list.some((n) => n.identifier === REMINDER_ID)));
  }, []);

  async function toggle(next: boolean) {
    if (!next) { await cancelDailyReminder(); setOn(false); return; }
    if (!(await ensurePermission())) { toast('Turn on notifications for this app in your phone settings', { type: 'error' }); return; }
    await scheduleDailyReminder();
    registerPushToken().catch(() => {});
    setOn(true);
    toast('Reminder set for 8:00 PM every day', { type: 'success' });
  }

  return (
    <Card>
      <Text weight="bold">Notifications</Text>
      <Switch label="Daily reminder" description="A nudge at 8:00 PM" value={on} onValueChange={toggle} />
    </Card>
  );
}
