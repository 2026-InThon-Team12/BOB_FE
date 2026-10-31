/** 오늘 답할 질문 목록 (오늘의 질문 화면 · 홈 배너 · 알림 공용) */
import { useMemo } from 'react';

import { policy } from '@/config/policy';
import { CATEGORY_LABELS } from '@/constants/categories';
import { useAnswers, useItems, useQuestions, useToday, reflectionDue } from '@/data';
import { isSwipeQuestion } from '@/lib/reflection';
import {
  categoryTendency,
  derivePhase,
  questionText,
  simulationDayNumber,
} from '@/lib/calc';
import type { Item, Question } from '@/types';

export type TodayEntry = {
  item: Item;
  question: Question;
  /** 물품 이름이 채워진 질문 문구 */
  text: string;
  categoryLabel: string;
  day: number;
  totalDays: number;
  /** 과대예측 분야 재질문 (분야 평균 배수) */
  emphasis: { ratio: number } | null;
};

export function useTodayQuestions() {
  const items = useItems();
  const questions = useQuestions();
  const answers = useAnswers();
  const today = useToday();

  return useMemo(() => {
    const tendencies = categoryTendency({ items, questions, answers, policy });
    const entries: TodayEntry[] = [];
    const awaitingDecision: Item[] = [];
    let dueCount = 0;

    // 먼저 등록한 물건부터 묻는다
    for (const item of [...items].reverse()) {
      const phase = derivePhase(item, today, policy);
      if (phase === 'awaitingDecision') awaitingDecision.push(item);
      if (!reflectionDue(item, today)) continue;
      const itemQuestions = questions.filter((q) => q.itemId === item.id);
      const daily = itemQuestions.find(q => q.date === today && q.phase === (item.status === 'bought' ? 'post' : 'pre'));
      const answered = answers.some(a => a.itemId === item.id && a.date === today && (questions.find(q => q.id === a.questionId)?.phase ?? 'pre') === (item.status === 'bought' ? 'post':'pre'));
      if (!answered) dueCount++;
      const question = answered || !daily || !isSwipeQuestion(daily) ? null : daily;
      if (!question) continue;

      const t = tendencies.find((x) => x.category === item.category);
      entries.push({
        item,
        question,
        text: questionText(question, item.name),
        categoryLabel: CATEGORY_LABELS[item.category],
        day: simulationDayNumber(item, today),
        totalDays: item.simulation.durationDays,
        emphasis: t && t.samples >= policy.emphasis.minSamples && t.ratio >= policy.emphasis.overPredictionRatio ? {ratio:t.ratio} : null,
      });
    }
    return { entries, awaitingDecision, dueCount };
  }, [items, questions, answers, today]);
}
