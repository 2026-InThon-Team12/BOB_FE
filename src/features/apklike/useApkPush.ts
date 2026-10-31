import { useState } from 'react';
import { apkRepository } from '@/data';
import { apkCopy as c } from '@/constants/apkCopy';
import { apkDevicePushToken, apkPushAvailable } from '@/lib/apkNotifications';

export function useApkPush() {
  const available = apkPushAvailable();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(available ? c.pushOff : c.pushGo);
  const run = async (enable: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      if (enable)
        await apkRepository.request('PUT', '/me/push-token', {
          token: await apkDevicePushToken(),
          enabled: true,
        });
      else await apkRepository.request('DELETE', '/me/push-token');
      setMessage(enable ? c.pushConnected : c.pushOff);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : c.error);
    } finally {
      setBusy(false);
    }
  };
  return {
    available,
    busy,
    message,
    enable: () => run(true),
    disable: () => run(false),
  };
}
