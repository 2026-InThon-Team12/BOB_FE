/** Daily adapted questions/answers are device-owned; only summary submissions include transcripts. */
import { z } from 'zod';
import { bobApi } from '@/api';
import { env } from '@/config/env';
import { policy } from '@/config/policy';
import { SHORT_QUESTION_VERSION } from '@/constants/swipeQuestionCatalog';
import { reflectionCopy } from '@/constants/copy';
import { dateKeyOf } from '@/lib/date';
import { chooseSwipeQuestion } from '@/lib/swipeQuestions';
import { simulationDayKeys } from '@/lib/calc/simulation';
import { reviewDueDay, simulationEndDay } from '@/lib/calc/itemMachine';
import { requestDigest } from '@/lib/requestDigest';
import type { DailyAnswer, Item, Question } from '@/types';
import { getState, update } from '../store';
import { getToday, getNowIso } from '../clock';
import { decideItem } from './items';
import { applyRemoteItem } from './remoteItems';

import { isSwipeQuestion, reflectionCounts, validReflectionAnswer, type AnswerSpec, type ReflectionAnswer } from '@/lib/reflection';
export type { AnswerSpec, ReflectionAnswer } from '@/lib/reflection';
const questionDto = z.object({
  id: z.string(), question_date: z.string(), template_code: z.string(), question: z.string().min(1).max(300),
  template_version: z.string(), wording_version: z.string().optional(), answer_spec: z.record(z.string(), z.unknown()), reference_text: z.string().nullish(), generation_method: z.string(),
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
  return false;
}
export function fallbackQuestion(item: Item, today: string): Question {
  const post = item.status === 'bought';
  const history = Object.values(getState().questions).filter(q => q.itemId === item.id && q.phase === (post ? 'post' : 'pre') && q.date && q.date < today);
  return chooseSwipeQuestion(item, today, history);
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
    if (existing && isSwipeQuestion(existing) && existing.wordingVersion === SHORT_QUESTION_VERSION) return;
    if (Object.values(getState().answers).some(a=>a.itemId===item.id && a.date===today && (getState().questions[a.questionId]?.phase ?? 'pre')===(post ? 'post':'pre'))) return;
    let question = fallbackQuestion(item, today);
    const remoteId = post ? item.purchaseId : item.simulationId;
    if (remoteId && env.aiMode === 'real') {
      const recent_templates = Object.values(getState().questions).filter(q => q.itemId === item.id && q.phase === question.phase && q.date && q.date < today && q.templateCode)
        .map(q => ({date:q.date, template_code:q.templateCode})).sort((a,b) => a.date!.localeCompare(b.date!)).slice(-365);
      try {
        const raw = await (post ? bobApi.purchases.localQuestion(remoteId, {recent_templates}) : bobApi.simulations.localQuestion(remoteId, {recent_templates}));
        const row = questionDto.parse(raw);
        if (row.question_date !== today || !isSwipeQuestion({templateVersion: row.template_version, answerSpec: row.answer_spec})) throw new Error(reflectionCopy.questionUnavailable);
        question = {...question, id:row.id, text:row.question, templateCode:row.template_code, templateVersion:row.template_version, wordingVersion:row.wording_version, answerSpec:row.answer_spec,
          options:placeholderOptions(row.answer_spec as AnswerSpec), generationMethod:row.generation_method,
          reference:[row.reference_text, row.usage_window ? `${row.usage_window.start} ~ ${row.usage_window.end} (7일)` : null].filter(Boolean).join(' · ')};
      } catch { /* An explicit fixed-template fallback is displayed and frozen for the day. */ }
    }
    if (getToday() !== today || getState().items[item.id]?.status !== item.status) return;
    try {
      await update(s => {
        const questions = {...s.questions};
        if (existing) delete questions[existing.id];
        return {questions:{...questions, [question.id]:question}};
      });
    } catch (error) {
      await Promise.resolve(update(s => {
        const questions = {...s.questions};
        delete questions[question.id];
        if (existing) questions[existing.id] = existing;
        return {questions};
      })).catch(() => {});
      throw error;
    }
  })));
}
export async function saveReflection(questionId: string, value: ReflectionAnswer, label: string): Promise<void> {
  const s = getState(), q = s.questions[questionId], today = getToday();
  if (!q || !isSwipeQuestion(q) || q.date !== today || !reflectionDue(s.items[q.itemId],today) || !validReflectionAnswer(q.answerSpec as AnswerSpec,value)) throw new Error(reflectionCopy.answerInvalid);
  const old = Object.values(s.answers).find(a => a.itemId === q.itemId && a.date === today && s.questions[a.questionId]?.phase === q.phase);
  const answer: DailyAnswer = {id:old?.id ?? `answer:${q.id}`, itemId:q.itemId, date:today, questionId:q.id, optionId:value.choice_code ?? 'VALUE', value, label, at:getNowIso()};
  try { await update(st => ({answers:{...st.answers,[answer.id]:answer}})); }
  catch (error) {
    await Promise.resolve(update(st => {
      const answers = {...st.answers};
      if (old) answers[old.id] = old;
      else delete answers[answer.id];
      return {answers};
    })).catch(() => {});
    throw error;
  }
}
export function reflectionMetrics(item: Item) {
  const s = getState();
  const days = simulationDayKeys(item);
  const responses = Object.values(s.answers).flatMap(a => {
    const q = s.questions[a.questionId];
    return a.itemId === item.id && q?.phase === 'pre' && q.templateCode && a.value && days.includes(a.date) ? [{date:a.date,template_code:q.templateCode,question:q.text,answer:a.value}] : [];
  }).sort((a,b) => a.date.localeCompare(b.date));
  const definite = responses.filter(r => r.answer.choice_code !== 'UNSURE' && !Object.values(r.answer.object_value ?? {}).includes('UNSURE')).length;
  const questions = Object.values(s.questions).filter(q => q.itemId === item.id && q.phase === 'pre' && q.date && days.includes(q.date));
  const swipe = questions.some(isSwipeQuestion) || questions.length === 0;
  const counts = swipe ? reflectionCounts(questions, Object.values(s.answers)) : undefined;
  const expected = swipe ? counts!.YES : responses.filter(r => r.template_code === 'EXPECTED_USE_DAYS').at(-1)?.answer.number_value ?? null;
  const coverage = days.length ? definite / days.length : 0;
  const early = !!item.purchase && dateKeyOf(item.purchase.boughtAt) < simulationEndDay(item);
  return {responses, expected, coverage, counts, predictionWindowDays:swipe ? days.length : 30,
    eligible: days.length > 0 && getToday() >= simulationEndDay(item) && !early && (swipe ? responses.length > 0 : coverage >= .7 && expected !== null)};
}
export async function summarizeItem(itemId: string): Promise<void> {
  return single(`summary:${itemId}`, async () => {
    const item = getState().items[itemId]; if (!item || item.status !== 'simulating' || getToday() < simulationEndDay(item)) return;
    const m = reflectionMetrics(item);
    const fingerprint = requestDigest('swipe-days-v1:' + JSON.stringify(m.responses));
    const remote = !!item.simulationId && env.aiMode === 'real';
    const preview = remote && getState().settings.clockOffsetDays !== 0;
    const syncState = preview ? 'preview' : remote ? 'pending' : 'local';
    if (item.summary?.fingerprint === fingerprint && (!m.counts || item.summary.reflectionCounts)
      && item.summary.syncState === (preview ? 'preview' : remote ? 'synced' : 'local')) return;
    let summary: NonNullable<Item['summary']> = {text:m.counts ? reflectionCopy.swipeSummary(item.simulation.durationDays,m.counts.YES) : reflectionCopy.localSummary(item.simulation.durationDays,m.responses.length,m.expected), method:'TEMPLATE', expectedDays:m.expected, predictionWindowDays:m.predictionWindowDays, coverage:m.coverage, eligible:m.eligible, reason:m.eligible ? null : 'INSUFFICIENT_EVIDENCE', reflectionCounts:m.counts, fingerprint, syncState};
    // Keep device-owned evidence visible even when the optional remote summary fails.
    await update(s => ({items:{...s.items,[itemId]:{...s.items[itemId],summary}}}));
    // A developer clock offset does not advance the server's observation period.
    if (remote && !preview) {
      const dto = z.object({result:z.object({expected_used_days:z.number().nullable(),answer_coverage:z.number(),comparison_eligible:z.boolean(),comparison_reason:z.string().nullable()}),ai_summary:z.object({summary:z.string(),method:z.string()})}).parse(await bobApi.simulations.summarize(item.simulationId!,{responses:m.responses}));
      summary = {...summary,text:dto.ai_summary.summary,method:dto.ai_summary.method,expectedDays:dto.result.expected_used_days,coverage:dto.result.answer_coverage,eligible:dto.result.comparison_eligible,reason:dto.result.comparison_reason,syncState:'synced'};
    }
    if (m.counts) summary = {...summary,expectedDays:m.expected,predictionWindowDays:m.predictionWindowDays,eligible:m.eligible,reason:m.eligible ? null : 'INSUFFICIENT_EVIDENCE'};
    await update(s => ({items:{...s.items,[itemId]:{...s.items[itemId],summary}}}));
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
    const option = policy.reviewUsageBuckets.find(b => b.id === bucket);
    const due = item && reviewDueDay(item,policy);
    if (!option || !item || item.status !== 'bought' || !due || getToday() < due) throw new Error(reflectionCopy.answerInvalid);
    if (item.review) return;
    if (item.purchaseId && env.aiMode === 'real') await bobApi.purchases.putReview(item.purchaseId,{frequency:option.id});
    const review = {usageBucket:option.id,usedDays:option.usedDays,at:getNowIso()};
    try { await update(s=>({items:{...s.items,[itemId]:{...s.items[itemId],review}}})); }
    catch (error) {
      await Promise.resolve(update(s=>({items:{...s.items,[itemId]:{...s.items[itemId],review:undefined}}}))).catch(()=>{});
      throw error;
    }
  });
}
