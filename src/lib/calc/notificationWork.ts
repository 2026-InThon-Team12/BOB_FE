import type { Item, Question, DailyAnswer } from '@/types';
import { policy } from '@/config/policy';
import { simulationDayKeys } from './simulation';
import { reviewDueDay, simulationEndDay } from './itemMachine';
export function hasNotificationWork(items:Item[], questions:Question[], answers:DailyAnswer[], day:string): boolean {
  return items.some(i=> {
    if (i.registrationState === 'pending' || i.status === 'abandoned') return false;
    const phase = i.status === 'bought' ? 'post':'pre';
    const answered = answers.some(a=>a.itemId===i.id && a.date===day && questions.some(q=>q.id===a.questionId && (q.phase ?? 'pre')===phase));
    if (i.status === 'simulating') return day >= simulationEndDay(i) || (simulationDayKeys(i).includes(day) && !answered);
    const due = reviewDueDay(i, policy);
    return due !== null && day >= due && !answered;
  });
}
