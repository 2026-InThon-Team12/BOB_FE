/**
 * 매일 저녁 체크 알림 (기기 로컬 알림 — 서버 푸시 아님).
 * 웹은 로컬 알림을 지원하지 않아 아무것도 하지 않는다 (홈 배너로 대신).
 */
import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

const REMINDER_ID = 'bob-daily-check';
const CHANNEL_ID = 'daily-check';

export const notificationsSupported = Platform.OS !== 'web';

let configured = false;
type NotificationsModule = typeof import('expo-notifications');
let notifications: NotificationsModule | null | undefined;

// Optional native modules must not prevent Expo Router from loading the app.
// Cache the result so an unsupported runtime does not retry on every item update.
function loadNotifications(): NotificationsModule | null {
  if (notifications !== undefined) return notifications;
  // Some Expo Go runtimes omit this dependency of the notifications barrel.
  // Check before evaluating it: Metro may report import-time exceptions even if caught.
  if (!requireOptionalNativeModule('ExpoApplication')) {
    notifications = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Load optional native code only inside this guarded call.
    notifications = require('expo-notifications') as NotificationsModule;
  } catch {
    console.warn('[notifications] 이 실행 환경에서는 로컬 알림을 사용할 수 없어요.');
    notifications = null;
  }
  return notifications;
}

/** 앱 실행 중에도 알림을 배너로 보여준다 */
function configure(Notifications: NotificationsModule) {
  if (configured || !notificationsSupported) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function ensurePermission(Notifications: NotificationsModule): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/**
 * 매일 같은 시각 알림을 켜거나 끈다 (하루 한 번만, 품목 수와 관계없이).
 * @param time HH:mm
 */
export async function syncDailyReminder(params: {
  enabled: boolean;
  time: string;
  title: string;
  body: string;
  channelName: string;
}): Promise<void> {
  if (!notificationsSupported) return;
  const Notifications = loadNotifications();
  if (!Notifications) return;
  configure(Notifications);
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => {});
  if (!params.enabled) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: params.channelName,
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  if (!(await ensurePermission(Notifications))) return;
  const [hour, minute] = params.time.split(':').map(Number);
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: { title: params.title, body: params.body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: CHANNEL_ID },
  });
}
