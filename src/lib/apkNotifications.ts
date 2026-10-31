import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apkCopy as c } from '@/constants/apkCopy';

export const apkPushAvailable = () => Platform.OS === 'android' && Constants.executionEnvironment !== 'storeClient';
export async function apkDevicePushToken(): Promise<string> {
  if (!apkPushAvailable()) throw new Error(c.pushGo);
  const notifications = await import('expo-notifications');
  await notifications.setNotificationChannelAsync('bob-reminders', {
    name: c.today,
    importance: notifications.AndroidImportance.DEFAULT,
  });
  const permission = await notifications.requestPermissionsAsync();
  if (!permission.granted) throw new Error(c.pushDenied);
  return String((await notifications.getDevicePushTokenAsync()).data);
}
