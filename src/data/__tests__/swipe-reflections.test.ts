import AsyncStorage from '@react-native-async-storage/async-storage';
import { bobApi } from '@/api';
import { addItems, getToday, loadTodayReflections, resetAllData, saveReflection, summarizeItem, shiftClock } from '@/data';
import { reflectionDue } from '@/data/actions/reflections';
import { hasNotificationWork } from '@/lib/calc/notificationWork';
import { getState, update } from '@/data/store';
import { applyRemoteItem } from '@/data/actions/remoteItems';
import { addDays } from '@/lib/date';
import { isSwipeQuestion, reflectionCounts, swipeAnswer } from '@/lib/reflection';
import { chooseSwipeQuestion } from '@/lib/swipeQuestions';
import { SWIPE_ANSWER_SPEC, swipePreCatalog } from '@/constants/swipeQuestionCatalog';
import { QuestionSchema, type Item, type Question } from '@/types';

jest.mock('@/api',()=>({bobApi:{simulations:{localQuestion:jest.fn(),summarize:jest.fn()},purchases:{localQuestion:jest.fn()}}}));
jest.mock('@/config/env',()=>({env:{aiMode:'real',demo:true}}));
const input = {name:'요가매트',price:20000,category:'hobby' as const,reasons:['need' as const],source:'manual' as const};
beforeEach(()=>{resetAllData();jest.resetAllMocks();});
function setup(): Item {
  const [item] = addItems([input]);
  return applyRemoteItem(item.id,{id:'server',decision:null,purchase:null,simulation:{id:'simulation',duration_days:3,start_date:getToday(),end_date_exclusive:addDays(getToday(),3),observation_dates:[getToday(),addDays(getToday(),1),addDays(getToday(),2)]}});
}
function dto() {
  return {id:'server-question',question_date:getToday(),template_code:'SW_PRE_NEED',template_version:'swipe-v2',wording_version:'short-v1',question:'요가매트가 없어서 최근 스트레칭에 불편을 느낀 적이 있나요?',answer_spec:SWIPE_ANSWER_SPEC,generation_method:'AI'};
}
function samples(item: Item, history: Question[] = []) {
  return Array.from({length:100},(_,i)=>chooseSwipeQuestion(item,getToday(),history,()=>i/100));
}
it('selects all nine eligible intents and applies frequency, discount and recent-question filters',()=>{
  const item = setup();
  const full = {...item,reasons:['discount_limited' as const]};
  expect(new Set(samples(full).map(q=>q.templateCode)).size).toBe(9);
  const ordinary = samples(item);
  expect(ordinary.some(q=>q.templateCode==='SW_PRE_TODAY')).toBe(true);
  expect(ordinary.some(q=>q.templateCode==='SW_PRE_PROMO')).toBe(false);
  expect(samples({...full,name:'수집용 피규어'}).some(q=>q.templateCode==='SW_PRE_TODAY')).toBe(false);
  const history = swipePreCatalog.slice(0,3).map((t,i)=>({...ordinary[0],templateCode:t.code,date:addDays(getToday(),-i-1)}));
  expect(samples(full,history).every(q=>!history.some(h=>h.templateCode===q.templateCode))).toBe(true);
  expect(ordinary.every(q=>isSwipeQuestion(q) && q.options.every(o=>!o.countsAsUse))).toBe(true);
  expect(ordinary.find(q=>q.templateCode==='SW_PRE_CUSTOM')?.text).toContain('펼칠 공간');
});
it('freezes concurrent requests and stores version metadata across schema parsing',async()=>{
  setup();
  (bobApi.simulations.localQuestion as jest.Mock).mockResolvedValue(dto());
  await Promise.all([loadTodayReflections(),loadTodayReflections()]);
  await loadTodayReflections();
  expect(bobApi.simulations.localQuestion).toHaveBeenCalledTimes(1);
  const q = getState().questions['server-question'];
  expect(isSwipeQuestion(QuestionSchema.parse(q))).toBe(true);
  for (const direction of ['right','up','left'] as const) await saveReflection(q.id,{choice_code:swipeAnswer(direction)},direction);
  expect(Object.values(getState().answers)).toHaveLength(1);
  expect(reflectionCounts([q],Object.values(getState().answers))).toEqual({YES:0,UNSURE:0,NO:1});
  await expect(saveReflection(q.id,{number_value:7},'7일')).rejects.toThrow();
});
it.each([false,true])('replaces only unanswered historical cards (answered=%s)',async answered=>{
  const item = setup();
  const old = {...chooseSwipeQuestion(item,getToday(),[]),id:'old',templateVersion:undefined,templateCode:'RECENT_NEED'};
  update(s=>({questions:{...s.questions,old},answers:answered?{...s.answers,oldAnswer:{id:'oldAnswer',itemId:item.id,questionId:'old',date:getToday(),at:new Date().toISOString(),optionId:'YES',value:{choice_code:'YES'},label:'있었어요'}}:s.answers}));
  (bobApi.simulations.localQuestion as jest.Mock).mockResolvedValue(dto());
  await loadTodayReflections();
  expect(!!getState().questions.old).toBe(answered);
  expect(!!getState().questions['server-question']).toBe(!answered);
  if(answered) expect(bobApi.simulations.localQuestion).not.toHaveBeenCalled();
});
it.each(['offline','legacy','wrong-date'])('keeps the swipe contract during %s fallback',async failure=>{
  setup();
  const request = bobApi.simulations.localQuestion as jest.Mock;
  if(failure==='offline') request.mockRejectedValue(new Error('offline'));
  else request.mockResolvedValue({...dto(),...(failure==='legacy'?{template_version:'pre-v1'}:{question_date:addDays(getToday(),-1)})});
  await loadTodayReflections();
  const q = Object.values(getState().questions).find(q=>q.date===getToday())!;
  expect(isSwipeQuestion(q)).toBe(true);
  expect(q.generationMethod).toBe('TEMPLATE');
});
it('does not accept a card or answer that failed to persist',async()=>{
  setup();
  (bobApi.simulations.localQuestion as jest.Mock).mockResolvedValue(dto());
  (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('disk full'));
  await expect(loadTodayReflections()).rejects.toThrow('disk full');
  expect(getState().questions['server-question']).toBeUndefined();
  await loadTodayReflections();
  (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('disk full'));
  await expect(saveReflection('server-question',{choice_code:'YES'},'예')).rejects.toThrow('disk full');
  expect(Object.values(getState().answers)).toHaveLength(0);
});

