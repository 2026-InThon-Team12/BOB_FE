/**
 * 현재 시각. 모든 "지금"은 여기서 읽는다 (데모 시간 이동 offset 반영).
 */
import { shiftedNow, toDateKey, toMonthKey } from '@/lib/date';

import { getState, useDataStore } from './store';

export const getNow = () => shiftedNow(getState().settings.clockOffsetDays);
export const getNowIso = () => getNow().toISOString();
export const getToday = () => toDateKey(getNow());
export const getThisMonth = () => toMonthKey(getNow());

const useOffset = () => useDataStore((s) => s.settings.clockOffsetDays);

/** 오늘 날짜 키 (시간 이동 시 다시 렌더링된다) */
export const useToday = () => toDateKey(shiftedNow(useOffset()));
export const useThisMonth = () => toMonthKey(shiftedNow(useOffset()));
