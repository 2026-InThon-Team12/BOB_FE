import type { Item, Question, DailyAnswer } from '@/types';
import { addDays, dateKeyOf } from '@/lib/date';
import { simulationDayKeys } from './simulation';
import { simulationEndDay } from './itemMachine';
export function hasNotificationWork(items:Item[], questions:Question[], answers:DailyAnswer[], day:string): boolean {
  return items.some(i=> {
    if (i.registrationState === 'pending' || i.status === 'abandoned') return false;
    const phase = i.status === 'bought' ? 'post':'pre';
    const answered = answers.some(a=>a.itemId===i.id && a.date===day && questions.some(q=>q.id===a.questionId && (q.phase ?? 'pre')===phase));
    if (i.status === 'simulating') return day >= simulationEndDay(i) || (simulationDayKeys(i).includes(day) && !answered);
    if (!i.purchase) return false;
    return (!i.review && day >= addDays(dateKeyOf(i.purchase.boughtAt),14)) || (day >= dateKeyOf(i.purchase.boughtAt) && !answered);
  });
}
