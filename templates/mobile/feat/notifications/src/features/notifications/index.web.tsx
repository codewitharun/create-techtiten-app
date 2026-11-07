// Web build: browsers don't support Expo notifications, so these do nothing (and the Settings card hides).
export const ensurePermission = async () => false;
export const scheduleDailyReminder = async (_hour?: number, _minute?: number, _content?: { title: string; body: string }) => {};
export const cancelDailyReminder = async () => {};
export function useNotificationsSetup() {}
export function NotificationsSettings() {
  return null;
}
