import AsyncStorage from '@react-native-async-storage/async-storage';
import { bobApi } from '@/api';
import { hasNotificationWork } from '@/lib/calc/notificationWork';
import { getState, useDataStore } from './store';
import { getToday } from './clock';
export const registerPushToken = (token:string) => bobApi.pushToken.put({token,enabled:true});
export const disablePushToken = () => bobApi.pushToken.delete();
export function needsNotification(day = getToday()) {
  const s = getState();
  return hasNotificationWork(Object.values(s.items),Object.values(s.questions),Object.values(s.answers),day);
}
export async function claimDailyNotification(test=false): Promise<boolean> {
  if (!useDataStore.persist.hasHydrated()) await useDataStore.persist.rehydrate();
  if (test) return true;
  const day = getToday();
  if (!needsNotification(day)) return false;
  const key = 'bob-last-notification-date';
  if (await AsyncStorage.getItem(key) === day) return false;
  await AsyncStorage.setItem(key,day);
  return true;
}
