/**
 * 매일 저녁 체크 알림 (기기 로컬 알림 — 서버 푸시 아님).
 * 웹은 로컬 알림을 지원하지 않아 아무것도 하지 않는다 (홈 배너로 대신).
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const REMINDER_ID = 'bob-daily-check';
const CHANNEL_ID = 'daily-check';

export const notificationsSupported = Platform.OS !== 'web';

let configured = false;

/** 앱 실행 중에도 알림을 배너로 보여준다 */
function configure() {
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

async function ensurePermission(): Promise<boolean> {
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
  configure();
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => {});
  if (!params.enabled || !(await ensurePermission())) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: params.channelName,
      // index.d.ts의 `export *`로 내보내지만 eslint import 플러그인이 따라가지 못한다 (tsc는 확인함)
      // eslint-disable-next-line import/namespace
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const [hour, minute] = params.time.split(':').map(Number);
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: { title: params.title, body: params.body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: CHANNEL_ID },
  });
}
