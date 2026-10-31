/** 기능 1: 시뮬레이션 계산 */
import type { SimulationBand } from '@/config/policy';
import type { DailyAnswer, Item, Question } from '@/types';
import { addDays } from '@/lib/date';

import { simulationStartDay } from './itemMachine';

/** 가격에 따른 시뮬레이션 일수 */
export function simulationDays(price: number, bands: SimulationBand[]): number {
  const band = bands.find((b) => price <= b.maxPrice) ?? bands[bands.length - 1];
  return band.days;
}

/** 시뮬레이션 기간에 속한 날짜 키 목록 */
export function simulationDayKeys(item: Item): string[] {
  if (item.simulation.observationDates) return item.simulation.observationDates;
  const start = simulationStartDay(item);
  return Array.from({ length: item.simulation.durationDays }, (_, i) => addDays(start, i));
}

/**
 * 오늘 물을 질문을 고른다. 이미 답했거나 기간 밖이면 null.
 * 날짜마다 질문을 돌아가며 묻고, 강조 대상이면 재질문(recheck) 목록에서 고른다.
 */
export function pickTodayQuestion(params: {
  item: Item;
  questions: Question[];
  answers: DailyAnswer[];
  today: string;
  emphasize: boolean;
}): Question | null {
  const { item, questions, answers, today, emphasize } = params;
  const dayIndex = simulationDayKeys(item).indexOf(today);
  if (dayIndex < 0 || dayIndex >= item.simulation.durationDays) return null;
  if (answers.some((a) => a.itemId === item.id && a.date === today)) return null;

  const normal = questions.filter((q) => q.variant === 'normal');
  const recheck = questions.filter((q) => q.variant === 'recheck');
  const pool = emphasize && recheck.length > 0 ? recheck : normal.length > 0 ? normal : questions;
  if (pool.length === 0) return null;
  return pool[dayIndex % pool.length];
}

export type UsageSummary = {
  totalDays: number;
  /** 오늘까지 지난 날(오늘 포함, 기간 내) */
  elapsedDays: number;
  answeredDays: number;
  /** "썼다"로 답한 날 */
  usedDays: number;
  /** 지난 날 중 답하지 않은 날 (오늘은 아직 답할 수 있으므로 제외) */
  unansweredDays: number;
  /** 선택지 라벨별 응답 수 (결과 요약 문구용, 예: "잘 모르겠어요" 3일) */
  answersByLabel: Record<string, number>;
};

export function usageSummary(params: {
  item: Item;
  questions: Question[];
  answers: DailyAnswer[];
  today: string;
}): UsageSummary {
  const { item, questions, answers, today } = params;
  const days = simulationDayKeys(item);
  const inWindow = new Set(days);
  const optionById = new Map(questions.flatMap((q) => q.options.map((o) => [o.id, o] as const)));

  const mine = answers.filter((a) => a.itemId === item.id && inWindow.has(a.date));
  const byDate = new Map(mine.map((a) => [a.date, a]));

  const elapsedDays = days.filter((d) => d <= today).length;
  const pastDays = days.filter((d) => d < today);
  const unansweredDays = pastDays.filter((d) => !byDate.has(d)).length;

  const answersByLabel: Record<string, number> = {};
  let usedDays = 0;
  for (const a of byDate.values()) {
    const option = optionById.get(a.optionId);
    if (option?.countsAsUse) usedDays += 1;
    const label = option?.label ?? '?';
    answersByLabel[label] = (answersByLabel[label] ?? 0) + 1;
  }

  return {
    totalDays: item.simulation.durationDays,
    elapsedDays,
    answeredDays: byDate.size,
    usedDays,
    unansweredDays,
    answersByLabel,
  };
}

/** "실제로 샀다면 1회당 N원". 사용한 날이 없으면 null */
export const costPerUse = (price: number, usedDays: number) =>
  usedDays > 0 ? Math.round(price / usedDays) : null;

/** 시뮬레이션에서 예측한 사용 비율 (사용일 ÷ 기간) */
export const predictedUseRate = (summary: Pick<UsageSummary, 'usedDays' | 'totalDays'>) =>
  summary.totalDays > 0 ? summary.usedDays / summary.totalDays : 0;
