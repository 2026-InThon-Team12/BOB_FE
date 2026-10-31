import AsyncStorage from '@react-native-async-storage/async-storage';
import { bobApi } from '@/api';
import { addItems, getToday, loadTodayReflections, resetAllData, saveReflection } from '@/data';
import { getState, update } from '@/data/store';
import { applyRemoteItem } from '@/data/actions/remoteItems';
import { addDays } from '@/lib/date';
import { isSwipeQuestion, reflectionCounts, swipeAnswer } from '@/lib/reflection';
import { chooseSwipeQuestion } from '@/lib/swipeQuestions';
import { SWIPE_ANSWER_SPEC, swipePreCatalog } from '@/constants/swipeQuestionCatalog';
import { QuestionSchema, type Item, type Question } from '@/types';

jest.mock('@/api',()=>({bobApi:{simulations:{localQuestion:jest.fn()},purchases:{localQuestion:jest.fn()}}}));
jest.mock('@/config/env',()=>({env:{aiMode:'real'}}));
const input = {name:'요가매트',price:20000,category:'hobby' as const,reasons:['need' as const],source:'manual' as const};
beforeEach(()=>{resetAllData();jest.clearAllMocks();});
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
