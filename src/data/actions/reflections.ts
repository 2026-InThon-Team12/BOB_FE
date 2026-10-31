/** Daily adapted questions/answers are device-owned; only summary submissions include transcripts. */
import { z } from 'zod';
import { bobApi } from '@/api';
import { env } from '@/config/env';
import { preCatalog, postCatalog } from '@/constants/fixedQuestionCatalog';
import { dateKeyOf, diffDays } from '@/lib/date';
import { simulationDayKeys } from '@/lib/calc/simulation';
import { simulationEndDay } from '@/lib/calc/itemMachine';
import { requestDigest } from '@/lib/requestDigest';
import type { DailyAnswer, Item, Question } from '@/types';
import { getState, update } from '../store';
import { getToday, getNowIso } from '../clock';
import { decideItem, submitReview } from './items';
import { applyRemoteItem } from './remoteItems';

import { validReflectionAnswer, type AnswerSpec, type ReflectionAnswer } from '@/lib/reflection';
export type { AnswerSpec, ReflectionAnswer } from '@/lib/reflection';
const questionDto = z.object({
  id: z.string(), question_date: z.string(), template_code: z.string(), question: z.string().min(1).max(300),
  answer_spec: z.record(z.string(), z.unknown()), reference_text: z.string().nullish(), generation_method: z.string(),
  usage_window: z.object({start: z.string(), end: z.string()}).nullish(),
});
const flights = new Map<string, Promise<unknown>>();
function single<T>(key: string, run: () => Promise<T>): Promise<T> {
  const old = flights.get(key); if (old) return old as Promise<T>;
  const promise = run().finally(() => flights.delete(key)); flights.set(key, promise); return promise;
}
export function reflectionDue(item: Item, today: string): boolean {
  if (item.registrationState === 'pending') return false;
  if (item.status === 'simulating') return simulationDayKeys(item).includes(today);
  return item.status === 'bought' && !!item.purchase && dateKeyOf(item.purchase.boughtAt) <= today;
}
export function fallbackQuestion(item: Item, today: string): Question {
  const post = item.status === 'bought';
  const days = simulationDayKeys(item);
  const age = post ? diffDays(dateKeyOf(item.purchase!.boughtAt), today) : days.indexOf(today);
  const history = Object.values(getState().questions).filter(q => q.itemId === item.id && q.phase === (post ? 'post' : 'pre') && q.date && q.date < today);
  const stages = post ? age <= 3 ? ['IMMEDIATE'] : age >= 90 ? ['LONG_TERM','USAGE'] : age >= 30 ? ['VALUE','MOTIVE','USAGE'] : ['USAGE'] : [['TRIGGER','NECESSITY','PREDICTION','VALUE','PERSISTENCE'][Math.max(0, age) % 5]];
  const bank = (post ? postCatalog : preCatalog).filter(t => stages.includes(t.stage) && !['WORK_VALUE','GOAL_DELAY','GOAL_TRADEOFF','VALUE_WORTH','USAGE_DAYS','NON_USE_REASON'].includes(t.code));
  const chosen = !post && today === days[days.length - 1] ? preCatalog.find(t => t.code === 'EXPECTED_USE_DAYS')!
    : [...bank].sort((a,b) => history.filter(h => h.templateCode === a.code).length - history.filter(h => h.templateCode === b.code).length)[0];
  const spec = chosen.spec as AnswerSpec;
  return {id: `local:${item.id}:${post ? 'post' : 'pre'}:${today}`, itemId: item.id, date: today, phase: post ? 'post' : 'pre',
    templateCode: chosen.code, text: chosen.wording.replace('{item}', item.name), answerSpec: spec as Record<string,unknown>,
    generationMethod: 'TEMPLATE', kind: 'thought_of', variant: 'normal', options: placeholderOptions(spec)};
}
function placeholderOptions(spec: AnswerSpec) {
  const options = (spec.options ?? []).map(o => ({id:o.code, label:o.label, countsAsUse:false}));
  return options.length >= 2 ? options : [{id:'VALUE',label:'응답 저장',countsAsUse:false},{id:'UNSURE',label:'잘 모르겠어요',countsAsUse:false}];
}
export async function loadTodayReflections(): Promise<void> {
  const today = getToday();
  await Promise.all(Object.values(getState().items).filter(i => reflectionDue(i,today)).map(item => single(`question:${item.id}:${today}`, async () => {
    const post = item.status === 'bought';
    const existing = Object.values(getState().questions).find(q => q.itemId === item.id && q.date === today && q.phase === (post ? 'post' : 'pre'));
    if (existing) return;
    if (Object.values(getState().answers).some(a=>a.itemId===item.id && a.date===today && (getState().questions[a.questionId]?.phase ?? 'pre')===(post ? 'post':'pre'))) return;
    let question = fallbackQuestion(item, today);
    const remoteId = post ? item.purchaseId : item.simulationId;
    if (remoteId && env.aiMode === 'real') {
      const recent_templates = Object.values(getState().questions).filter(q => q.itemId === item.id && q.phase === question.phase && q.date && q.date < today && q.templateCode)
        .map(q => ({date:q.date, template_code:q.templateCode})).sort((a,b) => a.date!.localeCompare(b.date!)).slice(-365);
      try {
        const raw = await (post ? bobApi.purchases.localQuestion(remoteId, {recent_templates}) : bobApi.simulations.localQuestion(remoteId, {recent_templates}));
        const row = questionDto.parse(raw);
        if (row.question_date !== today) throw new Error('서버와 기기의 날짜가 달라요.');
        question = {...question, id:row.id, text:row.question, templateCode:row.template_code, answerSpec:row.answer_spec,
          options:placeholderOptions(row.answer_spec as AnswerSpec), generationMethod:row.generation_method,
          reference:[row.reference_text, row.usage_window ? `${row.usage_window.start} ~ ${row.usage_window.end} (7일)` : null].filter(Boolean).join(' · ')};
      } catch { /* An explicit fixed-template fallback is displayed and frozen for the day. */ }
    }
    if (getToday() !== today || getState().items[item.id]?.status !== item.status) return;
    update(s => ({questions:{...s.questions, [question.id]:question}}));
  })));
}
export function saveReflection(questionId: string, value: ReflectionAnswer, label: string): void {
  const s = getState(), q = s.questions[questionId], today = getToday();
  if (!q || q.date !== today || !reflectionDue(s.items[q.itemId],today) || !validReflectionAnswer(q.answerSpec as AnswerSpec,value)) throw new Error('오늘 질문의 응답 형식을 확인해 주세요.');
  const old = Object.values(s.answers).find(a => a.itemId === q.itemId && a.date === today && s.questions[a.questionId]?.phase === q.phase);
  const answer: DailyAnswer = {id:old?.id ?? `answer:${q.id}`, itemId:q.itemId, date:today, questionId:q.id, optionId:value.choice_code ?? 'VALUE', value, label, at:getNowIso()};
  update(st => ({answers:{...st.answers,[answer.id]:answer}}));
}
export function reflectionMetrics(item: Item) {
  const s = getState();
  const days = simulationDayKeys(item);
  const responses = Object.values(s.answers).flatMap(a => {
    const q = s.questions[a.questionId];
    return a.itemId === item.id && q?.phase === 'pre' && q.templateCode && a.value && days.includes(a.date) ? [{date:a.date,template_code:q.templateCode,question:q.text,answer:a.value}] : [];
  }).sort((a,b) => a.date.localeCompare(b.date));
  const definite = responses.filter(r => r.answer.choice_code !== 'UNSURE' && !Object.values(r.answer.object_value ?? {}).includes('UNSURE')).length;
  const expected = responses.filter(r => r.template_code === 'EXPECTED_USE_DAYS').at(-1)?.answer.number_value ?? null;
  const coverage = days.length ? definite / days.length : 0;
  const early = !!item.purchase && dateKeyOf(item.purchase.boughtAt) < simulationEndDay(item);
  return {responses, expected, coverage, eligible: days.length > 0 && getToday() >= simulationEndDay(item) && !early && coverage >= .7 && expected !== null};
}
export async function summarizeItem(itemId: string): Promise<void> {
  return single(`summary:${itemId}`, async () => {
    const item = getState().items[itemId]; if (!item || item.status !== 'simulating' || getToday() < simulationEndDay(item)) return;
    const m = reflectionMetrics(item);
    const fingerprint = requestDigest(JSON.stringify(m.responses));
    if (item.summary?.fingerprint === fingerprint) return;
    let summary: NonNullable<Item['summary']> = {text:`${item.simulation.durationDays}일 중 ${m.responses.length}일 답했어요. ${m.expected === null ? '예상 사용일수 기록이 없어 수치 비교는 하지 않아요.' : `산 뒤 30일 중 ${m.expected}일 사용할 것으로 예상했어요.`}`, method:'TEMPLATE', expectedDays:m.expected, coverage:m.coverage, eligible:m.eligible, reason:m.eligible ? null : 'INSUFFICIENT_EVIDENCE', fingerprint};
    if (item.simulationId && env.aiMode === 'real') {
      const dto = z.object({result:z.object({expected_used_days:z.number().nullable(),answer_coverage:z.number(),comparison_eligible:z.boolean(),comparison_reason:z.string().nullable()}),ai_summary:z.object({summary:z.string(),method:z.string()})}).parse(await bobApi.simulations.summarize(item.simulationId,{responses:m.responses}));
      summary = {...summary,text:dto.ai_summary.summary,method:dto.ai_summary.method,expectedDays:dto.result.expected_used_days,coverage:dto.result.answer_coverage,eligible:dto.result.comparison_eligible,reason:dto.result.comparison_reason};
    }
    update(s => ({items:{...s.items,[itemId]:{...s.items[itemId],summary}}}));
  });
}
export async function decideItemRemote(itemId: string, action: 'buy'|'abandon'|'hold'): Promise<Item> {
  return single(`decision:${itemId}`, async () => {
    let item = getState().items[itemId];
    if (getToday() >= simulationEndDay(item)) {
      // An optional AI summary must not prevent an explicit purchase/abandonment.
      // Keep the local transcript intact; never fabricate a successful summary.
      try { await summarizeItem(itemId); } catch { /* The result screen retains the summary error. */ }
    }
    item = getState().items[itemId];
    let response: unknown;
    if (item.remoteId && env.aiMode === 'real') response = await bobApi.items.putDecision(item.remoteId,{decision: action === 'buy' ? 'BUY' : action === 'hold' ? 'HOLD' : 'GIVE_UP'},`decision-${requestDigest(`${item.remoteId}:${action}:${simulationEndDay(item)}`)}`);
    const result = decideItem(itemId,action);
    if (response) return applyRemoteItem(itemId,response);
    return result;
  });
}
export async function submitReviewRemote(itemId: string, bucket: string): Promise<void> {
  return single(`review:${itemId}`, async () => {
    const item = getState().items[itemId];
    const frequency = {daily:'ALMOST_DAILY',often:'OFTEN',sometimes:'SOMETIMES',never:'NEVER'}[bucket];
    if (!frequency) throw new Error('사용일수 구간을 선택해 주세요.');
    if (item.purchaseId && env.aiMode === 'real') await bobApi.purchases.putReview(item.purchaseId,{frequency});
    submitReview(itemId,{usageBucket:bucket});
  });
}
