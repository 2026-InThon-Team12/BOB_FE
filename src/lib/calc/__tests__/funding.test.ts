import { fundingPlan, newFunding } from '../funding';
import { migrate } from '@/data/migrations';
import { addDays, daysInMonth } from '@/lib/date';
import type { Goal, Expense } from '@/types';
const budget = (month: string, income: number) => ({month,income,food:0,living:0,transport:0,saving:0});
const expense = (on:string,amount:number): Expense => ({id:on,label:'구매',amount,at:`${on}T12:00:00+09:00`,source:'item',bucket:'food'});
const goal = (on:string, price=1_000_000, expenses: Expense[]=[]): Goal => ({id:'g',name:'목표',price,isActive:true,createdAt:`${on}T12:00:00+09:00`,funding:newFunding(on,expenses)});
it.each(['2027-02','2028-02','2026-11','2026-12'])('conserves all money across %s and does not credit the incomplete day',month=>{
  const days=daysInMonth(month),g=goal(`${month}-01`),budgets={[month]:budget(month,days*1000)};
  expect(fundingPlan(g,budgets,[],`${month}-01`).saved).toBe(0);
  expect(fundingPlan(g,budgets,[],addDays(`${month}-01`,days)).saved).toBe(days*1000);
  expect(fundingPlan(g,budgets,[],addDays(`${month}-01`,days-1)).saved).toBe((days-1)*1000);
});
it('starts with remaining funds over remaining days and sends an unaffordable target to next month',()=>{
  const es=[expense('2026-11-01',210000)],g=goal('2026-11-16',200000,es),budgets={'2026-11':budget('2026-11',300000)};
  const plan=fundingPlan(g,budgets,es,'2026-11-16');
  expect(plan.dailySaving).toBe(6000);expect(plan.saved).toBe(0);expect(plan.eta!.startsWith('2026-12')).toBe(true);
  expect(fundingPlan(g,budgets,es,'2026-11-17').saved).toBe(6000);
});
it('spending reduces unallocated funds first, then the accrued gauge; repeating reads never credits twice',()=>{
  const g=goal('2026-11-01'),b={'2026-11':budget('2026-11',300000)};
  const before=fundingPlan(g,b,[],'2026-11-16');expect(before.saved).toBe(150000);
  const after=fundingPlan(g,b,[expense('2026-11-16',200000)],'2026-11-16');
  expect(after.saved).toBe(100000);expect(after.dailySaving).toBeNull();
  expect(fundingPlan(g,b,[expense('2026-11-16',200000)],'2026-11-16')).toEqual(after);
  expect(after.eta! > before.eta!).toBe(true);
});
it('missing and nonpositive budgets cannot predict a date',()=>{
  const g=goal('2026-11-01');expect(fundingPlan(g,{},[],'2026-11-03').eta).toBeNull();
  expect(fundingPlan(g,{'2026-11':budget('2026-11',0)},[],'2026-11-03').dailySaving).toBeNull();
});
it('migration preserves behavioral records and the shelf, restarting only active unfinished estimates',()=>{
  const active={...goal('2026-10-01'),funding:undefined};
  const achieved={...active,id:'done',isActive:false,achievedAt:'2026-10-10T12:00:00+09:00'};
  const state={goals:{g:active,done:achieved},impulses:{i:{amount:100000}},items:{},expenses:{}};
  const migrated=migrate(state,3) as {goals:Record<string,Goal>;impulses:unknown};
  expect(migrated.goals.g.funding?.openingBalance).toBe(0);
  expect(migrated.impulses).toEqual(state.impulses);expect(migrated.goals.done).toEqual(achieved);
});
