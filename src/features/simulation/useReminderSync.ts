import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAnswers, useHydrated, useItems, useQuestions, useToday } from '@/data';
import { hasNotificationWork } from '@/lib/calc/notificationWork';
import { addDays } from '@/lib/date';
import { syncNotifications } from '@/lib/notifications';
export function useReminderSync() {
  const items=useItems(), questions=useQuestions(), answers=useAnswers(), today=useToday(), hydrated=useHydrated();
  const dates=Array.from({length:30},(_,i)=>addDays(today,i)).filter(day=>hasNotificationWork(items,questions,answers,day));
  const key=dates.join(',');
  useEffect(()=>{
    if (!hydrated) return;
    let disposed=false, cleanup=()=>{};
    void syncNotifications(key ? key.split(','):[],()=>router.push('/check')).then(fn=>{if(disposed)fn();else cleanup=fn;}).catch(()=>{});
    return ()=>{disposed=true;cleanup();};
  },[key,hydrated]);
}
