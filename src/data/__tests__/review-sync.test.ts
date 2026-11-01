import { bobApi } from '@/api';
import { ApiError } from '@/api/errors';
import { env } from '@/config/env';
import { policy } from '@/config/policy';
import { addItems, decideItemRemote, getToday, resetAllData, resetClock, shiftClock, submitReviewRemote } from '@/data';
import { getState, update } from '@/data/store';
import { applyRemoteItem, completeDiscountRegistration, registerItemsRemote, syncRemoteItems } from '@/data/actions/remoteItems';
import { reflectionDue } from '@/data/actions/reflections';
import { migrate } from '@/data/migrations';
import { DataStateSchema } from '@/data/schema';
import { categoryReviewUsage, predictedVsActual } from '@/lib/calc/tendency';
import { derivePhase } from '@/lib/calc/itemMachine';
import { goBack } from '@/lib/navigation';
import { router } from 'expo-router';

jest.mock('@/config/env',()=>({env:{aiMode:'real',demo:true}}));
jest.mock('@/api',()=>({bobApi:{items:{list:jest.fn(),get:jest.fn(),batchCreate:jest.fn()},purchases:{putReview:jest.fn()}}}));
jest.mock('expo-router',()=>({router:{canGoBack:()=>true,back:jest.fn(),replace:jest.fn()}}));
const input = {name:'숄더백',price:40000,category:'clothing' as const,reasons:['need' as const],source:'manual' as const};
const simulation = {id:'sim',start_date:'2026-11-02',end_date_exclusive:'2026-11-05',duration_days:3,observation_dates:['2026-11-02','2026-11-03','2026-11-04']};
const purchase = {id:'purchase',item_id:'server',purchased_on:'2026-11-05',review_due_on:'2026-11-19',review_start:'2026-11-05',review_end:'2026-11-18',review:null};
const saved = {...purchase,review:{used_days:null,frequency:'DAYS_4_7',min_days:4,max_days:7,estimated_days:5.5,submitted_on:'2026-11-19'},expected_days_in_review_window:2,expected_usage_rate:2/3,prediction_window_days:3,comparison_eligible:false,comparison_reason:'DIFFERENT_OBSERVATION_WINDOWS'};
const dto = (bought=false) => ({id:'server',decision:bought?'BUY':null,simulation,purchase:bought?purchase:null});
function setup(bought=false) { const [i]=addItems([input]); return applyRemoteItem(i.id,dto(bought)); }
beforeEach(()=>{jest.resetAllMocks();resetAllData();(env as {demo:boolean}).demo=true;jest.spyOn(Date,'now').mockReturnValue(new Date('2026-11-19T03:00:00Z').getTime());});
afterEach(()=>jest.restoreAllMocks());

