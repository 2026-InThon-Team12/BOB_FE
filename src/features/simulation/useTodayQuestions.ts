/** 오늘 답할 질문 목록 (오늘의 질문 화면 · 홈 배너 · 알림 공용) */
import { useMemo } from 'react';

import { policy } from '@/config/policy';
import { CATEGORY_LABELS } from '@/constants/categories';
import { useAnswers, useItems, useQuestions, useToday } from '@/data';
import {
  categoryTendency,
  derivePhase,
  pickTodayQuestion,
  questionText,
  shouldEmphasize,
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

    // 먼저 등록한 물건부터 묻는다
    for (const item of [...items].reverse()) {
      const phase = derivePhase(item, today, policy);
      if (phase === 'awaitingDecision') awaitingDecision.push(item);
      if (phase !== 'simulating') continue;

      const itemQuestions = questions.filter((q) => q.itemId === item.id);
      const emphasize = shouldEmphasize(item.category, tendencies, policy.emphasis);
      const question = pickTodayQuestion({ item, questions: itemQuestions, answers, today, emphasize });
      if (!question) continue;

      const t = tendencies.find((x) => x.category === item.category);
      entries.push({
        item,
        question,
        text: questionText(question, item.name),
        categoryLabel: CATEGORY_LABELS[item.category],
        day: simulationDayNumber(item, today),
        totalDays: item.simulation.durationDays,
        emphasis: emphasize && t ? { ratio: t.ratio } : null,
      });
    }
    return { entries, awaitingDecision };
  }, [items, questions, answers, today]);
}
