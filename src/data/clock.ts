/**
 * 현재 시각. 모든 "지금"은 여기서 읽는다 (데모 시간 이동 offset 반영).
 */
import { useEffect, useState } from 'react';
import { shiftedNow, toDateKey, toMonthKey } from '@/lib/date';
import { env } from '@/config/env';

import { getState, useDataStore } from './store';

export const getClockOffset = () => env.demo ? getState().settings.clockOffsetDays : 0;
export const isTimePreview = () => getClockOffset() !== 0;
export const getNow = () => shiftedNow(getClockOffset());
export const getNowIso = () => getNow().toISOString();
export const getToday = () => toDateKey(getNow());
export const getThisMonth = () => toMonthKey(getNow());

const useOffset = () => useDataStore((s) => env.demo ? s.settings.clockOffsetDays : 0);

/** 오늘 날짜 키 (시간 이동 시 다시 렌더링된다) */
export const useToday = () => {
  const offset = useOffset();
  const [,tick] = useState(0);
  useEffect(()=>{const timer=setInterval(()=>tick(n=>n+1),30_000);return ()=>clearInterval(timer);},[]);
  return toDateKey(shiftedNow(offset));
};
export const useThisMonth = () => useToday().slice(0,7);
