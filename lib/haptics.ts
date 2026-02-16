/**
 * Haptic Feedback Utilities
 * Provides consistent haptic feedback throughout the app.
 * expo-haptics is lazy-loaded to prevent native module crashes at import time.
 */
import { Platform } from "react-native";

const isHapticsAvailable = Platform.OS === "ios" || Platform.OS === "android";

/**
 * Get the Haptics module lazily (only imported when first used).
 * This prevents native module initialization from crashing at module load.
 */
let _haptics: typeof import("expo-haptics") | null = null;
function getHaptics(): typeof import("expo-haptics") | null {
  if (!_haptics) {
    try {
      _haptics = require("expo-haptics");
    } catch (e) {
      console.warn("[Haptics] expo-haptics not available:", e);
      return null;
    }
  }
  return _haptics;
}

/**
 * Trigger haptic feedback safely (no-op on web/unsupported)
 */
async function safeHaptic(fn: () => Promise<void>): Promise<void> {
  if (!isHapticsAvailable) return;
  try {
    await fn();
  } catch (error) {
    // Silently fail — haptics are non-critical
    console.debug("[Haptics] Feedback failed:", error);
  }
}

// ─── Feedback Types ──────────────────────────────────

/** Light tap — button presses, selections */
export function hapticLight(): Promise<void> {
  return safeHaptic(() => {
    const H = getHaptics();
    if (!H) return Promise.resolve();
    return H.impactAsync(H.ImpactFeedbackStyle.Light);
  });
}

/** Medium tap — confirmations, toggles */
export function hapticMedium(): Promise<void> {
  return safeHaptic(() => {
    const H = getHaptics();
    if (!H) return Promise.resolve();
    return H.impactAsync(H.ImpactFeedbackStyle.Medium);
  });
}

/** Heavy tap — important actions */
export function hapticHeavy(): Promise<void> {
  return safeHaptic(() => {
    const H = getHaptics();
    if (!H) return Promise.resolve();
    return H.impactAsync(H.ImpactFeedbackStyle.Heavy);
  });
}

/** Success feedback — wallet connected, mission completed */
export function hapticSuccess(): Promise<void> {
  return safeHaptic(() => {
    const H = getHaptics();
    if (!H) return Promise.resolve();
    return H.notificationAsync(H.NotificationFeedbackType.Success);
  });
}

/** Error feedback — failed actions, invalid input */
export function hapticError(): Promise<void> {
  return safeHaptic(() => {
    const H = getHaptics();
    if (!H) return Promise.resolve();
    return H.notificationAsync(H.NotificationFeedbackType.Error);
  });
}

/** Warning feedback — destructive actions */
export function hapticWarning(): Promise<void> {
  return safeHaptic(() => {
    const H = getHaptics();
    if (!H) return Promise.resolve();
    return H.notificationAsync(H.NotificationFeedbackType.Warning);
  });
}

/** Selection tick — scroll snapping, tab switching */
export function hapticSelection(): Promise<void> {
  return safeHaptic(() => {
    const H = getHaptics();
    if (!H) return Promise.resolve();
    return H.selectionAsync();
  });
}

// ─── Composite Patterns ──────────────────────────────

/** Double-tap pattern for XP gained */
export async function hapticXpGained(): Promise<void> {
  await hapticSuccess();
  setTimeout(() => hapticLight(), 150);
}

/** Connect success pattern */
export async function hapticConnectSuccess(): Promise<void> {
  await hapticHeavy();
  setTimeout(() => hapticSuccess(), 200);
}

/** Disconnect pattern */
export async function hapticDisconnect(): Promise<void> {
  await hapticMedium();
}
