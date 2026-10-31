/**
 * 로컬 데이터 계층의 공개 API.
 * 화면·뷰모델은 이 파일에서 내보낸 것만 쓴다 (store를 직접 쓰지 않는다 — ESLint로 강제).
 */

// 조회 훅
export {
  useActiveGoal,
  useAnswers,
  useBudget,
  useExpenses,
  useGoals,
  useHydrated,
  useImpulses,
  useItem,
  useItemQuestions,
  useItems,
  useRegistrationItems,
  useLatestBudget,
  useQuestions,
  useSettings,
} from './selectors';

// 현재 시각 (데모 시간 이동 반영)
export { getNow, getNowIso, getThisMonth, getToday, useThisMonth, useToday } from './clock';

// 변경
export { answerToday } from './actions/answers';
export { createGoal, deleteGoal, markGoalAchieved, setActiveGoal, updateGoal } from './actions/goals';
export { addItems, decideItem, removeItem, submitReview, updateItem, type ItemPatch } from './actions/items';
export { registerItemsRemote, registerAfterReasons, completeDiscountRegistration } from './actions/remoteItems';
export {
  completeOnboarding,
  resetAllData,
  resetClock,
  setDailySavingOverride,
  setThemeScheme,
  shiftClock,
} from './actions/settings';
export {
  addExpense,
  recordImpulse,
  removeExpense,
  removeImpulse,
  setMonthlyBudget,
} from './actions/spending';

// 백업 · 데모
export { exportBackup, importBackup, parseBackup, type ImportResult } from './backup';
export { loadDemoSeed } from './seed';

export { DataError } from './errors';
export type { DataState } from './schema';

export { loadTodayReflections, saveReflection, reflectionDue, fallbackQuestion, summarizeItem, decideItemRemote, submitReviewRemote } from './actions/reflections';
export type { ReflectionAnswer, AnswerSpec } from './actions/reflections';
