/** 홈 (명세서 4.1 Main): 오늘 할 일(저녁 질문 · 결과 도착 · 구매 후 점검)과 목표 진행 */
import { useMemo } from 'react';

import { policy } from '@/config/policy';
import { CATEGORY_LABELS } from '@/constants/categories';
import { useAnswers, useItems, useQuestions, useToday } from '@/data';
import { derivePhase, simulationDayNumber } from '@/lib/calc';
import type { Item } from '@/types';

import { useGoalOverview } from '../goal/useGoalOverview';
import { useTodayQuestions } from '../simulation/useTodayQuestions';

export type SimRow = {
  item: Item;
  categoryLabel: string;
  resultReady: boolean;
  day: number;
  total: number;
  ratio: number;
};

export function useHome() {
  const items = useItems();
  const today = useToday();
  const questions = useTodayQuestions();
  const records = useQuestions(), answers = useAnswers();
  const goal = useGoalOverview();

  const { simulating, reviewDue } = useMemo(() => {
    const rows: SimRow[] = [];
    let review: Item | undefined;
    for (const item of items) {
      const phase = derivePhase(item, today, policy);
      const answeredPost = answers.some(a => a.itemId === item.id && a.date === today && records.some(q => q.id === a.questionId && q.phase === 'post'));
      if (phase === 'awaitingReview' && !review && !answeredPost) review = item;
      if (phase !== 'simulating' && phase !== 'awaitingDecision') continue;
      const total = item.simulation.durationDays;
      const day = Math.min(total, Math.max(0, simulationDayNumber(item, today)));
      rows.push({
        item,
        categoryLabel: CATEGORY_LABELS[item.category],
        resultReady: phase === 'awaitingDecision',
        day,
        total,
        ratio: total ? day / total : 1,
      });
    }
    // 결과 도착이 먼저, 그다음 먼저 등록한 순
    rows.sort((a, b) => Number(b.resultReady) - Number(a.resultReady) || a.item.createdAt.localeCompare(b.item.createdAt));
    return { simulating: rows, reviewDue: review };
  }, [items, today, answers, records]);

  return {
    /** 오늘 답할 품목 수 (0이면 오늘 답변 완료 또는 시뮬레이션 없음) */
    todayCount: questions.dueCount,
    /** 시뮬레이션 중인 물건이 있지만 오늘 질문은 다 답함 */
    todayDone: questions.dueCount === 0 && simulating.some((r) => !r.resultReady && r.day > 0),
    goal,
    reviewDue,
    simulating,
  };
}
