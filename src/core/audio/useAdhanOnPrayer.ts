import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { isAdhanEnabled, playAdhan } from './adhanPlayer';

// Subscribes to incoming prayer notifications and plays the adhan if enabled.
// Only triggers when the notification carries `prayerId` in its data payload.
export function useAdhanOnPrayer() {
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(async (notification) => {
      const data = notification.request.content.data as Record<string, unknown> | undefined;
      if (!data || typeof data.prayerId !== 'string') return;
      const enabled = await isAdhanEnabled();
      if (!enabled) return;
      playAdhan().catch(() => {});
    });
    return () => sub.remove();
  }, []);
}
