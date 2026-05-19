import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  // Configure how notifications are presented while the app is foregrounded.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Fire an immediate local notification for a new group transaction.
 * Returns true on success, false if the platform doesn't support it,
 * so GroupDataProvider can fall back to the in-app banner.
 */
export async function sendTransactionNotification(
  description: string,
  amountCents: number,
): Promise<boolean> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💳 New group purchase',
        body: `${description} · €${(amountCents / 100).toFixed(2)}`,
        sound: true,
      },
      trigger: null, // fire immediately
    });
    return true;
  } catch {
    return false;
  }
}
