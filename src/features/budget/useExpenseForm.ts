/** 등록 안 하고 쓴 돈 기록 (자유 소비에서 빠진다) */
import { useState } from 'react';

import { addExpense } from '@/data';

export function useExpenseForm() {
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    label: submitted && !label.trim(),
    amount: submitted && !(amount && amount > 0),
  };

  const submit = (): boolean => {
    setSubmitted(true);
    if (!label.trim() || !amount || amount <= 0) return false;
    addExpense({ label, amount, bucket: 'discretionary' });
    return true;
  };

  return { label, amount, setLabel, setAmount, errors, submit };
}
