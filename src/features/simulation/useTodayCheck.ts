/** 오늘의 질문 카드 스택 (시안 "오늘의 질문") — 카드 한 장 = 물건 하나 */
import { useState } from 'react';

import { answerToday } from '@/data';

import { useTodayQuestions } from './useTodayQuestions';

export function useTodayCheck() {
  const live = useTodayQuestions();
  // 화면을 연 순간의 목록으로 고정한다 (답할 때마다 목록이 줄어들어 순서가 흔들리지 않게)
  const [queue] = useState(() => live.entries);
  const [index, setIndex] = useState(0);
  /** 이번에 답한 내용 (완료 화면 요약) */
  const [answered, setAnswered] = useState<{ itemId: string; name: string; label: string }[]>([]);

  return {
    current: queue[index],
    /** 뒤에 깔린 다음 카드 */
    upcoming: queue[index + 1],
    progress: { current: Math.min(index + 1, queue.length), total: queue.length, answered: index },
    done: index >= queue.length,
    /** 선택지 순서: 0 있었어요(→) · 1 딱히 없었어요(←) · 2 잘 모르겠어요(↑) */
    answer: (optionIndex: number) => {
      const entry = queue[index];
      if (!entry) return;
      const option = entry.question.options[optionIndex] ?? entry.question.options[entry.question.options.length - 1];
      answerToday({ itemId: entry.item.id, questionId: entry.question.id, optionId: option.id });
      setAnswered((a) => [...a, { itemId: entry.item.id, name: entry.item.name, label: option.label }]);
      setIndex((i) => i + 1);
    },
    answered,
    /** 결과가 나온 물건 (체크를 끝낸 뒤 안내) */
    resultsReady: live.awaitingDecision,
  };
}
