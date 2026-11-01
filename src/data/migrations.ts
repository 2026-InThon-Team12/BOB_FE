/**
 * 저장 데이터 스키마 버전과 마이그레이션.
 *
 * 데이터 구조(schema.ts / types)를 바꾸면:
 *   1. CURRENT_VERSION을 1 올린다.
 *   2. MIGRATIONS[이전 버전]에 이전 → 새 구조 변환 함수를 추가한다.
 *   3. __tests__/migrations.test.ts에 이전 버전 샘플을 추가한다.
 */

import { GoalSchema, ImpulseEventSchema, ItemSchema, ExpenseSchema } from '@/types';
import { newFunding } from '@/lib/calc/funding';
import { toDateKey } from '@/lib/date';

export const CURRENT_VERSION = 5;

type Migration = (state: Record<string, unknown>) => Record<string, unknown>;

/** key: 이 버전에서 다음 버전으로 올리는 함수 */
const MIGRATIONS: Record<number, Migration> = {
  // Server review evidence and explicit developer previews are optional additions.
  4: (s) => s,
  3: (s) => {
    const today = toDateKey(new Date());
    const expenses = Object.values((s.expenses ?? {}) as Record<string, unknown>)
      .flatMap(e => { const result = ExpenseSchema.safeParse(e); return result.success ? [result.data] : []; });
    const goals = Object.entries((s.goals ?? {}) as Record<string, unknown>).map(([id, value]) => {
      const result = GoalSchema.safeParse(value);
      if (!result.success || !result.data.isActive || result.data.achievedAt || result.data.funding) return [id, value];
      return [id, { ...result.data, funding: newFunding(today, expenses) }];
    });
    return { ...s, goals: Object.fromEntries(goals) };
  },
  // Goal.productUrl은 선택 필드라 기존 목표 데이터는 그대로 유효하다.
  1: (s) => s,
  // New fields are optional. Preserve old answers and balances; old records without
  // a valid forecast are intentionally excluded from prediction comparisons.
  2: (s) => {
    if (!s.goals || !s.impulses || !s.items) return s;
    const goals = Object.values(s.goals as Record<string,unknown>).map(g=>GoalSchema.safeParse(g));
    const impulses = Object.values(s.impulses as Record<string,unknown>).map(e=>ImpulseEventSchema.safeParse(e));
    const items = Object.values(s.items as Record<string,unknown>).map(i=>ItemSchema.safeParse(i));
    if (goals.some(g=>!g.success) || impulses.some(e=>!e.success) || items.some(i=>!i.success)) return s;
    const ordered = goals.flatMap(g=>g.success ? [g.data]:[]).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
    for (let index=0;index<ordered.length;index++) {
      const goal=ordered[index], next=ordered[index+1];
      const end=goal.closedAt ?? next?.createdAt;
      const own = [
        ...impulses.flatMap(e=>e.success && e.data.goalId===goal.id && e.data.decision==='resisted' ? [{sourceId:`impulse:${e.data.id}`,amount:e.data.amount}]:[]),
        ...items.flatMap(i=>i.success && i.data.status==='abandoned' && i.data.decidedAt && i.data.decidedAt>=goal.createdAt && (!end || i.data.decidedAt<end) && (!goal.achievedAt || i.data.decidedAt<=goal.achievedAt) ? [{sourceId:`item:${i.data.id}`,amount:i.data.price}]:[]),
      ];
      const previous=ordered[index-1];
      const transferred: {sourceId:string;amount:number}[]=[];
      let remaining=goal.carriedAmount ?? 0;
      if (previous?.allocations && !previous.achievedAt) previous.allocations=previous.allocations.map(row=>{
        const amount=Math.min(remaining,row.amount);remaining-=amount;
        if(amount)transferred.push({...row,amount});
        return {...row,amount:row.amount-amount};
      }).filter(row=>row.amount>0);
      // Preserve legacy balances with no recoverable origin; do not invent a new event.
      if(remaining && !previous?.achievedAt)transferred.push({sourceId:`legacy:${goal.id}`,amount:remaining});
      goal.allocations=[...transferred,...own];
      goal.carriedAmount=undefined;
      if(!goal.isActive)goal.closedAt=end ?? goal.achievedAt ?? goal.createdAt;
    }
    return {...s,goals:Object.fromEntries(ordered.map(g=>[g.id,g]))};
  },
};

export class MigrationError extends Error {}

export function migrate(persisted: unknown, fromVersion: number): unknown {
  if (fromVersion > CURRENT_VERSION) {
    throw new MigrationError(`저장 데이터 버전(${fromVersion})이 앱(${CURRENT_VERSION})보다 높아요.`);
  }
  let state = persisted as Record<string, unknown>;
  for (let v = fromVersion; v < CURRENT_VERSION; v += 1) {
    const step = MIGRATIONS[v];
    if (!step) throw new MigrationError(`버전 ${v} → ${v + 1} 마이그레이션이 없어요.`);
    state = step(state);
  }
  return state;
}
