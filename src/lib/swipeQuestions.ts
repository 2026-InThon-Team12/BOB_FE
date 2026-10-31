import {
  SWIPE_ANSWER_SPEC, SWIPE_QUESTION_VERSION, swipeCategoryProfiles, swipePreCatalog,
  swipePostCatalog, swipeProductRules, swipeProfiles,
} from '@/constants/swipeQuestionCatalog';
import { reflectionCopy } from '@/constants/copy';
import type { Item, Question } from '@/types';

/** Mirrors backend eligibility; random selection happens only when a daily card is saved. */
export function chooseSwipeQuestion(item: Item, today: string, history: Question[], random = Math.random): Question {
  const post = item.status === 'bought';
  const name = item.name.toLowerCase();
  const profileKey = swipeProductRules.find(([words]) => words.some(word => name.includes(word)))?.[1]
    ?? swipeCategoryProfiles[item.category as keyof typeof swipeCategoryProfiles] ?? 'general';
  const profile = swipeProfiles[profileKey];
  const frequent = (['yoga', 'keyboard', 'shoes', 'film', 'whitening', 'remover', 'beauty'].includes(profileKey)
    || /매일|일상|데일리|출퇴근/.test(item.reasonOtherText ?? ''))
    && !/일회용|여행용|행사용|파티|결혼식|피규어|수집|기념/.test(name);
  const eligible = (post ? swipePostCatalog : swipePreCatalog).filter(row =>
    (row.code !== 'SW_PRE_TODAY' || frequent) &&
    (row.code !== 'SW_PRE_PROMO' || item.reasons.some(r => r === 'discount_limited' || r === 'bundle_discount')));
  const recent = [...history].sort((a,b) => (b.date ?? '').localeCompare(a.date ?? '')).slice(0,3);
  const fresh = eligible.filter(row => !recent.some(q => q.templateCode === row.code));
  const pool = fresh.length ? fresh : eligible;
  const count = (code: string) => history.filter(q => q.templateCode === code).length;
  const least = Math.min(...pool.map(row => count(row.code)));
  const choices = pool.filter(row => count(row.code) === least);
  const chosen = choices[Math.floor(random() * choices.length)];
  const values: Record<string, string> = {...profile, item: item.name};
  let text = chosen.wording.replace(/\{(\w+)\}/g, (_, key: string) => values[key]);
  if (text.length > 300) text = text.replace(item.name, `${item.name.slice(0,80)}…`);
  return {
    id: `local:${item.id}:${post ? 'post' : 'pre'}:${today}`, itemId: item.id, date: today,
    phase: post ? 'post' : 'pre', templateCode: chosen.code, templateVersion: SWIPE_QUESTION_VERSION,
    text, answerSpec: {...SWIPE_ANSWER_SPEC}, generationMethod: 'TEMPLATE', kind: 'thought_of', variant: 'normal',
    options: SWIPE_ANSWER_SPEC.options.map(o => ({id: o.code, label: o.label, countsAsUse: false})),
    reference: chosen.code === 'SW_PRE_CASH' || chosen.code === 'SW_POST_PRICE' ? reflectionCopy.priceReference(item.price) : undefined,
  };
}
