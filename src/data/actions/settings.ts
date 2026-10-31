/** 설정과 데이터 관리 */
import type { Settings } from '@/types';

import { createInitialState, initialSettings } from '../schema';
import { update } from '../store';

const patchSettings = (patch: Partial<Settings>) => update((s) => ({ settings: { ...s.settings, ...patch } }));

export const completeOnboarding = () => patchSettings({ onboarded: true });

export const setDailySavingOverride = (amount: number | null) =>
  patchSettings({ dailySavingOverride: amount !== null && amount > 0 ? Math.round(amount) : null });

export const setThemeScheme = (scheme: Settings['themeScheme']) => patchSettings({ themeScheme: scheme });

// ── 데모용 시간 이동 ──────────────────────────────────────

export const shiftClock = (days: number) =>
  update((s) => ({ settings: { ...s.settings, clockOffsetDays: s.settings.clockOffsetDays + Math.trunc(days) } }));

export const resetClock = () => patchSettings({ clockOffsetDays: 0 });

// ── 데이터 관리 ──────────────────────────────────────────

/** 모든 데이터를 지운다 (테마 설정은 유지) */
export function resetAllData(): void {
  update((s) => ({ ...createInitialState(), settings: { ...initialSettings, themeScheme: s.settings.themeScheme } }));
}
