/** 기능 6: 구매 유발 원인 패턴 */
import { REASON_IDS, type Item, type ReasonId } from '@/types';

export type ReasonStat = {
  reason: ReasonId;
  total: number;
  bought: number;
  abandoned: number;
  /** 아직 시뮬레이션 중 */
  pending: number;
  /** 결정한 것 중 포기 비율 (결정한 게 없으면 null) */
  abandonRate: number | null;
};

/** 이유별 결과. 이유를 여러 개 고른 물품은 각 이유에 모두 센다 */
export function reasonStats(items: Item[]): ReasonStat[] {
  return REASON_IDS.map((reason) => {
    const list = items.filter((i) => i.reasons.includes(reason));
    const count = (s: Item['status']) => list.filter((i) => i.status === s).length;
    const bought = count('bought');
    const abandoned = count('abandoned');
    const decided = bought + abandoned;
    return {
      reason,
      total: list.length,
      bought,
      abandoned,
      pending: count('simulating'),
      abandonRate: decided > 0 ? abandoned / decided : null,
    };
  }).filter((s) => s.total > 0);
}

/** 리포트 문구용: 결정 표본이 minDecided 이상인 이유 중 포기 비율이 가장 높은 것 */
export function topAbandonReason(stats: ReasonStat[], minDecided = 2): ReasonStat | null {
  const candidates = stats.filter(
    (s) => s.abandonRate !== null && s.bought + s.abandoned >= minDecided,
  );
  if (candidates.length === 0) return null;
  return candidates.reduce((a, b) => ((b.abandonRate ?? 0) > (a.abandonRate ?? 0) ? b : a));
}
