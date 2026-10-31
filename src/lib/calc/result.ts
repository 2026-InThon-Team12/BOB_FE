/** 시뮬레이션 결과 화면 (시안 "시뮬레이션 결과"): 날짜별 칸, 응답 요약, 구매 이유 경고 */
import type { DailyAnswer, Item, Question, ReasonId } from '@/types';

import type { ReasonStat } from './reasons';
import { simulationDayKeys } from './simulation';
import { isSwipeQuestion } from '@/lib/reflection';

/**
 * yes: 있었어요 · no: 딱히 없었어요 · unsure: 잘 모르겠어요
 * missed: 지난 날인데 답하지 않음 · pending: 오늘 또는 앞으로 남은 날
 */
export type DayState = 'yes' | 'no' | 'unsure' | 'missed' | 'pending';
export type DayCell = { date: string; state: DayState };

/**
 * 선택지 순서는 스와이프 방향(→ ← ↑)과 같다: 0 있었어요 · 1 딱히 없었어요 · 2 잘 모르겠어요.
 * "사용"인지는 countsAsUse로 판단하고, 나머지는 위치로 구분한다.
 */
export function dayCells(params: { item: Item; questions: Question[]; answers: DailyAnswer[]; today: string }): DayCell[] {
  const { item, questions, answers, today } = params;
  const byQuestion = new Map(questions.filter(q=>q.phase !== 'post').map(q=>[q.id,q]));
  const byDate = new Map(answers.filter((a) => a.itemId === item.id && byQuestion.has(a.questionId)).map((a) => [a.date, a]));

  return simulationDayKeys(item).map((date) => {
    const a = byDate.get(date);
    if (!a) return { date, state: date < today ? 'missed' : 'pending' };
    const q = byQuestion.get(a.questionId)!;
    if (isSwipeQuestion(q)) {
      const code = a.value?.choice_code ?? a.optionId;
      return {date,state:code === 'YES' ? 'yes' : code === 'NO' ? 'no' : 'unsure'};
    }
    const index = q.options.findIndex(o=>o.id===a.optionId);
    const o = q.options[index];
    if (!o) return { date, state: 'unsure' };
    if (o.countsAsUse) return { date, state: 'yes' };
    return { date, state: index === 1 ? 'no' : 'unsure' };
  });
}

export const countStates = (cells: DayCell[]) =>
  cells.reduce<Record<DayState, number>>(
    (acc, c) => ({ ...acc, [c.state]: acc[c.state] + 1 }),
    { yes: 0, no: 0, unsure: 0, missed: 0, pending: 0 },
  );

/** 응답 요약 문장 재료 (문구는 copy.result.summary) — 중요한 순서로 최대 2개 */
export type SummaryNote =
  | { kind: 'neverNeeded' }
  | { kind: 'frontLoaded'; days: number }
  | { kind: 'backLoaded'; days: number }
  | { kind: 'steady' }
  /** 뚜렷한 패턴이 없을 때 기본 요약 */
  | { kind: 'mixed'; yes: number; no: number }
  | { kind: 'mostlyUnsure'; count: number }
  | { kind: 'missed'; count: number };

export function summaryNotes(cells: DayCell[]): SummaryNote[] {
  const n = countStates(cells);
  const answered = n.yes + n.no + n.unsure;
  const notes: SummaryNote[] = [];
  if (answered === 0) return n.missed > 0 ? [{ kind: 'missed', count: n.missed }] : [];

  const yesIdx = cells.flatMap((c, i) => (c.state === 'yes' ? [i] : []));
  const half = Math.ceil(cells.length / 2);

  if (n.yes === 0) notes.push({ kind: 'neverNeeded' });
  else if (n.yes / answered >= 0.6) notes.push({ kind: 'steady' });
  else if (yesIdx[yesIdx.length - 1] < half && cells.slice(yesIdx[yesIdx.length - 1] + 1).some((c) => c.state === 'no'))
    notes.push({ kind: 'frontLoaded', days: yesIdx[yesIdx.length - 1] + 1 });
  else if (yesIdx[0] >= half) notes.push({ kind: 'backLoaded', days: cells.length - yesIdx[0] });
  else notes.push({ kind: 'mixed', yes: n.yes, no: n.no });

  if (n.unsure >= Math.max(2, Math.ceil(answered / 3))) notes.push({ kind: 'mostlyUnsure', count: n.unsure });
  if (n.missed > 0) notes.push({ kind: 'missed', count: n.missed });
  return notes.slice(0, 2);
}

/**
 * 이 물건의 구매 이유 중 지금까지 포기율이 높았던 이유 (시안 "할인·한정 판매로 등록한 물건은 78%를 포기했어요").
 * 결정 표본 minDecided 이상, 포기율 minRate 이상일 때만.
 */
export function reasonWarning(
  item: Item,
  stats: ReasonStat[],
  { minDecided = 2, minRate = 0.5 } = {},
): { reason: ReasonId; abandonRate: number } | null {
  const candidates = stats.filter(
    (s) =>
      item.reasons.includes(s.reason) &&
      s.bought + s.abandoned >= minDecided &&
      s.abandonRate !== null &&
      s.abandonRate >= minRate,
  );
  if (candidates.length === 0) return null;
  const top = candidates.reduce((a, b) => ((b.abandonRate ?? 0) > (a.abandonRate ?? 0) ? b : a));
  return { reason: top.reason, abandonRate: top.abandonRate ?? 0 };
}
