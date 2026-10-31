/**
 * 물품 상태 전이 규칙 — 전이를 바꿀 때는 이 파일만 고친다.
 *
 * 저장 상태: simulating | bought | abandoned
 * 화면 단계(phase)는 저장 상태 + 날짜로 계산한다.
 * 결정: Buy(살게요) · Bye(안 살래요) · 보류(조금 더 지켜볼게요 → 기간을 policy.holdDays만큼 연장)
 */
import type { Policy } from '@/config/policy';
import type { Item, ItemStatus } from '@/types';
import { addDays, dateKeyOf, diffDays } from '@/lib/date';

export type ItemPhase =
  | 'simulating' // 시뮬레이션 진행 중
  | 'awaitingDecision' // 기간 끝, 결과 도착 — Buy/Bye/보류 결정 대기
  | 'bought' // 구매함, 점검 시점 전
  | 'awaitingReview' // 구매 후 점검 대기
  | 'reviewed' // 점검 완료
  | 'abandoned'; // Bye

export type ItemAction = 'buy' | 'hold' | 'abandon' | 'review';
export type DecisionAction = Exclude<ItemAction, 'review'>;

/** 시뮬레이션 첫날 (로컬 날짜 키) */
export const simulationStartDay = (item: Item) => dateKeyOf(item.simulation.startAt);
/** 시뮬레이션 마지막 날 다음 날 = 결정 가능일 */
export const simulationEndDay = (item: Item) => addDays(simulationStartDay(item), item.simulation.durationDays);
/** 오늘이 시뮬레이션 며칠째인지 (첫날 1) */
export const simulationDayNumber = (item: Item, today: string) => diffDays(simulationStartDay(item), today) + 1;
/** 결정 가능일까지 남은 일수 (오늘 포함하지 않음, 0이면 결과 도착) */
export const daysLeft = (item: Item, today: string) => Math.max(0, diffDays(today, simulationEndDay(item)));
/** 구매 후 점검 가능일 */
export const reviewDueDay = (item: Item, policy: Pick<Policy, 'reviewAfterDays'>) =>
  item.purchase ? addDays(dateKeyOf(item.purchase.boughtAt), policy.reviewAfterDays) : null;

export function derivePhase(item: Item, today: string, policy: Pick<Policy, 'reviewAfterDays'>): ItemPhase {
  switch (item.status) {
    case 'simulating':
      return today >= simulationEndDay(item) ? 'awaitingDecision' : 'simulating';
    case 'abandoned':
      return 'abandoned';
    case 'bought': {
      if (item.review) return 'reviewed';
      const due = reviewDueDay(item, policy);
      return due && today >= due ? 'awaitingReview' : 'bought';
    }
  }
}

/** 단계별로 가능한 행동 */
const ACTIONS: Record<ItemPhase, ItemAction[]> = {
  // 진행 중에도 구매하거나 포기할 수 있다
  simulating: ['buy', 'abandon'],
  awaitingDecision: ['buy', 'abandon', 'hold'],
  bought: [],
  awaitingReview: ['review'],
  // 점검 답은 고칠 수 있다 (명세서 4.7: 선택 즉시 갱신)
  reviewed: ['review'],
  abandoned: [],
};

export const availableActions = (phase: ItemPhase): ItemAction[] => ACTIONS[phase];

export const canPerform = (phase: ItemPhase, action: ItemAction) => ACTIONS[phase].includes(action);

/** 결정 후 저장 상태 (보류는 시뮬레이션을 이어간다) */
export const NEXT_STATUS: Record<DecisionAction, ItemStatus> = {
  buy: 'bought',
  abandon: 'abandoned',
  hold: 'simulating',
};
