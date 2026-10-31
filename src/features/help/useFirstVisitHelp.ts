import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import type { HelpScope } from '@/config/helpFlow';
import { claimHelp, useHydrated, useSettings } from '@/data';

/** Only the focused, ready screen may open its introduction. */
export function useFirstVisitHelp(scope: HelpScope, ready = true) {
  const hydrated = useHydrated();
  const { onboarded } = useSettings();
  useFocusEffect(useCallback(() => {
    if (!hydrated || !onboarded || !ready) return;
    const frame = requestAnimationFrame(() => {
      if (claimHelp(scope)) router.push({ pathname: '/help', params: { scope } });
    });
    return () => cancelAnimationFrame(frame);
  }, [hydrated, onboarded, ready, scope]));
}
