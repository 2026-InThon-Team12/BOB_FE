/** 로컬에 저장하는 전체 데이터의 형태 (단일 진실 공급원) */
import { z } from 'zod';

import {
  DailyAnswerSchema,
  ExpenseSchema,
  GoalSchema,
  ImpulseEventSchema,
  ItemSchema,
  MonthKeySchema,
  MonthlyBudgetSchema,
  QuestionSchema,
  SettingsSchema,
  type Settings,
} from '@/types';

const byId = <T extends z.ZodType>(schema: T) => z.record(z.string(), schema);

export const DataStateSchema = z.object({
  items: byId(ItemSchema),
  questions: byId(QuestionSchema),
  answers: byId(DailyAnswerSchema),
  goals: byId(GoalSchema),
  impulses: byId(ImpulseEventSchema),
  expenses: byId(ExpenseSchema),
  /** 월 키(YYYY-MM) → 예산 */
  budgets: z.record(MonthKeySchema, MonthlyBudgetSchema),
  settings: SettingsSchema,
});

export type DataState = z.infer<typeof DataStateSchema>;

export const initialSettings: Settings = {
  onboarded: false,
  helpSeen: [],
  clockOffsetDays: 0,
  dailySavingOverride: null,
  themeScheme: null,
};

export const createInitialState = (): DataState => ({
  items: {},
  questions: {},
  answers: {},
  goals: {},
  impulses: {},
  expenses: {},
  budgets: {},
  settings: { ...initialSettings },
});