it('adopts the persisted review and restores its comparison after a reload without local questions',async()=>{
  const item=setup(true);
  (bobApi.purchases.putReview as jest.Mock).mockResolvedValue(saved);
  await submitReviewRemote(item.id,'DAYS_4_7');
  const persisted=DataStateSchema.parse(migrate(JSON.parse(JSON.stringify(getState())),5));
  expect(persisted.items[item.id].review).toMatchObject({syncState:'synced',usedDays:5.5,minDays:4,maxDays:7});
  const cmp=predictedVsActual({item:persisted.items[item.id],questions:[],answers:[],policy});
  expect(cmp).toMatchObject({predictedDays:2,actualDays:5.5,predictionWindowDays:3,actualWindowDays:14,comparable:false});
  expect(categoryReviewUsage({items:[persisted.items[item.id]],questions:[],answers:[],policy})[0]).toMatchObject({predictedDays:2,actualDays:5.5,ratio:null});
});
it('recovers an already committed review instead of rejecting every subsequent selection',async()=>{
  const item=setup(true);
  (bobApi.purchases.putReview as jest.Mock).mockRejectedValue(new ApiError('conflict','http',409,{error:{code:'REVIEW_ALREADY_COMPLETED'}}));
  (bobApi.items.get as jest.Mock).mockResolvedValue({...dto(true),purchase:saved});
  await submitReviewRemote(item.id,'DAYS_1_3');
  expect(getState().items[item.id].review).toMatchObject({usageBucket:'DAYS_4_7',syncState:'synced'});
});
it('does not mark a failed or mismatched save as completed',async()=>{
  const item=setup(true);
  (bobApi.purchases.putReview as jest.Mock).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({...saved,id:'another-purchase'});
  await expect(submitReviewRemote(item.id,'DAYS_4_7')).rejects.toThrow('offline');
  await expect(submitReviewRemote(item.id,'DAYS_4_7')).rejects.toThrow('일치');
  expect(getState().items[item.id].review).toBeUndefined();
});
it('refreshes server due dates and explains a premature review',async()=>{
  const item=setup(true);
  (bobApi.purchases.putReview as jest.Mock).mockRejectedValue(new ApiError('not due','http',409,{error:{code:'REVIEW_NOT_DUE'}}));
  (bobApi.items.get as jest.Mock).mockResolvedValue({...dto(true),purchase:{...purchase,review_due_on:'2026-11-20'}});
  await expect(submitReviewRemote(item.id,'DAYS_4_7')).rejects.toThrow('서버의 점검 날짜');
  expect(getState().items[item.id].purchase?.reviewDueOn).toBe('2026-11-20');
});
it('time-shifted review works as an explicitly local preview, without a premature production request',async()=>{
  const item=setup(true);shiftClock(1);
  await submitReviewRemote(item.id,'DAYS_4_7');
  expect(getState().items[item.id].review?.syncState).toBe('preview');
  expect(bobApi.purchases.putReview).not.toHaveBeenCalled();
});
it('returning from discount and refreshing retains active calendars and daily questions',async()=>{
  jest.spyOn(Date,'now').mockReturnValue(new Date('2026-11-02T03:00:00Z').getTime());
  const item=setup();const before=getState().items[item.id].simulation;
  goBack('/');
  (bobApi.items.list as jest.Mock).mockResolvedValue({items:[dto()]});
  await syncRemoteItems();
  expect(router.back).toHaveBeenCalledTimes(1);
  expect(getState().items[item.id].simulation).toEqual(before);
  expect(derivePhase(getState().items[item.id],getToday(),policy)).toBe('simulating');
  expect(reflectionDue(getState().items[item.id],getToday())).toBe(true);
  expect(bobApi.items.batchCreate).not.toHaveBeenCalled();
});
it('standalone discount confirmation cannot remove or re-register an existing product',async()=>{
  const item=setup();const before=getState().items;
  await completeDiscountRegistration([item],{rule:{minAmount:0,value:0,unit:'won',freeShipOn:false,freeShipMin:0,shipFee:0},neededIds:[],decision:'NEEDED'});
  await expect(registerItemsRemote([item],'repeat')).rejects.toThrow('이미 등록');
  expect(getState().items).toBe(before);
  expect(bobApi.items.batchCreate).not.toHaveBeenCalled();
});
it('an old refresh cannot roll back a review saved while the fetch was pending',async()=>{
  const item=setup(true);let resolve!: (value:unknown)=>void;
  (bobApi.items.list as jest.Mock).mockImplementation(()=>new Promise(r=>{resolve=r;}));
  const pending=syncRemoteItems();
  (bobApi.purchases.putReview as jest.Mock).mockResolvedValue(saved);
  await submitReviewRemote(item.id,'DAYS_4_7');
  resolve({items:[dto(true)]});await pending;
  expect(getState().items[item.id].review?.syncState).toBe('synced');
});
it('a stored developer offset has no effect when developer mode is disabled',()=>{
  shiftClock(18);expect(getToday()).toBe('2026-12-07');
  (env as {demo:boolean}).demo=false;expect(getToday()).toBe('2026-11-19');
});
it('restoring actual dates removes the expense from a simulated buy and restores the active observation',async()=>{
  jest.spyOn(Date,'now').mockReturnValue(new Date('2026-11-02T03:00:00Z').getTime());
  const item=setup();shiftClock(1);
  await decideItemRemote(item.id,'buy');
  expect(getState().items[item.id].developmentPreview).toBe(true);
  expect(Object.values(getState().expenses)).toHaveLength(1);
  resetClock();(bobApi.items.list as jest.Mock).mockResolvedValue({items:[dto()]});
  await syncRemoteItems();
  expect(Object.values(getState().expenses)).toHaveLength(0);
  expect(getState().items[item.id].status).toBe('simulating');
  expect(reflectionDue(getState().items[item.id],getToday())).toBe(true);
});
it('version four data migrates without losing existing calendars, answers or reviews',()=>{
  const item=setup(true);update(s=>({items:{...s.items,[item.id]:{...item,review:{usageBucket:'DAYS_4_7',usedDays:5.5,at:'2026-11-19T03:00:00Z'}}}}));
  const original=JSON.parse(JSON.stringify(getState()));
  expect(DataStateSchema.parse(migrate(original,4))).toEqual(original);
});
