import { setMonthlyBudget, addItems, createGoal, decideItem, getToday, recordImpulse, removeImpulse, resetAllData, shiftClock, loadTodayReflections, saveReflection, summarizeItem, decideItemRemote, submitReviewRemote } from '@/data';
import { getState, update } from '@/data/store';
import { applyRemoteItem } from '@/data/actions/remoteItems';
import { simulationDayNumber } from '@/lib/calc/itemMachine';
import { goalProgress } from '@/lib/calc/goal';
import { discountCheck } from '@/lib/calc/discount';
import { hasNotificationWork } from '@/lib/calc/notificationWork';
import { policy } from '@/config/policy';
import { addDays } from '@/lib/date';
import { bobApi } from '@/api';
import { mapCartScreenshot } from '@/ai/real/mappers';
import { reflectionMetrics } from '@/data/actions/reflections';
import { migrate } from '@/data/migrations';
jest.mock('@/api',()=>({bobApi:{simulations:{localQuestion:jest.fn(),summarize:jest.fn()},purchases:{localQuestion:jest.fn(),putReview:jest.fn()},items:{putDecision:jest.fn()}}}));
jest.mock('@/config/env',()=>({env:{aiMode:'real'}}));
const input={name:'키보드',price:20000,category:'digital' as const,reasons:['need' as const],source:'manual' as const};
const progress=(id:string)=>{const s=getState();return goalProgress({goal:s.goals[id],impulses:Object.values(s.impulses),items:Object.values(s.items),policy,budgets:s.budgets,expenses:Object.values(s.expenses),today:getToday()});};
beforeEach(()=>{resetAllData();jest.resetAllMocks();});
it('calendar savings transfer retains the remainder and resisting never credits either goal',()=>{
  const now=jest.spyOn(Date,'now').mockReturnValue(new Date('2026-11-01T03:00:00Z').getTime());
  try {
    setMonthlyBudget({month:'2026-11',income:300000,food:0,living:0,transport:0,saving:0});
    const old=createGoal({name:'목표1',price:100000});
    const event=recordImpulse({label:'참기',amount:70000,decision:'resisted'});
    expect(progress(old.id).saved).toBe(0);
    shiftClock(7);
    const next=createGoal({name:'목표2',price:50000,carriedAmount:50000});
    expect(progress(old.id).saved).toBe(20000);expect(progress(next.id).saved).toBe(50000);
    expect(getState().goals[next.id].achievedAt).toBeTruthy();
    const [item]=addItems([input]);decideItem(item.id,'abandon');
    removeImpulse(event.id);
    expect(progress(old.id).saved).toBe(20000);expect(progress(next.id).saved).toBe(50000);
  } finally {now.mockRestore();}
});
it('transfer OFF preserves calendar savings and reserves already allocated monthly money',()=>{
  const now=jest.spyOn(Date,'now').mockReturnValue(new Date('2026-11-01T03:00:00Z').getTime());
  try {
    setMonthlyBudget({month:'2026-11',income:300000,food:0,living:0,transport:0,saving:0});
    const a=createGoal({name:'A',price:100000});shiftClock(3);
    const b=createGoal({name:'B',price:100000,carriedAmount:30000});
    const c=createGoal({name:'C',price:100000,carriedAmount:30000});
    expect(progress(a.id).saved).toBe(0);expect(progress(b.id).saved).toBe(0);expect(progress(c.id).saved).toBe(30000);
    const d=createGoal({name:'D',price:500000,carriedAmount:0});
    expect(progress(c.id).saved).toBe(30000);expect(progress(d.id).saved).toBe(0);
    shiftClock(27);expect(progress(d.id).saved).toBe(270000);expect(progress(c.id).saved).toBe(30000);
  } finally {now.mockRestore();}
});
it('partial screenshot results survive mapping and ambiguous selection is not silently included',()=>{
  const output=mapCartScreenshot({items:[{name:'치약',price:null,category:'BEAUTY',review_fields:['price']}],review_items:[{name:'필름',price:15900,category:'DIGITAL',review_fields:['selection']}],analysis_method:'vision',warnings:[]});
  expect(output.items).toHaveLength(2);expect(output.items[0].reviewFields).toEqual(['price']);expect(output.items[1].selectionUncertain).toBe(true);
});
it('free shipping advice recomputes discount at the threshold and never claims negative savings',()=>{
  const result=discountCheck({lines:[{name:'물품',price:39000,planned:true}],rule:{minAmount:40000,value:10,unit:'pct',freeShipOn:true,freeShipMin:40000,shipFee:3000}});
  expect(result.payAll).toBe(42000);expect(result.freeShipping?.savedByPayingShip).toBe(0);
});
it('pending registrations are not notification work; dates and server IDs are adopted exactly',()=>{
  const [i]=addItems([input],true);const today=getToday();
  expect(hasNotificationWork([i],[],[],today)).toBe(false);
  applyRemoteItem(i.id,{id:'server',decision:null,purchase:null,simulation:{id:'simulation',duration_days:0,start_date:today,end_date_exclusive:today,observation_dates:[]}});
  expect(getState().items[i.id]).toMatchObject({remoteId:'server',simulationId:'simulation',registrationState:'complete',simulation:{durationDays:0}});
});
it('daily AI questions are frozen locally, response bodies leave the device only for the summary, and BUY/review reuse server IDs',async()=>{
  const [i]=addItems([input]);const start=getToday();
  const server={id:'server',decision:null as string|null,purchase:null as unknown,simulation:{id:'simulation',duration_days:3,start_date:start,end_date_exclusive:addDays(start,3),observation_dates:[start,addDays(start,1),addDays(start,2)]}};
  applyRemoteItem(i.id,server);
  const question=bobApi.simulations.localQuestion as jest.Mock;
  for(let day=0;day<3;day++) {
    const today=getToday();const forecast=day===2;
    question.mockResolvedValueOnce({id:`q${day}`,question_date:today,template_code:forecast?'EXPECTED_USE_DAYS':'RECENT_NEED',question:'질문',answer_spec:forecast?{type:'INTEGER',minimum:0,maximum:30,options:[{code:'UNSURE',label:'모름'}]}:{type:'CHOICE',options:[{code:'YES',label:'네'},{code:'NO',label:'아니요'}]},generation_method:'AI'});
    await loadTodayReflections();await loadTodayReflections();
    saveReflection(`q${day}`,forecast?{number_value:10}:{choice_code:'YES'},forecast?'10일':'네');
    expect(reflectionMetrics(getState().items[i.id]).expected).toBe(forecast?10:null);
    shiftClock(1);
  }
  expect(question).toHaveBeenCalledTimes(3);expect(JSON.stringify(question.mock.calls)).not.toContain('choice_code');
  (bobApi.simulations.summarize as jest.Mock).mockResolvedValue({result:{expected_used_days:10,answer_coverage:1,comparison_eligible:true,comparison_reason:null},ai_summary:{summary:'10일 사용할 계획이에요.',method:'AI'}});
  await summarizeItem(i.id);await summarizeItem(i.id);
  expect(bobApi.simulations.summarize).toHaveBeenCalledTimes(1);expect(getState().items[i.id].summary?.expectedDays).toBe(10);
  (bobApi.items.putDecision as jest.Mock).mockResolvedValue({...server,decision:'BUY',purchase:{id:'purchase',purchased_on:getToday(),review_start:getToday(),review_end:addDays(getToday(),13)}});
  await decideItemRemote(i.id,'buy');expect(getState().items[i.id].purchaseId).toBe('purchase');
  shiftClock(14);(bobApi.purchases.putReview as jest.Mock).mockResolvedValue({});
  await submitReviewRemote(i.id,'sometimes');expect(bobApi.purchases.putReview).toHaveBeenCalledWith('purchase',{frequency:'SOMETIMES'});
});
it('no forecast, unsure or partial observation never qualify as usage evidence',()=>{
  const [i]=addItems([input]);const q={id:'q',itemId:i.id,date:getToday(),phase:'pre' as const,templateCode:'CURRENT_MOOD',text:'기분',kind:'thought_of' as const,variant:'normal' as const,options:[{id:'HAPPY',label:'좋음',countsAsUse:false},{id:'UNSURE',label:'모름',countsAsUse:false}],answerSpec:{type:'CHOICE',options:[{code:'HAPPY',label:'좋음'},{code:'UNSURE',label:'모름'}]}};
  update(s=>({questions:{...s.questions,q}}));saveReflection('q',{choice_code:'HAPPY'},'좋음');
  expect(reflectionMetrics(i)).toMatchObject({expected:null,eligible:false});
});
it('legacy goals stop accumulating after replacement during migration',()=>{
  const a=createGoal({name:'A',price:100000});recordImpulse({label:'참기',amount:30000,decision:'resisted'});shiftClock(1);const b=createGoal({name:'B',price:100000,carriedAmount:0});
  const state=getState();const legacy={...state,goals:{[a.id]:{...state.goals[a.id],allocations:undefined,closedAt:undefined},[b.id]:{...state.goals[b.id],allocations:undefined}}};
  const result=migrate(legacy,2) as typeof state;
  expect(result.goals[a.id].closedAt).toBeTruthy();expect(result.goals[a.id].allocations).toHaveLength(1);
});

