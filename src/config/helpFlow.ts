/** Stable identifiers are persisted; changing captions must not replay a tour. */
export const HELP_SCOPES = ['home', 'goal', 'wallet', 'report', 'register', 'reasons', 'discount', 'daily', 'decision'] as const;
export type HelpScope = (typeof HELP_SCOPES)[number];
export const INTRO_HELP_STEPS = [1, 0] as const;
export const HELP_GROUPS: Record<HelpScope, readonly number[]> = {
  home: [2], goal: [8], wallet: [1], report: [9],
  register: [3], reasons: [4], discount: [5], daily: [6], decision: [7],
};
export function isHelpScope(value: unknown): value is HelpScope {
  return typeof value === 'string' && HELP_SCOPES.some(scope => scope === value);
}
export function helpStepIndices(intro: boolean, scope: unknown): readonly number[] {
  return intro ? INTRO_HELP_STEPS : isHelpScope(scope) ? HELP_GROUPS[scope] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
}
