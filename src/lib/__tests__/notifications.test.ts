import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

jest.mock('expo', () => ({ requireOptionalNativeModule: jest.fn(() => ({})) }));

const mockNative = {
  setNotificationHandler: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('bob-daily-check'),
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
};
let mockUnavailable = false;
const mockLoad = jest.fn();

jest.mock('expo-notifications', () => {
  mockLoad();
  if (mockUnavailable) throw new Error("Cannot find native module 'ExpoApplication'");
  return mockNative;
});

const params = { enabled: true, time: '20:00', title: '오늘의 돌아보기', body: '물품을 확인해 주세요', channelName: '돌아보기' };
const originalOS = Platform.OS;

beforeEach(() => {
  jest.clearAllMocks();
  (requireOptionalNativeModule as jest.Mock).mockReturnValue({});
  mockUnavailable = false;
  Platform.OS = 'android';
});
afterEach(() => { Platform.OS = originalOS; jest.restoreAllMocks(); });

it('does not import native notifications when the app layout loads', () => {
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../notifications');
    expect(mockLoad).not.toHaveBeenCalled();
  });
});

it('keeps the app usable when an optional native notification module is missing', async () => {
  mockUnavailable = true;
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  await jest.isolateModulesAsync(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { syncDailyReminder } = require('../notifications');
    await expect(syncDailyReminder(params)).resolves.toBeUndefined();
    await expect(syncDailyReminder(params)).resolves.toBeUndefined();
  });
  expect(mockLoad).toHaveBeenCalledTimes(1);
  expect(warning).toHaveBeenCalledTimes(1);
  expect(mockNative.scheduleNotificationAsync).not.toHaveBeenCalled();
});

it('does not evaluate the notification barrel when ExpoApplication is absent in Expo Go', async () => {
  (requireOptionalNativeModule as jest.Mock).mockReturnValue(null);
  await jest.isolateModulesAsync(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { syncDailyReminder } = require('../notifications');
    await syncDailyReminder(params);
  });
  expect(mockLoad).not.toHaveBeenCalled();
  expect(mockNative.scheduleNotificationAsync).not.toHaveBeenCalled();
});

it('preserves local reminders when native notifications are available', async () => {
  await jest.isolateModulesAsync(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { syncDailyReminder } = require('../notifications');
    await syncDailyReminder(params);
    expect(mockNative.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({
      identifier: 'bob-daily-check',
      trigger: { type: 'daily', hour: 20, minute: 0, channelId: 'daily-check' },
    }));
    await syncDailyReminder({ ...params, enabled: false });
  });
  expect(mockNative.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(2);
  expect(mockNative.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
});
