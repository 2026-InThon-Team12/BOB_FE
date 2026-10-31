import { monthlyOutsideSpending, outsideSpendingKind } from '../outsideSpending';
import type { Expense } from '@/types';

const expense = (id: string, label: string, patch: Partial<Expense> = {}): Expense => ({id, label, amount:1000, bucket:'food', source:'manual', at:'2026-11-01T12:00:00+09:00', ...patch});

it.each(['인형 뽑기', '가챠', '야식 포장', '밤참', '배달 음식', '카페', '커피'])('recognizes approved record names: %s', label => {
  expect(outsideSpendingKind(label)).not.toBeNull();
});
it.each(['식비', '포장', '점심', '교통비', '커피머신', '카페트'])('does not infer an impulsive expense from %s', label => {
  expect(outsideSpendingKind(label)).toBeNull();
});
it('counts only manual records in the selected Seoul month; edits and deletions recompute', () => {
  const rows = [expense('1','야식 포장'), expense('2','인형뽑기',{amount:8000}), expense('3','카페',{source:'impulse'}), expense('4','커피',{source:'item'}), expense('5','커피',{at:'2026-10-31T14:59:00Z'}), expense('6','점심')];
  expect(monthlyOutsideSpending(rows, '2026-11')).toEqual({count:2,amount:9000});
  expect(monthlyOutsideSpending(rows.slice(1), '2026-11')).toEqual({count:1,amount:8000});
  expect(monthlyOutsideSpending(rows.map(r => r.id === '2' ? {...r,label:'생활용품'} : r), '2026-11')).toEqual({count:1,amount:1000});
  expect(monthlyOutsideSpending([expense('7','커피',{at:'2026-10-31T15:00:00Z'})], '2026-11').count).toBe(1);
});
