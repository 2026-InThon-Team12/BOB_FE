/** 시뮬레이션 중인 물건이 있을 때만 매일 저녁 알림을 켜 둔다 (앱 루트에서 한 번 사용) */
import { useEffect } from 'react';

import { policy } from '@/config/policy';
import { copy } from '@/constants/copy';
import { useItems } from '@/data';
import { syncDailyReminder } from '@/lib/notifications';

export function useReminderSync() {
  const items = useItems();
  const hasActive = items.some((i) => i.status === 'simulating');

  useEffect(() => {
    syncDailyReminder({
      enabled: hasActive,
      time: policy.dailyNotifyTime,
      title: copy.notification.title,
      body: copy.notification.body,
      channelName: copy.notification.channel,
    }).catch((e) => console.warn('[notifications] 알림 예약 실패', e));
  }, [hasActive]);
}
