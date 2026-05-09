import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList:   true,
    shouldPlaySound:  true,
    shouldSetBadge:   false,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

export const setupNotifications = async () => {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      const res = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: false, allowSound: true },
      });
      status = res.status;
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('intizom', {
        name: 'Intizom', importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 100, 200], lightColor: '#7C3AED', sound: true,
      });
    }
    return status === 'granted';
  } catch (e) { return false; }
};

// Show when task starts — immediate banner
export const showTaskAlert = async ({ taskName, duration, language = 'en' }) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: language === 'uz' ? '⚡ Vaqt keldi!' : '⚡ Focus time!',
        body:  language === 'uz' ? `${taskName} — ${duration} daqiqa` : `${taskName} — ${duration} min`,
        data:  { type: 'task_start' },
        sound: true,
        ...(Platform.OS === 'android' && { channelId: 'intizom', color: '#7C3AED' }),
      },
      trigger: null, // immediate
    });
  } catch (e) { console.warn('showTaskAlert:', e?.message); }
};

// Show when task completes — immediate banner
export const showTaskComplete = async ({ taskName, language = 'en' }) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: language === 'uz' ? '✅ Bajarildi!' : '✅ Task Complete!',
        body:  language === 'uz' ? `${taskName} tugadi. Ajoyib!` : `${taskName} done. Great work!`,
        data:  { type: 'task_done' },
        sound: true,
        ...(Platform.OS === 'android' && { channelId: 'intizom', color: '#10B981' }),
      },
      trigger: null,
    });
  } catch (e) { console.warn('showTaskComplete:', e?.message); }
};

// Dismiss all visible notifications
export const dismissAll = async () => {
  try { await Notifications.dismissAllNotificationsAsync(); } catch {}
};

// End-of-day daily summary
export const scheduleEndOfDaySummary = async ({ time = '22:00', completed = 0, total = 0, language = 'en' }) => {
  try {
    await Notifications.cancelScheduledNotificationAsync('end-of-day').catch(() => {});
    const [hh, mm] = time.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      identifier: 'end-of-day',
      content: {
        title: language === 'uz' ? '📊 Kun xulosa' : '📊 End of Day',
        body:  language === 'uz'
          ? `${total} ta vazifadan ${completed} tasini bajardingiz 💪`
          : `${completed} of ${total} tasks completed 💪`,
        data:  { type: 'summary' },
        sound: true,
        ...(Platform.OS === 'android' && { channelId: 'intizom' }),
      },
      trigger: { hour: hh, minute: mm, repeats: true },
    });
  } catch (e) { console.warn('scheduleEndOfDaySummary:', e?.message); }
};