it('hold preserves observation gaps and respects the sale deadline',()=>{
  const [i]=addItems([input]);const start=getToday();
  update(st=>({items:{...st.items,[i.id]:{...i,saleEndsAt:addDays(start,12)}}}));
  shiftClock(10);const held=decideItem(i.id,'hold');
  expect(held.simulation.observationDates).toEqual([start,addDays(start,1),addDays(start,2),addDays(start,11),addDays(start,12)]);
  expect(held.simulation.durationDays).toBe(5);
  expect(simulationDayNumber(held,getToday())).toBe(3);
  expect(simulationDayNumber(held,addDays(getToday(),1))).toBe(4);
  shiftClock(3);expect(()=>decideItem(i.id,'hold')).toThrow('판매 마감일');
});
it('post-purchase daily completion suppresses reminders until an outstanding review is due',()=>{
  const [i]=addItems([input]);const bought=decideItem(i.id,'buy');const day=getToday();
  const q={id:'post',itemId:i.id,phase:'post' as const,date:day,text:'질문',kind:'thought_of' as const,variant:'normal' as const,options:[]};
  const a={id:'answer',itemId:i.id,questionId:'post',date:day,at:new Date().toISOString(),optionId:'YES'};
  expect(hasNotificationWork([bought],[q],[],day)).toBe(true);
  expect(hasNotificationWork([bought],[q],[a],day)).toBe(false);
  const later=addDays(day,14);
  expect(hasNotificationWork([bought],[q],[{...a,date:later}],later)).toBe(true);
});
