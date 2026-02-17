/**
 * Notifications — local push notification scheduler
 * Uses expo-notifications (lazy loaded, non-fatal).
 * Schedules daily mission reminders.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_NOTIF_SCHEDULED = "vp_notif_daily_scheduled";

/**
 * Request notification permissions and schedule daily reminder.
 * Safe to call multiple times — will only schedule once.
 * All errors are caught silently.
 */
export async function setupDailyReminder(): Promise<boolean> {
  try {
    // Check if already scheduled
    const alreadyScheduled = await AsyncStorage.getItem(KEY_NOTIF_SCHEDULED);
    if (alreadyScheduled === "true") return true;

    const Notifications = require("expo-notifications");

    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("[Notifications] Permission not granted");
      return false;
    }

    // Cancel existing scheduled notifications to avoid duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule daily notification at 10:00 AM
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🎯 Daily Missions Ready!",
        body: "New missions are waiting for you. Complete them to earn XP!",
        sound: true,
      },
      trigger: {
        type: "daily",
        hour: 10,
        minute: 0,
      },
    });

    await AsyncStorage.setItem(KEY_NOTIF_SCHEDULED, "true");
    return true;
  } catch (err: any) {
    console.warn("[Notifications] Setup failed:", err?.message);
    return false;
  }
}

/**
 * Cancel all scheduled notifications and reset tracking.
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    const Notifications = require("expo-notifications");
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem(KEY_NOTIF_SCHEDULED);
  } catch {
    // expo-notifications not available
  }
}

/**
 * Send an instant local notification (for XP gains, streak milestones, etc.)
 */
export async function sendLocalNotification(
  title: string,
  body: string
): Promise<void> {
  try {
    const Notifications = require("expo-notifications");

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;

    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null, // Fire immediately
    });
  } catch {
    // Non-fatal
  }
}
