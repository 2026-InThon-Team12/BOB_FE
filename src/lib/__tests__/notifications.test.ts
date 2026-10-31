/* eslint-disable @typescript-eslint/no-require-imports -- isolated native-module evaluation is the subject of these tests */
import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
jest.mock('expo',()=>({requireOptionalNativeModule:jest.fn(()=>({}))}));
jest.mock('expo-constants',()=>({__esModule:true,default:{executionEnvironment:'storeClient'}}));
jest.mock('@/data/notificationBridge',()=>({claimDailyNotification:jest.fn().mockResolvedValue(true),registerPushToken:jest.fn().mockResolvedValue({}),disablePushToken:jest.fn().mockResolvedValue({})}));
const mockNative={setNotificationHandler:jest.fn(),cancelScheduledNotificationAsync:jest.fn().mockResolvedValue(undefined),getAllScheduledNotificationsAsync:jest.fn().mockResolvedValue([{identifier:'bob-reminder-old'}]),getPermissionsAsync:jest.fn().mockResolvedValue({granted:true}),requestPermissionsAsync:jest.fn().mockResolvedValue({granted:true}),setNotificationChannelAsync:jest.fn().mockResolvedValue(undefined),scheduleNotificationAsync:jest.fn().mockResolvedValue('n'),addNotificationResponseReceivedListener:jest.fn((_listener:(r:{notification:{request:{content:{data:{route:string}}}}})=>void)=>({remove:jest.fn()})),getLastNotificationResponseAsync:jest.fn().mockResolvedValue(null),clearLastNotificationResponseAsync:jest.fn(),AndroidImportance:{DEFAULT:3},SchedulableTriggerInputTypes:{DATE:'date'}};
let mockUnavailable=false;const mockLoad=jest.fn();
jest.mock('expo-notifications',()=>{mockLoad();if(mockUnavailable)throw new Error('native absent');return mockNative;});
const originalOS=Platform.OS;
beforeEach(()=>{jest.clearAllMocks();(requireOptionalNativeModule as jest.Mock).mockReturnValue({});mockUnavailable=false;Platform.OS='android';});
afterEach(()=>{Platform.OS=originalOS;});
it('does not load native notification modules on import in Expo Go',()=>{
  jest.isolateModules(()=>{require('../notifications');expect(mockLoad).not.toHaveBeenCalled();});
});
it('missing ExpoApplication never breaks QR startup',async()=>{
  (requireOptionalNativeModule as jest.Mock).mockReturnValue(null);
  await jest.isolateModulesAsync(async()=>{const {syncNotifications}=require('../notifications');await syncNotifications(['2099-01-01'],()=>{});});
  expect(mockLoad).not.toHaveBeenCalled();expect(mockNative.scheduleNotificationAsync).not.toHaveBeenCalled();
});
it('unavailable optional module is cached and does not crash',async()=>{
  mockUnavailable=true;
  await jest.isolateModulesAsync(async()=>{const {syncNotifications}=require('../notifications');await syncNotifications([],()=>{});await syncNotifications([],()=>{});});
  expect(mockLoad).toHaveBeenCalledTimes(1);
});
it('dated reminders replace previous schedules and click routes to today',async()=>{
  const open=jest.fn();
  await jest.isolateModulesAsync(async()=>{const {syncNotifications}=require('../notifications');const cleanup=await syncNotifications(['2099-01-01'],open);expect(mockNative.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({identifier:'bob-reminder-2099-01-01',trigger:expect.objectContaining({type:'date',channelId:'bob_daily'})}));mockNative.addNotificationResponseReceivedListener.mock.calls[0][0]({notification:{request:{content:{data:{route:'today'}}}}});expect(open).toHaveBeenCalledTimes(1);cleanup();await syncNotifications([],open);});
  expect(mockNative.scheduleNotificationAsync).toHaveBeenCalledTimes(1);expect(Constants.executionEnvironment).toBe('storeClient');
});
