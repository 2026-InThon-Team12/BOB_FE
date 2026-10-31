/** Expo Go uses dated local reminders; Android builds use native FCM tokens. */
import { requireOptionalNativeModule } from 'expo';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { claimDailyNotification, registerPushToken, disablePushToken } from '@/data/notificationBridge';

export const notificationsSupported = Platform.OS !== 'web';
const CHANNEL = 'bob_daily';
const TASK = 'bob-background-push';
const isGo = Constants.executionEnvironment === 'storeClient';
type NotificationsModule = typeof import('expo-notifications');
let notifications: NotificationsModule | null | undefined;
export function loadNotifications(): NotificationsModule|null {
  if (notifications !== undefined) return notifications;
  if (!notificationsSupported || !requireOptionalNativeModule('ExpoApplication')) return notifications = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    notifications = require('expo-notifications') as NotificationsModule;
    notifications.setNotificationHandler({handleNotification:async notification=> {
      const allowed = notification.request.content.data?.bob_prechecked === true || await claimDailyNotification(notification.request.content.data?.test === 'true');
      return {shouldShowBanner:allowed,shouldShowList:allowed,shouldPlaySound:false,shouldSetBadge:false};
    }});
  } catch {notifications=null;}
  return notifications;
}
async function handleBackground(data: import('expo-notifications').NotificationTaskPayload) {
  if ('actionIdentifier' in data) return;
  const payload = data.data.dataString ? JSON.parse(data.data.dataString) as Record<string,unknown> : data.data;
  if (payload.client_managed !== 'true') return;
  if (!await claimDailyNotification(payload.test === 'true')) return;
  const n = loadNotifications();
  await n?.scheduleNotificationAsync({identifier:`bob-push-${String(payload.digest_id)}`,content:{title:String(payload.title ?? '오늘의 돌아보기'),body:String(payload.body ?? '오늘 할 일을 확인해 주세요.'),data:{route:'today',bob_prechecked:true}},trigger:null});
}
// defineTask must execute at module scope, but never evaluate native background code in Expo Go.
if (Platform.OS === 'android' && !isGo && requireOptionalNativeModule('ExpoTaskManager')) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const manager = require('expo-task-manager') as typeof import('expo-task-manager');
  if (!manager.isTaskDefined(TASK)) manager.defineTask<import('expo-notifications').NotificationTaskPayload>(TASK,async ({data,error})=>{
    if (!error) try {await handleBackground(data);} catch { /* No payloads or tokens in logs. */ }
  });
}
let serial = Promise.resolve();
export function syncNotifications(dates:string[], onOpen:()=>void): Promise<()=>void> {
  let cleanup = ()=>{};
  const operation = serial.then(async()=> {
    const n = loadNotifications(); if (!n) return;
    if (Platform.OS === 'android') await n.setNotificationChannelAsync(CHANNEL,{name:'오늘의 돌아보기',importance:n.AndroidImportance.DEFAULT});
    const permission = await n.getPermissionsAsync();
    const granted = permission.granted || (permission.canAskAgain && (await n.requestPermissionsAsync()).granted);
    const pending = await n.getAllScheduledNotificationsAsync();
    await Promise.all(pending.filter(r=>r.identifier.startsWith('bob-')).map(r=>n.cancelScheduledNotificationAsync(r.identifier)));
    if (!granted) {if (!isGo) await disablePushToken().catch(()=>{});return;}
    let remote = false;
    const subscriptions: {remove:()=>void}[] = [];
    if (Platform.OS === 'android' && !isGo) {
      try {
        await n.registerTaskAsync(TASK);
        const token = await n.getDevicePushTokenAsync();
        await registerPushToken(String(token.data)); remote=true;
        subscriptions.push(n.addPushTokenListener(t=>{void registerPushToken(String(t.data)).catch(()=>{});}));
      } catch { /* Keep local reminders if native registration is unavailable. */ }
    }
    if (!remote) for (const day of dates) {
      const date = new Date(`${day}T20:00:00+09:00`);
      if (date.getTime() <= Date.now()) continue;
      await n.scheduleNotificationAsync({identifier:`bob-reminder-${day}`,content:{title:'오늘의 돌아보기',body:'미응답 질문과 구매 결정을 확인해 주세요.',data:{route:'today'}},trigger:{type:n.SchedulableTriggerInputTypes.DATE,date,channelId:CHANNEL}});
    }
    subscriptions.push(n.addNotificationResponseReceivedListener(r=>{if(r.notification.request.content.data?.route==='today') onOpen();}));
    const last = await n.getLastNotificationResponseAsync();
    if (last?.notification.request.content.data?.route === 'today') {onOpen();await n.clearLastNotificationResponseAsync();}
    cleanup = ()=>subscriptions.forEach(s=>s.remove());
  });
  serial = operation.catch(()=>{});
  return operation.then(()=>cleanup);
}
