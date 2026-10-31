import AsyncStorage from '@react-native-async-storage/async-storage';

import { helpStepIndices } from '@/config/helpFlow';
import { claimHelp, completeOnboarding, resetAllData } from '@/data';
import { CURRENT_VERSION } from '@/data/migrations';
import { getState, useDataStore } from '@/data/store';
import { STORAGE_KEY } from '@/data/storage';

beforeEach(() => resetAllData());

it('first run is wallet then goal; manual help still exposes all ten steps', () => {
  expect(helpStepIndices(true, undefined)).toEqual([1, 0]);
  expect(helpStepIndices(false, undefined)).toHaveLength(10);
  expect(helpStepIndices(false, 'home')).toEqual([2]);
  expect(helpStepIndices(false, 'report')).toEqual([9]);
  expect(helpStepIndices(false, 'unknown')).toHaveLength(10);
});

it('does not claim before setup; claims each scope only once', () => {
  expect(claimHelp('home')).toBe(false);
  completeOnboarding();
  expect(claimHelp('home')).toBe(true);
  expect(claimHelp('home')).toBe(false);
  expect(claimHelp('report')).toBe(true);
  expect(getState().settings.helpSeen).toEqual(['home', 'report']);
});

it('preserves first-visit history across app restarts', async () => {
  completeOnboarding();
  claimHelp('home');
  const saved = getState();
  resetAllData();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ state: saved, version: CURRENT_VERSION }));
  await useDataStore.persist.rehydrate();
  expect(claimHelp('home')).toBe(false);
  expect(claimHelp('wallet')).toBe(true);
});

it('loads old settings without resetting user data or onboarding', async () => {
  completeOnboarding();
  const saved = getState();
  const { helpSeen: _unused, ...legacySettings } = saved.settings;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { ...saved, settings: legacySettings }, version: CURRENT_VERSION }));
  await useDataStore.persist.rehydrate();
  expect(getState().settings.onboarded).toBe(true);
  expect(getState().settings.helpSeen).toEqual([]);
  expect(getState().goals).toEqual(saved.goals);
});
