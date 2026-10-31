/** 구매 후 점검 평가 · 리포트 (기능 2·6, 시안 "구매 후 점검" · "리포트") */
import type { ImpulseEvent, Item } from '@/types';
import { monthKeyOf } from '@/lib/date';

/**
 * 예측 대비 실제 사용 평가 (배수 = 예측 비율 ÷ 실제 비율)
 * - muchLess: 훨씬 덜 씀 (fraction: "예상의 N분의 1")
 * - less: 조금 덜 씀 · same: 거의 같음 · more: 더 많이 씀 · never: 한 번도 안 씀
 */
export type Verdict =
  | { kind: 'never' }
  | { kind: 'muchLess'; fraction: number }
  | { kind: 'less' }
  | { kind: 'same' }
  | { kind: 'more' };

export const VERDICT_RATIO = { muchLess: 1.5, less: 1.15, more: 0.85 } as const;

export function predictionVerdict(ratio: number, actualDays: number): Verdict {
  if (actualDays <= 0) return { kind: 'never' };
  if (ratio >= VERDICT_RATIO.muchLess) return { kind: 'muchLess', fraction: Math.max(2, Math.round(ratio)) };
  if (ratio >= VERDICT_RATIO.less) return { kind: 'less' };
  if (ratio > VERDICT_RATIO.more) return { kind: 'same' };
  return { kind: 'more' };
}

/**
 * 리포트 분야 배지 (명세서 4.12): ≥ 2배 주황 "N배 과대예측" · 1.3–2배 중립 "N배" · < 1.3배 파랑 "거의 정확"
 */
export type TendencyBadge = { kind: 'over' | 'slight'; ratio: number } | { kind: 'accurate' };
export const BADGE_RATIO = { over: 2, slight: 1.3 } as const;

export function tendencyBadge(ratio: number): TendencyBadge {
  if (!Number.isFinite(ratio) || ratio >= BADGE_RATIO.over) return { kind: 'over', ratio };
  if (ratio >= BADGE_RATIO.slight) return { kind: 'slight', ratio };
  return { kind: 'accurate' };
}

export type MonthlySummary = {
  /** 이번 달 등록한 물건 */
  registered: number;
  /** 이번 달 Bye 한 물건 */
  byeCount: number;
  /** 지킨 돈 = 이번 달 Bye 한 물건 가격 + 이번 달 참은 금액 */
  savedMoney: number;
};

export function monthlySummary(params: { items: Item[]; impulses: ImpulseEvent[]; month: string }): MonthlySummary {
  const { items, impulses, month } = params;
  const inMonth = (iso: string | undefined) => !!iso && monthKeyOf(iso) === month;
  const byes = items.filter((i) => i.status === 'abandoned' && inMonth(i.decidedAt));
  const resisted = impulses.filter((e) => e.decision === 'resisted' && inMonth(e.at));
  return {
    registered: items.filter((i) => inMonth(i.createdAt)).length,
    byeCount: byes.length,
    savedMoney: byes.reduce((s, i) => s + i.price, 0) + resisted.reduce((s, e) => s + e.amount, 0),
  };
}
