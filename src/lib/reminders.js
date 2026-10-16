import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'mindspace.reminderHour';

// Expo Go on Android (SDK 53+) throws as soon as expo-notifications is
// imported. So we never import it at the top of a file: it is loaded only
// when running as a real installed build, where it works fully.
const IN_EXPO_GO = Constants.appOwnership === 'expo';
export const remindersSupported = !(IN_EXPO_GO && Platform.OS === 'android');

let Notifications = null;
function load() {
  if (!remindersSupported) return null;
  if (Notifications) return Notifications;
  try {
    Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch {
    Notifications = null;
  }
  return Notifications;
}

export async function getReminderHour() {
  const v = await SecureStore.getItemAsync(KEY).catch(() => null);
  return v === null || v === undefined ? null : Number(v);
}

// Local, on-device daily nudge. Nothing is sent to a server.
// Returns true on success, false if permission was refused.
export async function setDailyReminder(hour) {
  const N = load();
  if (!N) throw new Error('unsupported');

  await N.cancelAllScheduledNotificationsAsync();
  if (hour === null) {
    await SecureStore.deleteItemAsync(KEY).catch(() => {});
    return true;
  }

  const perm = await N.requestPermissionsAsync();
  if (!perm.granted) return false;

  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync('reminders', {
      name: 'Daily check-in reminder',
      importance: N.AndroidImportance.DEFAULT,
    });
  }

  await N.scheduleNotificationAsync({
    content: {
      title: 'How are you feeling?',
      body: 'A 10-second mood check-in helps you spot patterns over time.',
    },
    trigger: {
      type: N.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
      channelId: 'reminders',
    },
  });
  await SecureStore.setItemAsync(KEY, String(hour));
  return true;
}
