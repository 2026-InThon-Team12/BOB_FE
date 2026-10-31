import { monthKeyOf } from '@/lib/date';
import type { Expense } from '@/types';

export type OutsideSpendingKind = 'claw' | 'lateFood' | 'cafe';

/** A possible trigger inferred from the record's name, not a judgement about the purchase. */
export function outsideSpendingKind(label: string): OutsideSpendingKind | null {
  const text = label.normalize('NFKC').replace(/\s+/g, '').toLowerCase();
  if (/인형뽑기|뽑기방|가챠/.test(text)) return 'claw';
  if (/야식|밤참|배달음식/.test(text)) return 'lateFood';
  if (/카페|커피/.test(text) && !/커피머신|커피메이커|커피잔|커피컵|카페트|카페인/.test(text)) return 'cafe';
  return null;
}

export function monthlyOutsideSpending(expenses: Expense[], month: string) {
  const rows = expenses.flatMap(expense => {
    if (expense.source !== 'manual' || monthKeyOf(expense.at) !== month) return [];
    const kind = outsideSpendingKind(expense.label);
    return kind ? [{...expense, kind}] : [];
  });
  return {count: rows.length, amount: rows.reduce((sum, row) => sum + row.amount, 0)};
}