it.each([undefined, 21])('keeps purchased cards and reminders closed until the due day (server delay %s)',async serverDelay=>{
  const original = setup(), today = getToday();
  const due = addDays(today, serverDelay ?? 14);
  const item: Item = {...original,status:'bought',purchaseId:'purchase',purchase:{boughtAt:`${today}T00:00:00+09:00`,reviewDueOn:serverDelay ? due : undefined}};
  const q = {...chooseSwipeQuestion(item,today,[]),id:'old-post'};
  await update(s=>({items:{...s.items,[item.id]:item},questions:{...s.questions,[q.id]:q}}));
  for (const day of [today,addDays(due,-1)]) {
    expect(reflectionDue(item,day)).toBe(false);
    expect(hasNotificationWork([item],[q],[],day)).toBe(false);
  }
  await loadTodayReflections();
  expect(bobApi.purchases.localQuestion).not.toHaveBeenCalled();
  await expect(saveReflection(q.id,{choice_code:'YES'},'예')).rejects.toThrow();
  expect(reflectionDue(item,due)).toBe(false);
  expect(hasNotificationWork([item],[q],[],due)).toBe(true);
});

it('preserves a local summary on remote failure and retries the same responses successfully',async()=>{
  const item = setup();
  await update(s=>({items:{...s.items,[item.id]:{...item,simulation:{startAt:`${getToday()}T00:00:00+09:00`,endDate:getToday(),durationDays:0,observationDates:[]}}}}));
  const request = bobApi.simulations.summarize as jest.Mock;
  request.mockRejectedValueOnce(new Error('unavailable')).mockResolvedValue({result:{expected_used_days:null,answer_coverage:0,comparison_eligible:false,comparison_reason:'REFLECTION_NOT_USAGE'},ai_summary:{summary:'응답이 없어요.',method:'TEMPLATE'}});
  await expect(summarizeItem(item.id)).rejects.toThrow('unavailable');
  expect(getState().items[item.id].summary).toMatchObject({syncState:'pending',reflectionCounts:{YES:0,UNSURE:0,NO:0}});
  await summarizeItem(item.id);
  await summarizeItem(item.id);
  expect(request).toHaveBeenCalledTimes(2);
  expect(getState().items[item.id].summary).toMatchObject({syncState:'synced',text:'응답이 없어요.'});
});

it('previews time-shifted summaries locally without sending future records to the server',async()=>{
  const item = setup();
  shiftClock(3);
  await summarizeItem(item.id);
  expect(bobApi.simulations.summarize).not.toHaveBeenCalled();
  expect(getState().items[item.id].summary?.syncState).toBe('preview');
});
